import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { skipOnboarding } from './fixtures/app';

/**
 * L4 移动视口（mobile-chromium）：底部导航是移动端唯一主导航（<768px 隐藏侧边栏）。
 *
 * 走真实移动 UI：
 * - 底栏「训练」按钮 → 训练入口 Sheet → 手牌范围训练（断言壳层 h1 真实标题）
 * - 顶栏帮助快捷入口（移动端可见、桌面端隐藏）→ 帮助中心（h1 + h2 真实标题）
 *
 * 桌面用例不受影响：chromium project 通过 testIgnore 排除本文件。
 */
test('移动端底部导航可打开训练入口与帮助中心并渲染真实标题', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  // 移动端主导航可见，桌面侧边栏不可见
  await expect(page.locator('nav[aria-label="移动端导航"]')).toBeVisible();
  await expect(page.locator('aside')).toBeHidden();

  // 训练入口：底栏「训练」（aria-haspopup=dialog）→ Sheet → 手牌范围训练
  await page.getByRole('button', { name: '训练', exact: true }).click();
  const sheet = page.getByRole('dialog', { name: '训练入口' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('link', { name: '手牌范围训练' }).click();
  await expect(page).toHaveURL(/\/dezhou\/range-trainer$/);
  await expect(page.getByRole('heading', { level: 1, name: '手牌范围训练' })).toBeVisible();

  // 帮助：移动端顶栏快捷入口（桌面端该按钮隐藏）
  await page.getByRole('button', { name: '帮助中心' }).click();
  await expect(page).toHaveURL(/\/dezhou\/help$/);
  await expect(page.getByRole('heading', { level: 1, name: '帮助中心' })).toBeVisible();
  await expect(page.getByRole('heading', { level: 2, name: '快速上手' })).toBeVisible();

  guard.assertClean();
});
