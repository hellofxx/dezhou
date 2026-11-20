/**
 * E2E「升级」夹具构建配置：包装主 Vite 配置，只做两件测试专用的事。
 *
 * 1. `build.outDir` 指到 gitignored 临时目录（`.playwright/e2e-upgrade-builds/<variant>`），
 *    绝不污染生产 `dist/`；
 * 2. 给每个 JS chunk 前置一行构建标记（`/* e2e-build:A|B *\/`）—— 标记进入 chunk 字节，
 *    从而改变 chunk 文件名 hash、index.html 的 script 引用与 SW 预缓存清单 hash，使 A / B
 *    两次构建具备可验证差异。
 *
 * 注：本配置优先尝试了 `build.rollupOptions.output.banner`，但在 Vite 8.1.5 / Rolldown 下
 * banner 会被静默忽略（产物中无标记、A / B 清单 hash 完全相同，已实测），因此改用
 * `renderChunk` 钩子注入同样的标记；该钩子参与 chunk 内容与 hash 计算。
 *
 * 生产构建（`pnpm build`）不加载本文件，源码与 `vite.config.ts` 均不受影响。
 * 由 `e2e/scripts/build-e2e-variants.mjs` 通过环境变量驱动：
 * - `E2E_BUILD_VARIANT` = A | B（同时作为 banner 标记）
 * - `E2E_BUILD_OUTDIR`   = 输出目录（相对仓库根）
 */
import path from 'node:path';
import { defineConfig, loadConfigFromFile, mergeConfig, type Plugin, type UserConfig } from 'vite';

const VARIANTS = ['A', 'B'] as const;
type Variant = (typeof VARIANTS)[number];

function resolveVariant(): Variant {
  const raw = process.env.E2E_BUILD_VARIANT ?? 'A';
  if (!VARIANTS.includes(raw as Variant)) {
    throw new Error(`E2E_BUILD_VARIANT 必须是 A 或 B，收到：${raw}`);
  }
  return raw as Variant;
}

/**
 * 用 `loadConfigFromFile` 单独加载主配置，而不是直接 `import '../../vite.config'`：
 * Vite 打包配置时注入的 `__dirname` 指向配置文件自身目录，直接 import 会让主配置里的
 * `path.resolve(__dirname, './src')` 解析到 `e2e/fixtures/src`（别名失效）。
 */
export default defineConfig(async (): Promise<UserConfig> => {
  const variant = resolveVariant();
  const root = process.cwd();
  const outDir = process.env.E2E_BUILD_OUTDIR ?? path.posix.join('.playwright/e2e-upgrade-builds', variant);

  const loaded = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    path.resolve(root, 'vite.config.ts'),
    root,
  );
  if (!loaded) throw new Error('无法加载主 Vite 配置 vite.config.ts');

  const markerPlugin: Plugin = {
    name: `e2e-build-marker:${variant}`,
    apply: 'build',
    renderChunk(code) {
      return { code: `globalThis.__E2E_BUILD_VARIANT__=${JSON.stringify(variant)};\n${code}`, map: null };
    },
  };

  return mergeConfig(loaded.config, {
    plugins: [markerPlugin],
    build: {
      outDir,
      // 每次构建从空目录开始，避免残留 assets 混入预缓存清单
      emptyOutDir: true,
    },
  });
});
