import { describe, expect, it } from 'vitest';
import {
  answerQuality,
  upsertReviewItem,
  FAST_ANSWER_SECONDS,
  createReviewItem,
} from './spacedRepetition';
import type { ReviewItemMetadata } from './spacedRepetition';

/**
 * P0-3 低风险 DRY（§7 建议项）：共享 SRS 辅助纯函数测试。
 * 验证 answerQuality 口径（单位=毫秒）与 upsertReviewItem 的查找/新建分支。
 */

describe('answerQuality（共享 SM-2 quality 映射，单位=毫秒）', () => {
  it('答对且快于阈值 → 5（完美记忆）', () => {
    expect(answerQuality(true, (FAST_ANSWER_SECONDS - 1) * 1000)).toBe(5);
  });

  it('刚好等于阈值（边界）→ 4（归入较不严重档）', () => {
    expect(answerQuality(true, FAST_ANSWER_SECONDS * 1000)).toBe(4);
  });

  it('答对但慢于阈值 → 4', () => {
    expect(answerQuality(true, FAST_ANSWER_SECONDS * 1000 + 1000)).toBe(4);
  });

  it('答错 → 1（无视用时）', () => {
    expect(answerQuality(false, 0)).toBe(1);
    expect(answerQuality(false, FAST_ANSWER_SECONDS * 1000)).toBe(1);
  });
});

describe('upsertReviewItem（查找/新建 + processReview 推进）', () => {
  const metadata: ReviewItemMetadata = {
    front: 'Q',
    back: 'A',
    source: 'range',
  };

  it('队列中无该项 → 新建并推进（isNew=true）', () => {
    const { item, isNew } = upsertReviewItem(
      [],
      'range:BTN:AA',
      'AA @ BTN',
      'range',
      metadata,
      5,
    );
    expect(isNew).toBe(true);
    expect(item.id).toBe('range:BTN:AA');
    expect(item.repetitions).toBe(1);
  });

  it('队列中已有该项 → 复用并推进（isNew=false，metadata 保留原值）', () => {
    const existing = createReviewItem('range:BTN:AA', 'AA @ BTN', 'range', {
      ...metadata,
      back: 'raise',
    });
    const { item, isNew } = upsertReviewItem(
      [existing],
      'range:BTN:AA',
      '丢弃的 label',
      'range',
      { front: '新 front', back: '新 back', source: 'range' },
      5,
    );
    expect(isNew).toBe(false);
    // 复用原项，label/metadata 不被新建参数的 label/metadata 覆盖
    expect(item.label).toBe('AA @ BTN');
    expect(item.metadata?.back).toBe('raise');
    expect(item.repetitions).toBe(1);
  });

  it('答错 quality=1 → 重置为 interval 1 / repetitions 0', () => {
    const trained = {
      ...createReviewItem('range:BTN:AA', 'AA @ BTN', 'range', metadata),
      repetitions: 3,
      interval: 14,
    };
    const { item } = upsertReviewItem(
      [trained],
      'range:BTN:AA',
      'AA @ BTN',
      'range',
      metadata,
      1,
    );
    expect(item.repetitions).toBe(0);
    expect(item.interval).toBe(1);
  });
});
