import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * `pnpm test:e2e` 前置校验：E2E 跑的是生产构建产物，不是 dev server。
 *
 * 缺构建时必须直接失败并给出修复命令，禁止让 Playwright 起一个空 dist 的预览服务
 * （那样只会得到一堆 404，把「没构建」误诊成「应用坏了」）。
 */
const distIndex = path.join(process.cwd(), 'dist', 'index.html');

if (!existsSync(distIndex)) {
  console.error(
    '[test:e2e] 未找到 dist/index.html：E2E 门禁只跑生产构建。\n' +
      '  修复：pnpm build（或直接运行 pnpm verify:e2e = verify → build → size:check → test:e2e）',
  );
  process.exit(1);
}
