import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderSwSource, swPrecachePlugin } from '../../scripts/sw-precache-plugin.ts';

/**
 * Service Worker 全量预缓存守卫（P0-1，ADR-0004）。
 *
 * 保护三组不变式：
 * 1. public/sw.js 模板：两个构建占位符各出现一次；不得重新引入「跳过等待 / 立即接管」
 *    调用（部署竞态回归锁）；meta 缓存在 activate 清理排除条件中；fetch 三规则保留。
 * 2. renderSwSource 纯函数：注入无残留、清单可回解析、hash = sha256(排序去重 JSON) 前 8 位、
 *    乱序 / 重复输入结果不变（同版本重部署的缓存名稳定性）。
 * 3. 插件钩子：generateBundle 为 post 对象钩子，排除 .map / sw.js 自身，base 前缀正确，
 *    publicDir 文件补入清单；vite.config.ts 已接线（防静默拆除）。
 *
 * 静态 import 插件文件使其纳入 tsc 程序（tsconfig include 仅 src）。
 * 扫描面自检：模板 ≥80 行、假 bundle ≥5 key、public 扫描 ≥4 文件，路径失效即红。
 */

const SW_TEMPLATE_URL = new URL('../../public/sw.js', import.meta.url);
const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url));
const VITE_CONFIG_URL = new URL('../../vite.config.ts', import.meta.url);
const TEMPLATE = readFileSync(SW_TEMPLATE_URL, 'utf8');

const MANIFEST_PLACEHOLDER = 'self.__PRECACHE_MANIFEST__';
const HASH_PLACEHOLDER = 'self.__MANIFEST_HASH__';
/** 从注入后的源码回提取清单 JSON（与模板的 `|| []` 降级写法配对） */
const MANIFEST_LINE_RE = /const PRECACHE_MANIFEST = (\[[\s\S]*?\]) \|\| \[\];/;

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

function extractManifest(source: string): string[] {
  const match = MANIFEST_LINE_RE.exec(source);
  if (!match) throw new Error('注入后的 sw.js 中找不到清单行');
  return JSON.parse(match[1] ?? '[]') as string[];
}

describe('sw.js 模板不变式', () => {
  it('两个构建占位符各出现一次', () => {
    expect(countOccurrences(TEMPLATE, MANIFEST_PLACEHOLDER)).toBe(1);
    expect(countOccurrences(TEMPLATE, HASH_PLACEHOLDER)).toBe(1);
  });

  it('不得重新引入跳过等待 / 立即接管调用（部署竞态回归锁）', () => {
    // 动态拼接标记，避免守卫自身源码成为扫描样本；模板注释也不得出现这两个词
    const forbidden = ['skip' + 'Waiting', 'clients.' + 'claim'];
    for (const marker of forbidden) {
      expect(TEMPLATE.includes(marker), `模板不得包含 ${marker}`).toBe(false);
    }
  });

  it('缓存名含清单 hash，meta 缓存在清理排除条件中', () => {
    expect(TEMPLATE.includes("'poker-training-' + CACHE_VERSION + '-' + MANIFEST_HASH")).toBe(true);
    expect(TEMPLATE.includes("const META_CACHE = 'poker-training-meta'")).toBe(true);
    expect(TEMPLATE.includes('key !== CACHE_NAME')).toBe(true);
    expect(TEMPLATE.includes('key !== previous')).toBe(true);
    expect(TEMPLATE.includes('key !== META_CACHE')).toBe(true);
  });

  it('install 分批重试且 shell 强制 reload；fetch 三规则保留、导航写缓存前判 response.ok', () => {
    expect(TEMPLATE.includes("cache: 'reload'")).toBe(true);
    expect(TEMPLATE.includes('PRECACHE_BATCH_SIZE = 32')).toBe(true);
    expect(TEMPLATE.includes("event.request.mode === 'navigate'")).toBe(true);
    expect(TEMPLATE.includes("BASE + 'assets/'")).toBe(true);
    expect(TEMPLATE.includes('url.origin !== self.location.origin')).toBe(true);
    expect(TEMPLATE.includes('if (response.ok)')).toBe(true);
  });

  it('资产匹配必须 ignoreVary（模块请求带 Origin 头而预缓存请求没有，Vary: Origin 下会离线 miss）', () => {
    expect(TEMPLATE.includes('caches.match(event.request, { ignoreVary: true })')).toBe(true);
  });

  it('扫描面自检：模板 ≥80 行（防路径失效空跑）', () => {
    expect(TEMPLATE.split('\n').length).toBeGreaterThanOrEqual(80);
  });
});

describe('renderSwSource 确定性与注入', () => {
  const urls = ['/dezhou/index.html', '/dezhou/assets/app.js', '/dezhou/manifest.json'];

  it('注入后无占位符残留，清单 JSON 可回解析且为排序去重结果', () => {
    const { source, urls: rendered } = renderSwSource(TEMPLATE, urls);
    expect(source.includes(MANIFEST_PLACEHOLDER)).toBe(false);
    expect(source.includes(HASH_PLACEHOLDER)).toBe(false);
    expect(extractManifest(source)).toEqual([...urls].toSorted());
    expect(rendered).toEqual([...urls].toSorted());
  });

  it('hash = sha256(排序清单 JSON) 前 8 位，并注入 MANIFEST_HASH 行', () => {
    const { source, hash } = renderSwSource(TEMPLATE, urls);
    const expected = createHash('sha256')
      .update(JSON.stringify([...urls].toSorted()))
      .digest('hex')
      .slice(0, 8);
    expect(hash).toBe(expected);
    expect(hash).toMatch(/^[0-9a-f]{8}$/);
    expect(source.includes(`const MANIFEST_HASH = '${hash}' || 'dev';`)).toBe(true);
  });

  it('乱序 / 重复输入结果不变（同版本重部署缓存名稳定）', () => {
    const a = renderSwSource(TEMPLATE, ['/dezhou/b.js', '/dezhou/a.js', '/dezhou/a.js']);
    const b = renderSwSource(TEMPLATE, ['/dezhou/a.js', '/dezhou/b.js']);
    expect(a.source).toBe(b.source);
    expect(a.hash).toBe(b.hash);
    expect(a.urls).toEqual(['/dezhou/a.js', '/dezhou/b.js']);
  });
});

describe('swPrecachePlugin 钩子与接线', () => {
  it('vite.config.ts 已注册插件（防静默拆除）', () => {
    const config = readFileSync(VITE_CONFIG_URL, 'utf8');
    expect(config.includes('swPrecachePlugin()')).toBe(true);
    expect(config.includes('./scripts/sw-precache-plugin.ts')).toBe(true);
  });

  it('generateBundle(post)：排除 .map / sw.js，base 前缀，public 文件补入清单', () => {
    const plugin = swPrecachePlugin();
    expect(plugin.apply).toBe('build');

    const configResolved = plugin.configResolved;
    if (typeof configResolved !== 'function') throw new Error('configResolved 应为函数钩子');
    type ResolvedConfigArg = Parameters<typeof configResolved>[0];
    configResolved.call({} as ThisParameterType<typeof configResolved>, {
      base: '/dezhou/',
      publicDir: PUBLIC_DIR,
    } as unknown as ResolvedConfigArg);

    const generateBundle = plugin.generateBundle;
    if (!generateBundle || typeof generateBundle === 'function') {
      throw new Error('generateBundle 应为对象钩子');
    }
    expect(generateBundle.order).toBe('post');

    const handler = generateBundle.handler;
    type HandlerContext = ThisParameterType<typeof handler>;
    type OutputOptionsArg = Parameters<typeof handler>[0];
    type BundleArg = Parameters<typeof handler>[1];
    const emitted: { fileName: string; source: string }[] = [];
    const context = {
      emitFile: (file: { type: string; fileName: string; source: string | Uint8Array }) => {
        emitted.push({ fileName: file.fileName, source: String(file.source) });
        return 'sw-ref';
      },
    } as unknown as HandlerContext;
    const fakeBundle = {
      'assets/app.js': {},
      'assets/style.css': {},
      'assets/app.js.map': {},
      'sw.js': {},
      'index.html': {},
    } as unknown as BundleArg;
    // 扫描面自检：假 bundle ≥5 key
    expect(Object.keys(fakeBundle).length).toBeGreaterThanOrEqual(5);

    handler.call(context, {} as OutputOptionsArg, fakeBundle, true);

    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.fileName).toBe('sw.js');
    const source = emitted[0]?.source ?? '';
    expect(source.includes(MANIFEST_PLACEHOLDER)).toBe(false);
    expect(source.includes(HASH_PLACEHOLDER)).toBe(false);
    const manifest = extractManifest(source);
    expect(manifest).toContain('/dezhou/assets/app.js');
    expect(manifest).toContain('/dezhou/assets/style.css');
    expect(manifest).toContain('/dezhou/index.html');
    expect(manifest.some((url) => url.endsWith('.map'))).toBe(false);
    expect(manifest).not.toContain('/dezhou/sw.js');
    // public 四文件（sw.js 自身排除）
    for (const file of ['cards/back.svg', 'icons/icon-192.svg', 'icons/icon-512.svg', 'manifest.json']) {
      expect(manifest).toContain('/dezhou/' + file);
    }
    // 扫描面自检：public 扫描 ≥4 文件（清单中非 assets / 非 index.html 的部分）
    const publicFiles = manifest.filter(
      (url) => !url.startsWith('/dezhou/assets/') && url !== '/dezhou/index.html',
    );
    expect(publicFiles.length).toBeGreaterThanOrEqual(4);
  });
});