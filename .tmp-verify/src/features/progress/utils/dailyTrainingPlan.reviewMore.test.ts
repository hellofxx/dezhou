import { describe, it, expect } from 'vitest';
import { generateCrossModuleDailyPlan } from './dailyTrainingPlan';
import { createReviewItem, toLocalDateString } from '@/shared/utils/spacedRepetition';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/**
 * descReviewMore 隐藏数守卫（CHANGELOG 2026-09-04 登记遗留项）。
 *
 * 「{{items}} 等 {{count}} 项」的 count 曾误用总到期数：展示 3 条 + count=N
 * 会对同一批复习重复计数。修复后 count = 总到期数 − 已展示条数。
 * 不变量：展示条数 + count ≡ 总到期数。
 */

function dueItem(id: string): ReviewItem {
  const item = createReviewItem(id, `review.item.${id}`, 'strategy', { source: 'strategy' });
  item.nextReviewDate = toLocalDateString();
  return item;
}

function reviewRecommendation(items: ReviewItem[]) {
  const plan = generateCrossModuleDailyPlan([], [], items, 0);
  return plan.find((r) => r.id === 'review-today');
}

describe('generateCrossModuleDailyPlan · descReviewMore 隐藏数', () => {
  it('到期 5 项展示 3 条时，count 为隐藏数 2（而非总数 5）', () => {
    const rec = reviewRecommendation([1, 2, 3, 4, 5].map((n) => dueItem(`k${n}`)));
    expect(rec?.description).toBe('dashboard.dataPlan.descReviewMore');
    expect(rec?.descParams).toMatchObject({ count: 2 });
  });

  it('到期 4 项展示 3 条时，count 为 1', () => {
    const rec = reviewRecommendation([1, 2, 3, 4].map((n) => dueItem(`m${n}`)));
    expect(rec?.description).toBe('dashboard.dataPlan.descReviewMore');
    expect(rec?.descParams).toMatchObject({ count: 1 });
  });

  it('到期 ≤ 3 项走 descReview 分支，不出现 count 字段', () => {
    const rec = reviewRecommendation([dueItem('a'), dueItem('b'), dueItem('c')]);
    expect(rec?.description).toBe('dashboard.dataPlan.descReview');
    expect(rec?.descParams).not.toHaveProperty('count');
  });

  it('不变量：展示条数 + count = 总到期数（4/5/8 三组）', () => {
    for (const total of [4, 5, 8]) {
      const rec = reviewRecommendation(
        Array.from({ length: total }, (_, i) => dueItem(`x${i}`)),
      );
      const shown = (
        rec as unknown as { itemLabels?: readonly string[] } | undefined
      )?.itemLabels?.length ?? 0;
      const count = (rec?.descParams as { count: number }).count;
      expect(shown + count).toBe(total);
    }
  });
});
