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
 * - 题池筛选：严格难度；range=preflop / odds=math / mixed=全维度
 * - 合格池内按训练弱项课程 → ELO 弱点领域 → 其他课程题排序，禁止异难度/异模式回填
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

  it('mixed 维度不匹配时可全维度回填，但绝不放宽难度', () => {
    // 首选 math 为空；全维度回填只收 advanced，因此仍只有 l1-q2
    const result = getQuickDrillQuestions(lessons, ['math'], 'advanced', 3);
    expect(result.map((q) => q.id)).toEqual(['l1-q2']);
  });

  it('维度来自 lessonMeta：已登记课时按其 eloDimension 命中', () => {
    const mixed: Lesson[] = [
      makeLesson('l4-bluffcatching', [
        makeQuestion('l4-bluffcatching-q1', { difficulty: 'beginner' }),
      ]),
      makeLesson('l-unknown', [makeQuestion('l-unknown-q1', { difficulty: 'beginner' })]),
    ];
    // l4-bluffcatching → handReading（lessonMeta 已登记）；l-unknown → postflop 回退
    const result = getQuickDrillQuestions(mixed, ['handReading'], 'beginner', 1);
    expect(result.map((q) => q.id)).toEqual(['l4-bluffcatching-q1']);
  });

  it('按训练弱项课程、ELO 弱点、其他课程题三个层级依次选题', () => {
    const tieredLessons: Lesson[] = [
      makeLesson('l4-bluffcatching', [makeQuestion('fallback-q', { difficulty: 'beginner' })]),
      makeLesson('l4-gto-basics', [makeQuestion('weak-q', { difficulty: 'beginner' })]),
      makeLesson('l1-basics', [makeQuestion('focus-q', { difficulty: 'beginner' })]),
    ];

    const result = getQuickDrillQuestions(
      tieredLessons,
      ['math'],
      'beginner',
      3,
      [],
      ['l1-basics'],
    );

    expect(result.map((q) => q.id)).toEqual(['focus-q', 'weak-q', 'fallback-q']);
  });

  it('多个训练弱项课程按传入排名优先，不受课程顺序影响', () => {
    const orderedLessons: Lesson[] = [
      makeLesson('l3-draws', [makeQuestion('second-focus-q', { difficulty: 'beginner' })]),
      makeLesson('l1-basics', [makeQuestion('first-focus-q', { difficulty: 'beginner' })]),
    ];

    const result = getQuickDrillQuestions(
      orderedLessons,
      [],
      'beginner',
      1,
      [],
      ['l1-basics', 'l3-draws'],
    );

    expect(result.map((question) => question.id)).toEqual(['first-focus-q']);
  });

  it('聚焦课程单节最多占半套题，保证课程广度', () => {
    const focusHeavy: Lesson[] = [
      makeLesson('l1-basics', [
        makeQuestion('l1-q1', { difficulty: 'beginner' }),
        makeQuestion('l1-q2', { difficulty: 'beginner' }),
        makeQuestion('l1-q3', { difficulty: 'beginner' }),
        makeQuestion('l1-q4', { difficulty: 'beginner' }),
      ]),
      makeLesson('l4-bluffcatching', [makeQuestion('other-q', { difficulty: 'beginner' })]),
    ];

    const result = getQuickDrillQuestions(focusHeavy, [], 'beginner', 4, [], ['l1-basics']);

    expect(result.filter((q) => q.id.startsWith('l1-')).length).toBeLessThanOrEqual(2);
    expect(result).toHaveLength(3);
  });

  it('训练弱项课程难度不匹配时回退到 ELO 弱点题目', () => {
    const mismatchLessons: Lesson[] = [
      makeLesson('l4-gto-basics', [makeQuestion('focus-advanced', { difficulty: 'advanced' })]),
      makeLesson('l1-basics', [makeQuestion('weak-beginner', { difficulty: 'beginner' })]),
    ];

    const result = getQuickDrillQuestions(
      mismatchLessons,
      ['math'],
      'beginner',
      1,
      [],
      ['l4-gto-basics'],
    );

    expect(result.map((q) => q.id)).toEqual(['weak-beginner']);
  });

  it('排除课程前缀生效（候选不足回填阶段同样排除）', () => {
    const result = getQuickDrillQuestions(lessons, [], 'beginner', 4, ['l1']);
    expect(result.every((q) => !q.id.startsWith('l1'))).toBe(true);
  });

  it('被排除的训练弱项课程不会在回填阶段重新进入题池', () => {
    const excludedFocus: Lesson[] = [
      makeLesson('l1-basics', [makeQuestion('unprefixed-focus-q', { difficulty: 'beginner' })]),
    ];

    expect(getQuickDrillQuestions(
      excludedFocus,
      [],
      'beginner',
      5,
      ['l1-basics'],
      ['l1-basics'],
    )).toEqual([]);
  });

  it('候选不足时保持严格难度，只返回实际匹配题目', () => {
    const result = getQuickDrillQuestions(lessons, ['postflop'], 'advanced', 3);
    expect(result.map((q) => q.id)).toEqual(['l1-q2']);
  });

  it('count 大于严格题池时只返回全部匹配题目', () => {
    const result = getQuickDrillQuestions(lessons, [], 'beginner', 99);
    expect(result.map((q) => q.id).sort()).toEqual(['l1-q1', 'l2-q1']);
  });

  it.each([
    ['range', 'l1-position', 'range-q'],
    ['odds', 'l1-basics', 'odds-q'],
  ] as const)('%s 仅返回本模式维度题目，聚焦异维度课程也排除', (mode, lessonId, questionId) => {
    const otherDimensionLesson = mode === 'range'
      ? makeLesson('drill-outs', [makeQuestion('math-q', { difficulty: 'beginner' })])
      : makeLesson('drill-position', [makeQuestion('preflop-q', { difficulty: 'beginner' })]);
    const modeLessons: Lesson[] = [
      makeLesson(lessonId, [makeQuestion(questionId, { difficulty: 'beginner' })]),
      makeLesson('l3-cbet', [makeQuestion('postflop-q', { difficulty: 'beginner' })]),
      otherDimensionLesson,
    ];
    const result = getQuickDrillQuestions(
      modeLessons,
      [],
      'beginner',
      5,
      [],
      [mode === 'range' ? 'l1-basics' : 'l1-position'],
      mode,
    );
    expect(result.map((q) => q.id)).toEqual([questionId]);
  });

  it('mixed 允许全维度回填，但仍严格匹配难度', () => {
    const mixedLessons: Lesson[] = [
      makeLesson('l1-basics', [makeQuestion('math-q', { difficulty: 'beginner' })]),
      makeLesson('l1-position', [makeQuestion('preflop-q', { difficulty: 'beginner' })]),
      makeLesson('l3-cbet', [makeQuestion('postflop-q', { difficulty: 'beginner' })]),
      makeLesson('l1-bankroll', [makeQuestion('mental-advanced', { difficulty: 'advanced' })]),
    ];
    const result = getQuickDrillQuestions(mixedLessons, ['math'], 'beginner', 5, [], [], 'mixed');
    expect(result.map((q) => q.id).sort()).toEqual(['math-q', 'postflop-q', 'preflop-q']);
  });

  it('严格模式无匹配维度时返回空数组，不跨模式补题', () => {
    const onlyMath = [makeLesson('l1-basics', [makeQuestion('math-q', { difficulty: 'beginner' })])];
    expect(getQuickDrillQuestions(onlyMath, [], 'beginner', 5, [], [], 'range')).toEqual([]);
  });

  it('缺省难度按 beginner 处理，不进入 advanced 严格池', () => {
    const unmarked = [makeLesson('l1-basics', [makeQuestion('unmarked-q')])];
    expect(getQuickDrillQuestions(unmarked, [], 'beginner', 1)).toHaveLength(1);
    expect(getQuickDrillQuestions(unmarked, [], 'advanced', 1)).toEqual([]);
  });

  it('count 小于等于 0 时返回空数组', () => {
    expect(getQuickDrillQuestions(lessons, [], 'beginner', 0)).toEqual([]);
    expect(getQuickDrillQuestions(lessons, [], 'beginner', -1)).toEqual([]);
  });

  it('空题池返回空数组', () => {
    expect(getQuickDrillQuestions([], [], 'beginner', 5)).toEqual([]);
  });

  it('全部题目被排除时返回空数组', () => {
    expect(getQuickDrillQuestions(lessons, [], 'beginner', 5, ['l1', 'l2'])).toEqual([]);
  });
});
