import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import {
  MOBILE_NAV_ITEMS,
  expectPageHeading,
  mobileNav,
  navigateFromMobileNav,
  openFromTopBar,
  sidebarNav,
  skipOnboarding,
} from './fixtures/app';

/**
 * L4 移动视口（mobile-chromium）：底部导航是移动端唯一主导航（<768px 隐藏侧边栏）。
 *
 * 冻结 IA：
 * - 底栏 5 项 = 学习路径 / 课程 / 训练 / 速训 / 进度中心（设置与帮助不占底栏）
 * - 「训练」直接进 `/drill`（不再弹训练入口 Sheet），h1 = 训练场
 * - 「速训」进 `/quick`，h1 = 速训；「进度中心」进 `/progress`，h1 = 进度中心
 * - 帮助中心只经顶栏按钮（移动端可见、桌面端隐藏）
 *
 * 桌面用例不受影响：chromium project 通过 testIgnore 排除本文件。
 */
test('移动端 GTO 会话可开始、关闭反馈后仍可继续', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);
  await page.goto('/dezhou/gto-simulator');
  await page.getByRole('button', { name: '开始 GTO 训练' }).click();
  await expect(page).toHaveURL(/\/dezhou\/gto-simulator\/session\/active$/);

  await page.getByRole('button', { name: 'Fold' }).click();
  await expect(page.getByRole('dialog', { name: '答题反馈' })).toBeVisible();
  await page.getByRole('button', { name: '关闭' }).click();

  await expect(page.getByRole('button', { name: '查看反馈' })).toBeVisible();
  await page.getByRole('button', { name: '查看反馈' }).click();
  await expect(page.getByRole('dialog', { name: '答题反馈' })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/dezhou/gto-simulator');
  await page.getByRole('button', { name: 'Spot 练习' }).click();
  const matrixScroller = page.locator('.overflow-x-auto').first();
  await expect(matrixScroller).toBeVisible();
  const matrixSize = await matrixScroller.evaluate((el) => ({
    clientWidth: el.clientWidth,
    scrollWidth: el.scrollWidth,
  }));
  expect(matrixSize.scrollWidth).toBeGreaterThan(matrixSize.clientWidth);

  guard.assertClean();
});

test('移动端底栏五入口直达对应页面，帮助经顶栏按钮', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  // 移动端主导航可见，桌面侧栏不可见
  await expect(mobileNav(page)).toBeVisible();
  await expect(sidebarNav(page)).toBeHidden();

  // 底栏恰好 5 项，且文案与冻结 IA 一致
  await expect(mobileNav(page).getByRole('link')).toHaveCount(MOBILE_NAV_ITEMS.length);
  for (const item of MOBILE_NAV_ITEMS) {
    await expect(mobileNav(page).getByRole('link', { name: item, exact: true })).toBeVisible();
  }

  // 训练：直达 /drill（不再弹 Sheet，点击后 URL 立刻变化）
  await navigateFromMobileNav(page, '训练');
  await expect(page).toHaveURL(/\/dezhou\/drill$/);
  await expectPageHeading(page, '训练场');

  // 速训：/quick
  await navigateFromMobileNav(page, '速训');
  await expect(page).toHaveURL(/\/dezhou\/quick$/);
  await expectPageHeading(page, '速训');

  // 进度中心：/progress
  await navigateFromMobileNav(page, '进度中心');
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
  await expectPageHeading(page, '进度中心');

  // 帮助：顶栏按钮（底栏不再有入口）
  await openFromTopBar(page, '帮助中心');
  await expect(page).toHaveURL(/\/dezhou\/help$/);
  await expectPageHeading(page, '帮助中心');
  await expect(page.getByRole('heading', { level: 2, name: '快速上手' })).toBeVisible();

  guard.assertClean();
});
