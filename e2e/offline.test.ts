import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { APP_ROOT, navigateFromSidebar, skipOnboarding } from './fixtures/app';

/**
 * L4 离线冒烟：首次加载完成全量预缓存后，断网打开从未访问过的深层路由。
 *
 * 约束（ADR-0004 / public/sw.js）：
 * - SW 不调用 skipWaiting / clients.claim，因此首次加载的页面不受控；
 *   这里用「正常重载」获得控制，再断网（不修改 SW 生命周期）
 * - 预缓存完成的判定 = `navigator.serviceWorker.ready`（install 全量 addAll 完成后才 activate）
 * - 零噪声：本用例不登记任何期望错误；console error / pageerror / 失败请求 / 4xx-5xx 一律失败
 */
const HELP_TITLE = '帮助中心';
const HELP_QUICKSTART = '快速上手';
const HELP_HERO_TITLE = '欢迎来到牌室';

test('首次加载完成预缓存后，离线仍可渲染从未访问过的深层路由 /dezhou/help', async ({
  page,
  context,
}) => {
  const guard = guardBrowserErrors(page);

  // 先走真实 UI 跳过引导（否则 /help 会被 OnboardingGate 重定向回 /onboarding）
  await skipOnboarding(page);

  // 等待 SW 完成全量预缓存并激活：ready 解析即 install（addAll）与 activate 均已完成
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    if (!registration.active) throw new Error('service worker 未激活，预缓存未完成');
  });

  // 首次加载不会被新 SW 接管（模板不 claim），用正常重载取得控制权
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  // 在线阶段必须零噪声（离线阶段同样是零噪声）
  guard.assertClean();

  await context.setOffline(true);

  // /dezhou/help 从未访问过：导航走 SW 的 app-shell 兜底，路由与 chunk 均来自预缓存
  await page.goto(`${APP_ROOT}help`);
  await expect(page.getByRole('heading', { level: 1, name: HELP_TITLE })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: HELP_QUICKSTART })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: HELP_HERO_TITLE })).toBeVisible();

  guard.assertClean();

  // 断网状态下客户端路由切换同样可用（同一份预缓存）
  await navigateFromSidebar(page, '进度统计');
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
  await expect(page.getByRole('heading', { level: 1, name: '进度统计' })).toBeVisible();

  guard.assertClean();
});
