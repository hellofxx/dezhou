import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { skipOnboarding } from './fixtures/app';

/**
 * GTO 模拟器真实入口回归：
 * - Exploit 未选对手时开始按钮禁用
 * - 标准 GTO 会话可进入、可作答，反馈进入可读状态
 * - 无结果的动态结果 URL 不展示旧内存结果
 */
test('GTO 模拟器：Exploit 门禁、答题反馈与结果路由校验', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);
  await page.goto('/dezhou/gto-simulator');
  await expect(page.getByRole('heading', { level: 2, name: 'GTO 决策模拟器' })).toBeVisible();

  await page.getByRole('button', { name: 'Exploit 模式' }).click();
  await expect(page.getByRole('button', { name: '开始 GTO 训练' })).toBeDisabled();
  await expect(page.getByText('请先选择对手类型，再开始 Exploit 训练。')).toBeVisible();

  await page.getByRole('button', { name: 'GTO 模式' }).click();
  await page.getByRole('button', { name: '开始 GTO 训练' }).click();
  await expect(page).toHaveURL(/\/dezhou\/gto-simulator\/session\/active$/);
  await expect(page.getByText(/场景 1 \//)).toBeVisible();

  await page.getByRole('button', { name: 'Fold' }).click();
  await expect(page.getByText(/最优决策！|与参考策略一致|偏离参考策略/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fold' })).toBeHidden();

  await page.goto('/dezhou/gto-simulator/result/unknown-session');
  await expect(page.getByText('没有结果数据')).toBeVisible();

  guard.assertClean();
});