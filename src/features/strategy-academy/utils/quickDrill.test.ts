import { describe, expect, it } from 'vitest';
import {
  collectAllPracticeQuestions,
  computeQuickDrillScore,
  getQuestionPoolStats,
  getQuickDrillQuestions,
} from './quickDrill';
import type { GameContext, Lesson, PracticeQuestion, QuestionDifficulty } from '../types';

/**
 * 快速训练纯逻辑契约：
 * - 综合分数 = accuracy*100 + 时间奖励（每快 1s 得 3 分，封顶 30）
 * - 题池筛选：难度 + 弱点领域优先，候选不足时放宽（排除课程仍生效）
 * - 空题池 / 全排除 / 计数超池等退化输入返回安全结果
 */

function makeQuestion(
  id: string,
  overrides: {
    difficulty?: QuestionDifficulty;
    street?: PracticeQuestion['scenario']['street'];
    heroPosition?: string;
    board?: string[];
    icmPressure?: GameContext['icmPressure'];
  } = {},
): PracticeQuestion {
  const { difficulty, street = 'preflop', heroPosition = 'BTN', board, icmPressure } = overrides;
  return {
    id,
    difficulty,
    scenario: {
      heroHand: ['As', 'Ks'],
      heroPosition,
      previousActions: [],
      board,
      street,
      potSize: 5,
      effectiveStack: 100,
      gameContext: icmPressure ? { gameType: 'mtt', icmPressure } : undefined,
    },
    options: [
      { action: 'Fold', isCorrect: false, explanation: '' },
      { action: 'Call', isCorrect: true, explanation: '' },
    ],
  };
}

function makeLesson(id: string, questions: PracticeQuestion[]): Lesson {
  return {
    id,
    level: 1,
    order: 1,
    title: id,
    subtitle: '',
    duration: '5 min',
    content: [],
    quiz: [],
    practice: questions.length > 0 ? { id: `${id}-practice`, questions } : undefined,
  };
}

describe('computeQuickDrillScore：综合分数', () => {
  it('普通用例：正确率分 + 时间奖励', () => {
    // 0.8*100=80；avg 5s → round((10-5)*3)=15
    expect(computeQuickDrillScore(0.8, 5)).toBe(95);
  });

  it('平均用时超过 10 秒时时间奖励为 0（不为负）', () => {
    expect(computeQuickDrillScore(0.5, 12)).toBe(50);
    expect(computeQuickDrillScore(1, 30)).toBe(100);
  });

  it('全对且零用时达到约 130 满分', () => {
    expect(computeQuickDrillScore(1, 0)).toBe(130);
  });

  it('正确率按四舍五入到整数分', () => {
    // round(0.666*100)=67；avg 10s 无奖励
    expect(computeQuickDrillScore(0.666, 10)).toBe(67);
  });

  it('小数用时按 round 计算时间奖励', () => {
    // round((10-9.9)*3)=round(0.3)=0
    expect(computeQuickDrillScore(0.9, 9.9)).toBe(90);
  });
});

describe('collectAllPracticeQuestions / getQuestionPoolStats', () => {
  const lessons: Lesson[] = [
    makeLesson('l1-a', [makeQuestion('q1', { difficulty: 'beginner', street: 'preflop' })]),
    makeLesson('l1-b', [
      makeQuestion('q2', { difficulty: 'advanced', street: 'flop', board: ['Ah', 'Kd', '7c'] }),
      makeQuestion('q3', { street: 'turn' }),
    ]),
    makeLesson('l1-empty', []),
  ];

  it('collect 只收集带 practice 的课程题目', () => {
    expect(collectAllPracticeQuestions(lessons).map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
  });

  it('统计总数 / 难度（缺省按 beginner）/ 街道', () => {
    const stats = getQuestionPoolStats(lessons);
    expect(stats.total).toBe(3);
    expect(stats.byDifficulty).toEqual({ beginner: 2, intermediate: 0, advanced: 1 });
    expect(stats.byStreet).toEqual({ preflop: 1, flop: 1, turn: 1 });
  });

  it('空课程列表产出零值统计', () => {
    const stats = getQuestionPoolStats([]);
    expect(stats.total).toBe(0);
    expect(stats.byDifficulty).toEqual({ beginner: 0, intermediate: 0, advanced: 0 });
    expect(stats.byStreet).toEqual({});
  });
});

describe('getQuickDrillQuestions：筛选与回填', () => {
  const lessons: Lesson[] = [
    makeLesson('l1', [
      makeQuestion('l1-q1', { difficulty: 'beginner', street: 'preflop' }),
      makeQuestion('l1-q2', { difficulty: 'advanced', street: 'flop' }),
    ]),
    makeLesson('l2', [
      makeQuestion('l2-q1', { difficulty: 'beginner', street: 'river' }),
      makeQuestion('l2-q2', { difficulty: 'intermediate', street: 'turn' }),
    ]),
  ];

  it('难度匹配时优先返回目标难度题目', () => {
    const result = getQuickDrillQuestions(lessons, [], 'beginner', 2);
    expect(result.map((q) => q.id).sort()).toEqual(['l1-q1', 'l2-q1']);
  });

  it('弱点维度按 lessonMeta 命中：未登记课时回退 postflop', () => {
    // l1 / l2 未登记 lessonMeta → 维度回退 postflop，因此 ['postflop'] 视为全命中
    const result = getQuickDrillQuestions(lessons, ['postflop'], 'beginner', 2);
    expect(result.map((q) => q.id).sort()).toEqual(['l1-q1', 'l2-q1']);
  });

  it('弱点维度不匹配时不进候选池（回填阶段仍会补齐题量）', () => {
    // 所有课时维度均为 postflop，['math'] 首选池为空 → 走回填，仍返回请求题量
    const result = getQuickDrillQuestions(lessons, ['math'], 'advanced', 3);
    expect(result).toHaveLength(3);
  });

  it('维度来自 lessonMeta：已登记课时按其 eloDimension 命中', () => {
    const mixed: Lesson[] = [
      makeLesson('l1-basics', [makeQuestion('l1-basics-q1', { difficulty: 'beginner' })]),
      makeLesson('l-unknown', [makeQuestion('l-unknown-q1', { difficulty: 'beginner' })]),
    ];
    // l1-basics → handReading（lessonMeta 已登记）；l-unknown → postflop 回退
    const result = getQuickDrillQuestions(mixed, ['handReading'], 'beginner', 1);
    expect(result.map((q) => q.id)).toEqual(['l1-basics-q1']);
  });

  it('排除课程前缀生效（候选不足回填阶段同样排除）', () => {
    const result = getQuickDrillQuestions(lessons, [], 'beginner', 4, ['l1']);
    expect(result.every((q) => !q.id.startsWith('l1'))).toBe(true);
  });

  it('候选不足时放宽条件补齐，但不超过 count', () => {
    const result = getQuickDrillQuestions(lessons, ['postflop'], 'advanced', 3);
    expect(result).toHaveLength(3);
    // 首选只有 l1-q2（advanced），因此必然包含回填题目，集合不应只含目标难度
    expect(new Set(result.map((q) => q.id)).size).toBe(result.length);
  });

  it('count 大于题池时返回全部题目', () => {
    const result = getQuickDrillQuestions(lessons, [], 'beginner', 99);
    expect(result).toHaveLength(4);
  });

  it('空题池返回空数组', () => {
    expect(getQuickDrillQuestions([], [], 'beginner', 5)).toEqual([]);
  });

  it('全部题目被排除时返回空数组', () => {
    expect(getQuickDrillQuestions(lessons, [], 'beginner', 5, ['l1', 'l2'])).toEqual([]);
  });
});
