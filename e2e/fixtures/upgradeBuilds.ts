import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

/**
 * 升级用例（AC E4）的构建产物读取器。
 *
 * A / B 由 `e2e/scripts/build-e2e-variants.mjs` 用 `e2e/fixtures/vite.e2e.config.ts` 产出，
 * 输出在 gitignored 的 `.playwright/e2e-upgrade-builds/<A|B>`。本模块只读产物，供用例断言：
 * 主入口 hash、SW 预缓存清单 hash、缓存名、以及「A 独有 / B 缺失」的 chunk。
 */
export const REPO_ROOT = process.cwd();
export const BUILD_ROOT = path.join(REPO_ROOT, '.playwright', 'e2e-upgrade-builds');

export type BuildVariant = 'A' | 'B';

export interface BuildInfo {
  variant: BuildVariant;
  dir: string;
  /** index.html 中 `<script type="module" src>` 指向的主入口，如 /dezhou/assets/index-xxx.js */
  mainScript: string;
  /** 构建注入标记的标识符（chunk 内出现；值随变体不同，minify 后引号形式不固定） */
  marker: string;
  /** sw.js 注入的预缓存清单 hash（8 位） */
  manifestHash: string;
  /** SW 缓存名：poker-training-<APP_VERSION>-<manifestHash> */
  cacheName: string;
  /** sw.js 预缓存清单（/dezhou/ 前缀） */
  precache: string[];
}

/**
 * APP_VERSION 事实源：与 vite.config.ts:13-16 同源 —— package.json version 经部署序号
 * （CI GITHUB_RUN_NUMBER，本地 0）递增 patch 后由 `define` 注入 `__APP_BUILD_INFO__`。
 *
 * 旧实现从 app.ts 正则读取 `APP_VERSION = '<literal>'`；自 913dd76 起 APP_VERSION 改为
 * `BUILD_INFO.version`（Vite define 派生），字面量消失，故改读 package.json 并镜像
 * `resolveAppVersion` 规则。tsconfig.e2e 的 include 不含 src，故内联镜像避免跨配置类型依赖。
 */
export function readAppVersion(): string {
  const pkg = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8')) as { version?: string };
  const base = pkg.version;
  if (!base) throw new Error('无法从 package.json 读取 version');
  const sequence = Number.parseInt(process.env.GITHUB_RUN_NUMBER ?? '', 10);
  return applyDeploySequence(base, Number.isNaN(sequence) ? 0 : sequence);
}

/** 与 src/shared/constants/app.ts 的 resolveAppVersion 同规则：序号 > 0 时递增 patch。 */
function applyDeploySequence(baseVersion: string, sequence: number): string {
  if (!/^\d+\.\d+\.\d+$/.test(baseVersion)) return baseVersion;
  const [major = '0', minor = '0', patch = '0'] = baseVersion.split('.');
  const patchNumber = Number.parseInt(patch, 10);
  if (!Number.isFinite(sequence) || sequence <= 0 || !Number.isFinite(patchNumber)) {
    return baseVersion;
  }
  return `${major}.${minor}.${patchNumber + Math.floor(sequence)}`;
}

export function variantDir(variant: BuildVariant): string {
  return path.join(BUILD_ROOT, variant);
}

export function readBuildInfo(variant: BuildVariant, appVersion = readAppVersion()): BuildInfo {
  const dir = variantDir(variant);
  const indexHtml = readFileSync(path.join(dir, 'index.html'), 'utf8');
  const swSource = readFileSync(path.join(dir, 'sw.js'), 'utf8');

  const scriptMatch = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(indexHtml);
  const mainScript = scriptMatch?.[1];
  if (!mainScript) throw new Error(`变体 ${variant} 的 index.html 未找到 module 入口`);
  const manifestMatch = /const MANIFEST_HASH = '([^']+)'/.exec(swSource);
  const manifestHash = manifestMatch?.[1];
  if (!manifestHash) throw new Error(`变体 ${variant} 的 sw.js 未找到注入的 MANIFEST_HASH`);
  // 注入后的清单行形如：const PRECACHE_MANIFEST = [...] || [];
  const manifestJsonMatch = /const PRECACHE_MANIFEST = (\[.*?\]) \|\| \[\];/.exec(swSource);
  const manifestJson = manifestJsonMatch?.[1];
  if (!manifestJson) throw new Error(`变体 ${variant} 的 sw.js 未找到预缓存清单`);
  const precache = JSON.parse(manifestJson) as string[];

  return {
    variant,
    dir,
    mainScript,
    marker: '__E2E_BUILD_VARIANT__',
    manifestHash,
    cacheName: `poker-training-${appVersion}-${manifestHash}`,
    precache,
  };
}

/** 读取变体主入口 chunk 内容（用于断言构建标记确实进入产物） */
export function readMainChunk(info: BuildInfo): string {
  return readFileSync(path.join(info.dir, info.mainScript.replace(/^\/dezhou\//, '')), 'utf8');
}

/**
 * 找「A 有、B 没有」的 JS chunk（按文件名前缀，如 HelpHome）。
 * 这些文件名 hash 由 chunk 内容（含构建标记）决定，因此 A / B 必然不同名；
 * 切到 B 后该 URL 在服务器上真 404，只能从 A 的旧 SW 缓存取得。
 */
export function findAOnlyChunk(
  a: BuildInfo,
  b: BuildInfo,
  filePrefix: string,
): { file: string; url: string } {
  const aAssets = readdirSync(path.join(a.dir, 'assets'));
  const bAssets = new Set(readdirSync(path.join(b.dir, 'assets')));
  const file = aAssets.find(
    (name) => name.startsWith(filePrefix) && name.endsWith('.js') && !bAssets.has(name),
  );
  if (!file) throw new Error(`未在 A 中找到 B 缺失的 ${filePrefix}*.js chunk`);
  if (existsSync(path.join(b.dir, 'assets', file))) {
    throw new Error(`变体 B 意外包含 A 的 chunk：${file}`);
  }
  return { file, url: `/dezhou/assets/${file}` };
}
