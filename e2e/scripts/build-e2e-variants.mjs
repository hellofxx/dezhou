#!/usr/bin/env node
/**
 * E2E 升级用例（AC E4）的构建脚本：用 `e2e/fixtures/vite.e2e.config.ts` 依次产出 A / B
 * 两套真实 Vite 构建产物。
 *
 * - 只用 node: 内置模块 + 仓库内 vite（零新依赖）；
 * - 输出到 gitignored 的 `.playwright/e2e-upgrade-builds/<variant>`，绝不污染 dist/；
 * - `--clean` 删除临时产物（用例 afterAll 调用），失败时以非 0 退出。
 *
 * A / B 的差异来自测试构建注入的 chunk 标记（见 vite.e2e.config.ts）：chunk 内容不同 →
 * 文件名 hash 不同 → index.html 引用与 SW 预缓存清单 hash 都不同，可用于验证「部署切换」。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT_ROOT = path.join(ROOT, '.playwright', 'e2e-upgrade-builds');
const VITE_BIN = path.join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
const CONFIG = path.join(ROOT, 'e2e', 'fixtures', 'vite.e2e.config.ts');
const VARIANTS = ['A', 'B'];

if (process.argv.includes('--clean')) {
  rmSync(OUT_ROOT, { recursive: true, force: true });
  console.log(`[e2e-builds] 已清理 ${path.relative(ROOT, OUT_ROOT)}`);
  process.exit(0);
}

if (!existsSync(VITE_BIN)) {
  console.error(`[e2e-builds] 未找到 vite：${VITE_BIN}（先安装依赖）`);
  process.exit(1);
}

for (const variant of VARIANTS) {
  const outDir = path.join(OUT_ROOT, variant);
  execFileSync(
    process.execPath,
    [VITE_BIN, 'build', '--config', CONFIG, '--logLevel', 'warn'],
    {
      cwd: ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        E2E_BUILD_VARIANT: variant,
        E2E_BUILD_OUTDIR: path.relative(ROOT, outDir).split(path.sep).join('/'),
      },
    },
  );
  for (const required of ['index.html', 'sw.js']) {
    if (!existsSync(path.join(outDir, required))) {
      console.error(`[e2e-builds] 变体 ${variant} 缺少产物 ${required}`);
      process.exit(1);
    }
  }
  console.log(`[e2e-builds] 变体 ${variant} → ${path.relative(ROOT, outDir)}`);
}
