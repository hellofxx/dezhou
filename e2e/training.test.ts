import { expect, test } from '@playwright/test';
import { guardBrowserErrors } from './fixtures/browserErrors';
import { skipOnboarding } from './fixtures/app';
import {
  goToProgressPage,
  progressSessionCount,
  runRangeQuizSession,
} from './fixtures/rangeTraining';

/**
 * L4 学习闭环：跳过引导 → 手牌范围训练 → 结果页 → 进度页 → 刷新后记录仍在。
 *
 * 训练与结果页断言集中在 `fixtures/rangeTraining.ts`（升级 / 持久化失败用例共用同一
 * 真实 UI 路径）；本用例额外锁「刷新后记录仍在」——records 走 IndexedDB，必须真持久化。
 */
const MIN_QUESTIONS = 10;

test('跳过引导后完成 10 题范围训练，进度页刷新后仍保留该训练记录', async ({ page }) => {
  const guard = guardBrowserErrors(page);

  await skipOnboarding(page);

  await runRangeQuizSession(page, MIN_QUESTIONS);
  await goToProgressPage(page);

  const sessionCount = progressSessionCount(page);
  await expect(sessionCount).toHaveText('1');

  // 刷新：records 由 IndexedDB 异步水合，刷新后仍须为 1（证明记录真实落盘）
  await page.reload();
  await expect(page).toHaveURL(/\/dezhou\/progress$/);
  await expect(sessionCount).toHaveText('1', { timeout: 20_000 });

  guard.assertClean();
});
