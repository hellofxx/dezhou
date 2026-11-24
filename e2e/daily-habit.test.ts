import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import {
  APP_ROOT,
  dismissGlobalDialog,
  navigateFromSidebar,
  skipOnboarding,
} from './fixtures/app';

test('首页习惯任务二选一，完成每日谜题后显示完成态', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  const main = page.getByRole('main');
  await expect(main.getByText('今日习惯训练 · 二选一')).toBeVisible();
  await expect(main.getByRole('button', { name: '开始速训' })).toBeVisible();
  await expect(main.getByRole('button', { name: '开始每日谜题' })).toBeVisible();

  await main.getByRole('button', { name: '开始速训' }).click();
  await expect(page).toHaveURL(/\/dezhou\/quick\?mode=mixed&quick=true$/);
  await expect(main.getByText('自适应难度')).toBeVisible();

  await navigateFromSidebar(page, '学习路径');
  await main.getByRole('button', { name: '开始每日谜题' }).click();
  await expect(page).toHaveURL(`${APP_ROOT}puzzle/daily`.replace(/\/$/, ''));

  for (let index = 0; index < 8; index += 1) {
    await page.locator('.action-tile').first().click();
    await dismissGlobalDialog(page);
    await page.getByRole('button', { name: index === 7 ? '查看结果' : '下一题' }).click();
  }

  const result = page.getByRole('dialog');
  await expect(result.getByRole('heading', { name: '训练完成' })).toBeVisible();
  await result.getByRole('button', { name: '返回首页' }).click();
  await expect(page).toHaveURL(/\/dezhou\/drill\/puzzle$/);

  await navigateFromSidebar(page, '学习路径');
  await expect(main.getByText('今日习惯已完成')).toBeVisible();
  await expect(main.getByRole('button', { name: '查看今日谜题' })).toBeVisible();
  await expect(main.getByRole('button', { name: '开始速训' })).toBeVisible();

  guard.assertClean();
});
