import { describe, expect, it } from 'vitest';
import {
  REVIEW_QUESTION_PREFIX,
  isReviewQuestionId,
  reviewQualityFor,
  computeReviewWriteBacks,
} from './quickDrillSrs';
import { createReviewItem, getTodayString } from '@/shared/utils/spacedRepetition';
import type { PracticeAnswerDetail } from '../types';

/**
 * P1E-05（专批 B）：QuickDrill review-* 复习题 SRS 回写纯函数测试。
 * 验证 quality 映射（对+快→5 / 对→4 / 错→1）与 processReview 推进/重置闭环。
 */

function ans(questionId: string, isCorrect: boolean, timeTaken: number): PracticeAnswerDetail {
  return { questionId, isCorrect, timeTaken };
}

describe('quickDrillSrs（专批 B）', () => {
  it('quality 映射：对+快(<5s)→5 / 对→4 / 错→1', () => {
    expect(reviewQualityFor(true, 3)).toBe(5);
    expect(reviewQualityFor(true, 4.9)).toBe(5);
    expect(reviewQualityFor(true, 5)).toBe(4);
    expect(reviewQualityFor(true, 12)).toBe(4);
    expect(reviewQualityFor(false, 1)).toBe(1);
    expect(reviewQualityFor(false, 30)).toBe(1);
  });

  it('isReviewQuestionId 仅识别 review-* 前缀', () => {
    expect(isReviewQuestionId(`${REVIEW_QUESTION_PREFIX}lesson-1`)).toBe(true);
    expect(isReviewQuestionId('quiz-1')).toBe(false);
  });

  it('答对：ReviewItem 推进（repetitions +1，nextReviewDate 晚于今天）', () => {
    const item = createReviewItem('lesson-1', '位置的力量', 'strategy');
    const today = getTodayString();

    const updated = computeReviewWriteBacks([item], [ans('review-lesson-1', true, 8)]);

    expect(updated).toHaveLength(1);
    expect(updated[0]!.id).toBe('lesson-1');
    expect(updated[0]!.repetitions).toBe(item.repetitions + 1);
    // YYYY-MM-DD 字典序即时间序：推进后必须晚于今天（闭环生效）
    expect(updated[0]!.nextReviewDate > today).toBe(true);
  });

  it('答对且已有 1 次成功记录：间隔进入序列下一档（1→3）', () => {
    const item = { ...createReviewItem('lesson-2', '3-bet 范围', 'strategy'), repetitions: 1 };

    const updated = computeReviewWriteBacks([item], [ans('review-lesson-2', true, 2)]);

    expect(updated).toHaveLength(1);
    expect(updated[0]!.repetitions).toBe(2);
    expect(updated[0]!.interval).toBeGreaterThanOrEqual(3);
  });

  it('答错：重置（repetitions 0 / interval 1）', () => {
    const item = {
      ...createReviewItem('lesson-3', '底池赔率', 'odds'),
      repetitions: 3,
      interval: 14,
    };

    const updated = computeReviewWriteBacks([item], [ans('review-lesson-3', false, 6)]);

    expect(updated).toHaveLength(1);
    expect(updated[0]!.repetitions).toBe(0);
    expect(updated[0]!.interval).toBe(1);
  });

  it('非 review-* 题目忽略；找不到对应 ReviewItem 静默跳过', () => {
    const item = createReviewItem('lesson-4', 'GTO 基础', 'gto');

    const updated = computeReviewWriteBacks(
      [item],
      [
        ans('quiz-new-question', true, 3), // 非复习题
        ans('review-ghost-item', true, 3), // 复习项已被清理
      ],
    );

    expect(updated).toHaveLength(0);
  });
});
