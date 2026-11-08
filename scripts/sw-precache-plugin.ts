import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

/** renderSwSource 产物：注入后的 SW 源码、清单 hash、去重排序后的清单 URL。 */
export interface SwRenderResult {
  source: string;
  hash: string;
  urls: string[];
}

const MANIFEST_PLACEHOLDER = 'self.__PRECACHE_MANIFEST__';
const HASH_PLACEHOLDER = 'self.__MANIFEST_HASH__';

/** 纳入预缓存的构建产物扩展名（sw.js 自身与 .map 在收集时单独排除）。 */
const ASSET_EXT_RE = /\.(?:js|css|woff2?|svg|html|json|png)$/;

/**
 * 纯函数：去重 + 排序保证 hash 确定性 → sha256(清单 JSON) 前 8 位 → 替换两个占位符。
 * 用函数式 replace，避免清单 URL 中可能出现的 `$` 被当作替换模式展开。
 */
export function renderSwSource(template: string, urls: readonly string[]): SwRenderResult {
  const sorted = Array.from(new Set(urls)).toSorted();
  const manifestJson = JSON.stringify(sorted);
  const hash = createHash('sha256').update(manifestJson).digest('hex').slice(0, 8);
  const source = template
    .replace(MANIFEST_PLACEHOLDER, () => manifestJson)
    .replace(HASH_PLACEHOLDER, () => `'${hash}'`);
  return { source, hash, urls: sorted };
}

/** 递归收集 publicDir 下除 sw.js 外的文件，返回相对 rootDir 的 posix 路径。 */
function walkPublicFiles(dir: string, rootDir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkPublicFiles(full, rootDir));
    } else if (entry.isFile() && entry.name !== 'sw.js') {
      out.push(path.relative(rootDir, full).split(path.sep).join('/'));
    }
  }
  return out;
}

/**
 * 构建期把全量预缓存清单与清单 hash 注入 public/sw.js 模板，再 emitFile 覆盖 public 拷贝。
 * - generateBundle 必须 order:'post'：index.html / CSS 由其他插件在 generateBundle 产出，
 *   默认顺序会漏收（Vite 8.1.5 已核实）。
 * - Vite 8 的 public 拷贝在 vite:prepare-out-dir 的 renderStart(pre)，早于 generateBundle 写盘，
 *   故 emitFile('sw.js') 覆盖可行；若未来 Vite 升级变动，守卫的产物检查会暴露。
 */
export function swPrecachePlugin(): Plugin {
  let base = '/';
  let publicDir = '';
  return {
    name: 'sw-precache',
    apply: 'build',
    configResolved(config) {
      base = config.base;
      publicDir = config.publicDir;
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        if (!publicDir) return;
        const urls: string[] = [];
        for (const key of Object.keys(bundle)) {
          if (key === 'sw.js' || key.endsWith('.map') || !ASSET_EXT_RE.test(key)) continue;
          urls.push(base + key);
        }
        for (const rel of walkPublicFiles(publicDir, publicDir)) {
          urls.push(base + rel);
        }
        const template = readFileSync(path.join(publicDir, 'sw.js'), 'utf8');
        const { source } = renderSwSource(template, urls);
        this.emitFile({ type: 'asset', fileName: 'sw.js', source });
      },
    },
  };
}