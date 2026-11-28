import { describe, it, expect, vi } from 'vitest';
import {
  composeQuickDrillQuestions,
  filterQuickDrillReviewItems,
  reviewItemToPracticeQuestion,
} from './quickDrillMix';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
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
function makeReview(
  id: string,
  hasOptions: boolean,
  metadata?: ReviewItem['metadata'],
): ReviewItem {
  return {
    id,
    label: `Review ${id}`,
    category: 'strategy',
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    nextReviewDate: '2020-01-01', // 过去日期，确保被 getTodayReviewItems 选中
    metadata: hasOptions
      ? { options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }], ...metadata }
      : metadata,
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

  it('front/options.text 经文本解析器解析，并透传同一组 params', () => {
    const params = { hand: 'AKs', position: 'BTN' };
    const item = makeReview('x', true, {
      front: 'rangeTrainer.srs.howToAct',
      params,
      options: [
        { text: 'rangeTrainer.srs.optionFold', isCorrect: false, explanation: 'rangeTrainer.srs.foldExplanation' },
        { text: 'rangeTrainer.srs.optionCall', isCorrect: true, explanation: 'rangeTrainer.srs.callExplanation' },
      ],
    });
    const resolveText = vi.fn((text: string, values?: Record<string, string | number>) =>
      `${text}:${values?.hand}:${values?.position}`,
    );
    const q = reviewItemToPracticeQuestion(item, resolveText);

    expect(q?.scenario.previousActions[0]?.action).toBe('rangeTrainer.srs.howToAct:AKs:BTN');
    expect(q?.options.map((option) => option.action)).toEqual([
      'rangeTrainer.srs.optionFold:AKs:BTN',
      'rangeTrainer.srs.optionCall:AKs:BTN',
    ]);
    expect(q?.options.map((option) => option.explanation)).toEqual([
      'rangeTrainer.srs.foldExplanation:AKs:BTN',
      'rangeTrainer.srs.callExplanation:AKs:BTN',
    ]);
    expect(resolveText).toHaveBeenCalledTimes(5);
    expect(resolveText).toHaveBeenNthCalledWith(1, item.metadata?.front, params);
    expect(resolveText).toHaveBeenNthCalledWith(2, 'rangeTrainer.srs.optionFold', params);
    expect(resolveText).toHaveBeenNthCalledWith(3, 'rangeTrainer.srs.foldExplanation', params);
    expect(resolveText).toHaveBeenNthCalledWith(4, 'rangeTrainer.srs.optionCall', params);
    expect(resolveText).toHaveBeenNthCalledWith(5, 'rangeTrainer.srs.callExplanation', params);
  });
});

describe('composeQuickDrillQuestions：文本解析器', () => {
  it('组合路径把解析器传给复习题转换，避免只测孤立函数', () => {
    const item = makeReview('x', true, {
      front: 'review.front',
      params: { hand: 'QQ' },
      options: [{ text: 'review.call', isCorrect: true }],
    });
    const result = composeQuickDrillQuestions([], [item], 5, 0.8, {
      resolveText: (text, params) => `${text}:${params?.hand}`,
    });
    expect(result.questions[0]?.scenario.previousActions[0]?.action).toBe('review.front:QQ');
    expect(result.questions[0]?.options[0]?.action).toBe('review.call:QQ');
  });
});

describe('QuickDrill SRS 模式过滤', () => {
  const items = [
    makeReview('source-range', true, { source: 'range' }),
    makeReview('source-odds', true, { source: 'odds' }),
    makeReview('unknown', true),
    makeReview('range:standard:open:BTN:AKs', true),
    makeReview('preflop:q1', true),
    makeReview('odds:3', true),
    makeReview('math:q1', true),
    { ...makeReview('category-only', true), category: 'range' },
    makeReview('arrange:q1', true),
    makeReview('range:conflicting', true, { source: 'strategy' }),
  ];

  it('range 仅收 source=range 或 id 含 range/preflop 标记的项', () => {
    expect(filterQuickDrillReviewItems(items, 'range').map((item) => item.id)).toEqual([
      'source-range',
      'range:standard:open:BTN:AKs',
      'preflop:q1',
      'range:conflicting',
    ]);
  });

  it('odds 仅收 source=odds 或 id 含 odds/math 标记的项', () => {
    expect(filterQuickDrillReviewItems(items, 'odds').map((item) => item.id)).toEqual([
      'source-odds',
      'odds:3',
      'math:q1',
    ]);
  });

  it('mixed 全收，未知来源不排除', () => {
    expect(filterQuickDrillReviewItems(items, 'mixed')).toEqual(items);
  });

  it.each([
    ['range', 'source-range'],
    ['odds', 'source-odds'],
  ] as const)('%s 在分配 review 名额前过滤，未知/异源项不占配额', (mode, expectedId) => {
    const reviews = [
      makeReview('unknown', true),
      makeReview('other-source', true, { source: mode === 'range' ? 'odds' : 'range' }),
      makeReview(expectedId, true, { source: mode }),
    ];
    const result = composeQuickDrillQuestions(
      Array.from({ length: 5 }, (_, index) => makePQ(`new-${index}`)),
      reviews,
      5,
      0.8,
      { mode },
    );
    expect(result.reviewCount).toBe(1);
    expect(result.questions[0]?.id).toBe(`review-${expectedId}`);
  });

  it('严格模式未知来源全部排除时不产生复习题', () => {
    const result = composeQuickDrillQuestions([], [makeReview('unknown', true)], 1, 0.8, {
      mode: 'range',
    });
    expect(result).toEqual({ questions: [], reviewCount: 0 });
  });
});
