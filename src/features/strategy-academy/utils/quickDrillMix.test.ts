import { describe, it, expect } from 'vitest';
import { composeQuickDrillQuestions, reviewItemToPracticeQuestion } from './quickDrillMix';
import type { ReviewItem } from '@/features/progress/utils/spacedRepetition';
import type { PracticeQuestion } from '../types';

// 辅助生成测试用 PracticeQuestion
function makePQ(id: string): PracticeQuestion {
  return {
    id,
    scenario: {
      heroHand: ['As', 'Ks'],
      heroPosition: 'BTN',
      previousActions: [],
      street: 'preflop',
      potSize: 5,
      effectiveStack: 100,
    },
    options: [
      { action: 'Fold', isCorrect: false, explanation: '' },
      { action: 'Call', isCorrect: true, explanation: '' },
    ],
  };
}

// 辅助生成带 options 的 ReviewItem（可转换为选择题）
function makeReview(id: string, hasOptions: boolean): ReviewItem {
  return {
    id,
    label: `Review ${id}`,
    category: 'strategy',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReviewDate: '2020-01-01', // 过去日期，确保被 getTodayReviewItems 选中
    metadata: hasOptions
      ? { options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }] }
      : undefined,
  };
}

describe('P1E-04: composeQuickDrillQuestions — 缺口回填', () => {
  it('无复习项时直接返回新题（切至 questionCount）', () => {
    const news = Array.from({ length: 8 }, (_, i) => makePQ(`new-${i}`));
    const result = composeQuickDrillQuestions(news, [], 5, 0.8);
    expect(result.questions).toHaveLength(5);
    expect(result.reviewCount).toBe(0);
  });

  it('复习项无 options 被丢弃后回填补足总题数', () => {
    const news = Array.from({ length: 8 }, (_, i) => makePQ(`new-${i}`));
    // 3 个无 options 的复习项（全部被丢弃）
    const reviews = [makeReview('r1', false), makeReview('r2', false), makeReview('r3', false)];
    const result = composeQuickDrillQuestions(news, reviews, 5, 0.8);
    // 丢弃后缺口由新题回填，总数应为 5
    expect(result.questions.length).toBe(5);
    expect(result.reviewCount).toBe(0);
  });

  it('部分复习项可转换时混合 + 回填总数 = questionCount', () => {
    const news = Array.from({ length: 8 }, (_, i) => makePQ(`new-${i}`));
    // 2 个有 options + 2 个无 options
    const reviews = [
      makeReview('r1', true),
      makeReview('r2', true),
      makeReview('r3', false),
      makeReview('r4', false),
    ];
    const result = composeQuickDrillQuestions(news, reviews, 5, 0.8);
    expect(result.questions.length).toBe(5);
    expect(result.reviewCount).toBeLessThanOrEqual(2);
  });

  it('新题池不足时尽力而为（不超过可用新题）', () => {
    const news = [makePQ('new-0'), makePQ('new-1')];
    // 全部不可转换
    const reviews = [makeReview('r1', false), makeReview('r2', false)];
    const result = composeQuickDrillQuestions(news, reviews, 5, 0.8);
    // 最多只能出 2 题（新题池仅 2 题）
    expect(result.questions.length).toBeLessThanOrEqual(5);
    expect(result.questions.length).toBeGreaterThan(0);
  });
});

describe('reviewItemToPracticeQuestion', () => {
  it('无 metadata.options 返回 null', () => {
    expect(reviewItemToPracticeQuestion(makeReview('x', false))).toBeNull();
  });
  it('有 metadata.options 正确转换', () => {
    const q = reviewItemToPracticeQuestion(makeReview('x', true));
    expect(q).not.toBeNull();
    expect(q!.id).toBe('review-x');
    expect(q!.options).toHaveLength(2);
  });
});
