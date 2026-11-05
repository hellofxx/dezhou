import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L8 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / p4 / formula / theory-reference / takeaway）。
 *
 * 既有 q1-q5 与 p1-p3 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定 L8 新增内容。口径单源（与 l3hu / l4hu / 理论侧 t7hu 同一套式子）：
 * - 一街 EV = f×P − (1−f)×b
 * - 频率标准误 = √(p(1−p)/n)（偏离需 ≥2 个标准误）
 * - SB min-raise 偷盲保本弃牌率 = 1.5 ÷ (1.5 + 1.5) = 50%（沉没成本口径，禁回退 60%）
 *
 * ===================== 人工复核索引（题号即 q1-q10） =====================
 * [正确] l8hu-exploitative-q6：0.62×4 − 0.38×1.33 = 2.48 − 0.51 ≈ +1.97BB（均衡 45% → +1.07BB）
 * [正确] l8hu-exploitative-q7：√(0.62×0.38/100) ≈ 4.9 个百分点
 * [正确] l8hu-exploitative-q8：√(0.62×0.38/20) ≈ 10.9 个百分点，17pp 差只有约 1.6 个标准误 → 先取样
 * [定性] l8hu-exploitative-q9：方向 / 幅度上限 / 样本证据三门槛
 * [定性] l8hu-exploitative-q10：弃牌过多与跟注过多两个反向偏离的对照
 * [正确] l8hu-exploitative-ex3：弃牌率 30% 时偷盲 EV = 0.3×1.5 − 0.7×1.5 = −0.6BB（保本线 50%）
 * ==========================================================================
 */
const LESSON_ID = 'l8hu-exploitative';

/** 保留两位小数（BB 口径） */
const round2 = (x: number) => Math.round(x * 100) / 100;
/** 保留一位小数（百分点 / 倍率口径） */
const round1 = (x: number) => Math.round(x * 10) / 10;

const lesson = (): Lesson => {
  const found = HEADS_UP_STRATEGY_COURSES.find((candidate) => candidate.id === LESSON_ID);
  expect(found, `课程 ${LESSON_ID} 存在`).toBeDefined();
  return found as Lesson;
};

const quizOf = (questionId: string): QuizQuestion => {
  const question = lesson().quiz.find((candidate) => candidate.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question as QuizQuestion;
};

const answerOf = (questionId: string): string => {
  const question = quizOf(questionId);
  expect(question.correctIndex).toBeGreaterThanOrEqual(0);
  expect(question.correctIndex).toBeLessThan(question.options.length);
  return question.options[question.correctIndex] as string;
};

const contentText = (): string =>
  lesson()
    .content.map((section) => section.content)
    .join('\n');

describe('quantAudit L8HU：结构与门禁字段', () => {
  it('题库 10 题、题号连续、四选一且解析非空', () => {
    const quiz = lesson().quiz;
    expect(quiz.length).toBe(10);
    expect(quiz.map((q) => q.id)).toEqual(
      Array.from({ length: 10 }, (_, i) => `${LESSON_ID}-q${i + 1}`),
    );
    for (const q of quiz) {
      expect(q.options.length, `${q.id} 选项数`).toBe(4);
      expect(new Set(q.options).size, `${q.id} 选项唯一`).toBe(4);
      expect(q.correctIndex >= 0 && q.correctIndex < 4, `${q.id} correctIndex`).toBe(true);
      expect(q.explanation.trim().length, `${q.id} 解析`).toBeGreaterThan(0);
    }
  });

  it('既有 q1-q5 判分答案未被改动（选项顺序与正确项锁定）', () => {
    expect(answerOf(`${LESSON_ID}-q1`)).toBe('以 GTO 为基线，针对对手明确偏离做最小必要偏离');
    expect(answerOf(`${LESSON_ID}-q2`)).toBe('提高 C-Bet/偷盲频率与诈唬密度');
    expect(answerOf(`${LESSON_ID}-q5`)).toBe('跨 50-100 手的统计');
    expect(quizOf(`${LESSON_ID}-q5`).options).toEqual([
      '单手牌印象',
      '跨 50-100 手的统计',
      '对手外貌',
      '随机猜测',
    ]);
  });

  it('3 个牌例（ex2/ex3 新增）、3 个手写小节、2 条理论引用、1 个 formula 与 1 个 takeaway', () => {
    const target = lesson();
    expect((target.examples ?? []).map((ex) => ex.id)).toEqual([
      `${LESSON_ID}-ex1`,
      `${LESSON_ID}-ex2`,
      `${LESSON_ID}-ex3`,
    ]);
    const units = target.units ?? [];
    expect(units.length).toBe(3);
    expect(units.map((unit) => unit.id)).toEqual(['u1', 'u2', 'u3']);
    for (const unit of units) {
      expect(unit.checkpoint, `${unit.id} 不设 checkpoint`).toBeFalsy();
      expect(unit.sections.length).toBeGreaterThan(0);
      for (const section of unit.sections) {
        expect(target.content.includes(section), `${unit.id} 引用相等`).toBe(true);
      }
      const exampleIds = new Set((target.examples ?? []).map((ex) => ex.id));
      expect(exampleIds.has(unit.exampleId ?? ''), `${unit.id} exampleId 有效`).toBe(true);
    }
    const refs = target.content.filter((section) => section.type === 'theory-reference');
    expect(refs.length).toBe(2);
    for (const ref of refs) {
      expect(typeof ref.data?.theoryChapterId).toBe('string');
      expect(typeof ref.data?.theoryLevelId).toBe('string');
      expect(ref.content).toContain('理论学院 T');
      expect(ref.content).not.toMatch(/t\dhu-/);
      expect(ref.content).not.toContain('《');
    }
    expect(
      refs.map((ref) => ref.data?.theoryChapterId).toSorted(),
      '锚点与 lessonMeta.theoryAnchors 一致',
    ).toEqual(['t7hu-exploit', 't7hu-stats']);
    expect(target.content.filter((section) => section.type === 'takeaway').length).toBe(1);
    expect(target.content.filter((section) => section.type === 'formula').length).toBe(1);
    expect(target.content.length >= 10 && target.content.length <= 14, '正文段数 10-14').toBe(true);
  });

  it('新增牌例的 board 张数与 street 一致、手牌与公共牌不重复、数值为正', () => {
    const boardLen: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };
    for (const ex of (lesson().examples ?? []).slice(1)) {
      expect(ex.board?.length ?? 0, `${ex.id} board 张数`).toBe(boardLen[ex.street]);
      const cards = [...ex.heroHand, ...(ex.board ?? [])];
      expect(new Set(cards).size, `${ex.id} 卡牌不重复`).toBe(cards.length);
      expect(ex.effectiveStack).toBeGreaterThan(0);
      expect(ex.potSize).toBeGreaterThan(0);
      expect(ex.correctDecision.reasoning.length).toBeGreaterThan(0);
      expect(ex.commonMistake.evLoss.trim().length).toBeGreaterThan(0);
    }
  });

  it('实战新增 p4（共 4 题），每题恰有 1 个正确选项', () => {
    const questions = lesson().practice?.questions ?? [];
    expect(questions.length).toBe(4);
    expect(questions.map((q) => q.id)).toEqual(
      Array.from({ length: 4 }, (_, i) => `${LESSON_ID}-p${i + 1}`),
    );
    for (const question of questions) {
      expect(question.options.filter((o) => o.isCorrect).length).toBe(1);
      expect(question.relatedLessonId).toBe(LESSON_ID);
    }
    const p4 = questions.find((q) => q.id === `${LESSON_ID}-p4`);
    expect(p4?.options.find((o) => o.isCorrect)?.action).toBe('Bet 3BB（75% pot）');
  });

  it('变体上下文为 sb_ante/100BB 且不引入 dealerButtonPosition', () => {
    const context = lesson().variantContext;
    expect(lesson().variant).toBe('heads-up');
    expect(context?.anteStructure).toBe('sb_ante');
    expect(context?.stackDepth).toBe(100);
    expect(context?.dealerButtonPosition).toBeUndefined();
  });
});

describe('quantAudit L8HU：新增数值题与公式块复算', () => {
  it('q6：0.62×4 − 0.38×1.33 ≈ +1.97BB（均衡 45% → +1.07BB，边际 +0.90BB）', () => {
    const ev = (foldRate: number) => foldRate * 4 - (1 - foldRate) * 1.33;
    expect(round2(ev(0.62))).toBe(1.97);
    expect(round2(ev(0.45))).toBe(1.07);
    expect(round1(ev(0.62) - ev(0.45))).toBe(0.9);
    expect(answerOf(`${LESSON_ID}-q6`)).toBe('+1.97BB');
    expect(quizOf(`${LESSON_ID}-q6`).explanation).toContain('+1.07');
  });

  it('q7/q8：标准误 100 手 4.9pp、20 手 10.9pp，17pp 差只有约 1.6 个标准误', () => {
    const se = (n: number) => Math.sqrt((0.62 * 0.38) / n);
    expect(round1(se(100) * 100)).toBe(4.9);
    expect(round1(se(20) * 100)).toBe(10.9);
    expect(round1(0.17 / se(100))).toBe(3.5);
    expect(round1(0.17 / se(20))).toBe(1.6);
    expect(answerOf(`${LESSON_ID}-q7`)).toBe('约 4.9 个百分点');
    expect(answerOf(`${LESSON_ID}-q8`)).toBe('继续取样，暂不偏离');
    expect(quizOf(`${LESSON_ID}-q8`).explanation).toContain('1.6 个标准误');
  });

  it('formula 块：EV 与标准误两条式子数值互锁', () => {
    const formula = contentText();
    expect(formula).toContain('2.48 − 0.51 ≈ +1.97BB');
    expect(formula).toContain('1.80 − 0.73 ≈ +1.07BB');
    expect(formula).toContain('≈ 4.9 个百分点');
    expect(formula).toContain('≈ 10.9 个百分点');
    expect(formula).toContain('约 3.5 个标准误');
  });

  it('ex3：保本弃牌率 50%，弃牌率 30% 时偷盲 EV = −0.6BB', () => {
    const breakEven = 1.5 / (1.5 + 1.5);
    expect(breakEven).toBe(0.5);
    expect(round1(0.3 * 1.5 - 0.7 * 1.5)).toBe(-0.6);
    const ex3 = (lesson().examples ?? []).find((ex) => ex.id === `${LESSON_ID}-ex3`);
    const reasons = (ex3?.correctDecision.reasoning ?? []).join('\n');
    expect(reasons).toContain('1.5 ÷ 3');
    expect(reasons).toContain('−0.6BB');
    expect(reasons).not.toContain('60%');
    expect(ex3?.correctDecision.action).toBe('Fold');
  });

  it('ex2：跟注站节点 75% 池 = 3BB（底池 4BB），小注 1/3 池 ≈ 1.33BB', () => {
    expect(round2(4 * 0.75)).toBe(3);
    expect(round2(4 / 3)).toBe(1.33);
    const ex2 = (lesson().examples ?? []).find((ex) => ex.id === `${LESSON_ID}-ex2`);
    expect(ex2?.correctDecision.amount).toBe('3BB（75% pot）');
    expect(ex2?.board).toEqual(['Qh', '8c', '4s']);
  });
});
