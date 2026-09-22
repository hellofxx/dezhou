import { describe, expect, it } from 'vitest';
import {
  answerQuality,
  upsertReviewItem,
  processReview,
  FAST_ANSWER_SECONDS,
  createReviewItem,
  toLocalDateString,
} from '@/shared/utils/spacedRepetition';
import type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';

/**
 * P0-3 低风险 DRY（§7 建议项）：共享 SRS 辅助纯函数测试。
 * 验证 answerQuality 口径（单位=毫秒）与 upsertReviewItem 的查找/新建分支。
 * CHANGELOG 2026-09-04 缺陷修复回归：答错走有界回退（repetitions/interval 退一档、
 * easeFactor 有限下调，均不清零），而非旧实现的「整项重置」。
 */

/** 构造一个处于训练中的复习项（覆盖 createReviewItem 默认调度字段） */
function trainedItem(overrides: Partial<ReviewItem>): ReviewItem {
  return {
    ...createReviewItem('range:BTN:AA', 'AA @ BTN', 'range'),
    ...overrides,
  };
}

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

  it('答错 quality=1 → 有界回退：repetitions 退 1 步（3→2）/ interval 退一档（14→3）/ easeFactor 有限下调，不清零', () => {
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
    // 旧实现断言 repetitions=0 / interval=1（整项重置）——已按缺陷修复改为有界回退
    expect(item.repetitions).toBe(2);
    expect(item.interval).toBe(3);
    expect(item.easeFactor).toBeCloseTo(2.3, 10);
  });
});

describe('processReview 答错有界回退（CHANGELOG 2026-09-04 缺陷修复）', () => {
  it('高档位项（rep=5 / interval=30）答错 → repetitions 4 / interval 14，退一档不清零', () => {
    const item = processReview(trainedItem({ repetitions: 5, interval: 30 }), 1);
    expect(item.repetitions).toBe(4);
    expect(item.interval).toBe(14);
    expect(item.easeFactor).toBeCloseTo(2.3, 10);
  });

  it('interval 回退取回退后档位的上一档基准：rep=4 → interval 7 / rep=2 → interval 1', () => {
    // rep=4 → rolledBackRep=3 → SEQ 上一档 = 7（下次答对所得 14 的前一档）
    expect(processReview(trainedItem({ repetitions: 4, interval: 30 }), 1).interval).toBe(7);
    // rep=2 → rolledBackRep=1 → SEQ 上一档越界取下限 1
    expect(processReview(trainedItem({ repetitions: 2, interval: 3 }), 1).interval).toBe(1);
  });

  it('初始项（rep=0）答错 → 保持学习档（rep 0 / interval 1），easeFactor 下调 0.2', () => {
    const item = processReview(createReviewItem('range:BTN:AA', 'AA @ BTN', 'range'), 1);
    expect(item.repetitions).toBe(0);
    expect(item.interval).toBe(1);
    expect(item.easeFactor).toBeCloseTo(2.3, 10);
  });

  it('easeFactor 有限下调且有下限：ease=1.35 答错 → 1.3 不下穿下限，也不清回默认值 2.5', () => {
    const item = processReview(
      trainedItem({ repetitions: 3, interval: 14, easeFactor: 1.35 }),
      1,
    );
    expect(item.easeFactor).toBe(1.3);
  });

  it('quality=2（quizScoreToQuality 最低档）同样走有界回退，与 quality=1 行为一致', () => {
    const item = processReview(trainedItem({ repetitions: 3, interval: 14 }), 2);
    expect(item.repetitions).toBe(2);
    expect(item.interval).toBe(3);
    expect(item.easeFactor).toBeCloseTo(2.3, 10);
  });

  it('nextReviewDate = 回退后 interval 的日期偏移（rep=3 → interval 3 → 今天+3），lastReviewedAt 落值', () => {
    const item = processReview(trainedItem({ repetitions: 3, interval: 14 }), 1);
    const expected = new Date();
    expected.setDate(expected.getDate() + 3);
    expect(item.nextReviewDate).toBe(toLocalDateString(expected));
    expect(item.lastReviewedAt).toBeTypeOf('number');
  });
});

describe('processReview 正确路径回归（quality 5/4/3 分级语义不变）', () => {
  it('连续答对：repetitions 逐一递增，interval 沿序列档位爬升 1→3→7', () => {
    let item = createReviewItem('range:BTN:AA', 'AA @ BTN', 'range');
    item = processReview(item, 4);
    expect(item.repetitions).toBe(1);
    expect(item.interval).toBe(1);
    item = processReview(item, 4);
    expect(item.repetitions).toBe(2);
    expect(item.interval).toBe(3);
    item = processReview(item, 4);
    expect(item.repetitions).toBe(3);
    expect(item.interval).toBe(7);
  });

  it('easeFactor 调整：quality=5 → +0.1 / quality=4 → 不变 / 封顶 3.0', () => {
    const up = processReview(
      trainedItem({ repetitions: 2, interval: 3, easeFactor: 2.5 }),
      5,
    );
    expect(up.easeFactor).toBeCloseTo(2.6, 10);
    const flat = processReview(
      trainedItem({ repetitions: 2, interval: 3, easeFactor: 2.5 }),
      4,
    );
    expect(flat.easeFactor).toBeCloseTo(2.5, 10);
    const capped = processReview(
      trainedItem({ repetitions: 2, interval: 3, easeFactor: 2.95 }),
      5,
    );
    expect(capped.easeFactor).toBe(3.0);
  });
});
