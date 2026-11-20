import { defineConfig, devices } from '@playwright/test';

/**
 * E2E 门禁配置（生产构建 + 真实 Chromium）。
 *
 * 事实源边界：
 * - 用例规范 / 分层 / CI 位置见 `docs/testing/README.md`（§2 / §11）
 * - 用例文件放在仓库根 e2e 目录，后缀 `.test.ts`（Vitest 双项目只收集 src，两者不交叉）
 * - 服务命令以本文件 `webServer.command` 为准，必须指向 `vite preview`（真实 dist 产物）
 *
 * 失败即证据：`retries: 0` + `forbidOnly: true`，`trace` / `screenshot` 只在失败时保留，
 * 禁止用重试把偶发失败刷成绿色。
 */
const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;

/**
 * 本地兜底通道（CI 不设置）：网络无法下载 Playwright 自带 Chromium 时，
 * 可用 PLAYWRIGHT_LOCAL_CHANNEL=chrome 借用系统已安装的 Chrome 做一次本地验证。
 * 门禁事实源仍是默认的 bundled Chromium —— CI 永远走默认分支。
 */
const localChannel = process.env.PLAYWRIGHT_LOCAL_CHANNEL;

export default defineConfig({
  testDir: './e2e',
  // 只收集 e2e 目录下的 Playwright 用例；夹具（fixtures/）不参与收集
  testMatch: '**/*.test.ts',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  // 本地允许聚焦调试用例会静默缩小门禁覆盖面，因此永远禁止；同时一律不重试
  forbidOnly: true,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // 应用默认语言为 zh（i18n config lng: 'zh'），断言依赖真实中文文案
    locale: 'zh-CN',
  },
  projects: [
    {
      name: 'chromium',
      // 移动视口用例只在 mobile-chromium 跑：桌面 project 显式排除，避免两套视口互相污染
      testIgnore: '**/mobile.test.ts',
      use: {
        ...devices['Desktop Chrome'],
        ...(localChannel ? { channel: localChannel } : {}),
      },
    },
    {
      // 移动视口门禁：仅收集 mobile.test.ts（Pixel 7 等价视口 + 触摸）
      name: 'mobile-chromium',
      testMatch: '**/mobile.test.ts',
      use: {
        ...devices['Pixel 7'],
        ...(localChannel ? { channel: localChannel } : {}),
      },
    },
  ],
  webServer: {
    // base 为 '/dezhou/'（vite.config.ts），测试路径一律带 /dezhou/ 前缀
    command: `pnpm exec vite preview --host ${HOST} --port ${PORT} --strictPort`,
    url: `${BASE_URL}/dezhou/`,
    // 仅本地复用已存在的预览服务；CI 必须用自己的构建产物起服务
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
