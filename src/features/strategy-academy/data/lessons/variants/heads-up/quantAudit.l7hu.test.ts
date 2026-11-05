import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L7 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / formula / theory-reference / takeaway）。
 *
 * 既有 q1-q5 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定 L7 新增内容。口径单源（与 l3hu / l4hu / 理论侧 t9hu 同一套式子）：
 * - SPR = 有效筹码 ÷ 翻牌圈底池
 * - 价值下注 EV = f×P + (1−f)×[e×(P+b) − (1−e)×b]
 *
 * ===================== 人工复核索引（题号即 q1-q10） =====================
 * [正确] l7hu-stakes-q6：SPR = 98 ÷ 4 = 24.5（对照 3-bet 底池 80 ÷ 18.5 ≈ 4.3）
 * [正确] l7hu-stakes-q7：0.4×4 + 0.6×(0.7×6 − 0.3×2) = 1.60 + 2.16 = +3.76BB
 * [正确] l7hu-stakes-q8：SPR 4.3 的承诺判断（45% 池建立底池，非全下）
 * [定性] l7hu-stakes-q9：SB=按钮位、翻前先行动 / 翻后最后行动（IP）的机制陈述，无新增数值
 * [定性] l7hu-stakes-q10：6-max → HU 迁移边界（对手数量 + 位置），无新增数值
 * [正确] l7hu-stakes-ex3：SPR = 93 ÷ 14 ≈ 6.6，翻牌 1/3 池 = 14 ÷ 3 ≈ 4.67BB
 * ==========================================================================
 */
const LESSON_ID = 'l7hu-stakes';

/** 保留一位小数（比值口径，如 SPR 24.5 / 4.3） */
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

describe('quantAudit L7HU：结构与门禁字段', () => {
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
    expect(answerOf(`${LESSON_ID}-q1`)).toBe('约 80%');
    expect(answerOf(`${LESSON_ID}-q2`)).toBe('任何对子和 Ax');
    expect(answerOf(`${LESSON_ID}-q3`)).toBe('频繁 C-Bet，多 bluff');
    expect(answerOf(`${LESSON_ID}-q4`)).toBe('极大，BTN 每手牌都有位置优势');
    expect(answerOf(`${LESSON_ID}-q5`)).toBe('更宽的价值下注');
    expect(quizOf(`${LESSON_ID}-q1`).options).toEqual(['20-30%', '30-40%', '50-70%', '约 80%']);
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
    ).toEqual(['t9hu-mastery', 't9hu-unified']);
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

  it('实战保持 5 题（不再新增 p4/p6），每题恰有 1 个正确选项', () => {
    const questions = lesson().practice?.questions ?? [];
    expect(questions.length).toBe(5);
    expect(questions.map((q) => q.id)).toEqual(
      Array.from({ length: 5 }, (_, i) => `${LESSON_ID}-p${i + 1}`),
    );
    for (const question of questions) {
      expect(question.options.filter((o) => o.isCorrect).length).toBe(1);
      expect(question.relatedLessonId).toBe(LESSON_ID);
    }
  });

  it('变体上下文保留 dealerButtonPosition 与 sb_ante/100BB', () => {
    const context = lesson().variantContext;
    expect(lesson().variant).toBe('heads-up');
    expect(context?.anteStructure).toBe('sb_ante');
    expect(context?.stackDepth).toBe(100);
    expect(context?.dealerButtonPosition).toBe('HU_SB');
  });
});

describe('quantAudit L7HU：新增数值题与公式块复算', () => {
  it('q6：SPR = 98 ÷ 4 = 24.5（3-bet 底池 80 ÷ 18.5 ≈ 4.3 对照）', () => {
    const spr = (stack: number, pot: number) => stack / pot;
    expect(round1(spr(98, 4))).toBe(24.5);
    expect(round1(spr(80, 18.5))).toBe(4.3);
    expect(answerOf(`${LESSON_ID}-q6`)).toBe('约 24.5');

    const formula = contentText();
    expect(formula).toContain('SPR = 98 ÷ 4 = 24.5');
    expect(formula).toContain('SPR = 80 ÷ 18.5 ≈ 4.3');
  });

  it('q7：0.4×4 + 0.6×(0.7×6 − 0.3×2) = +3.76BB（两个分支漏算各为错误项）', () => {
    const foldBranch = 0.4 * 4;
    const calledBranch = 0.6 * (0.7 * 6 - 0.3 * 2);
    expect(foldBranch).toBeCloseTo(1.6, 10);
    expect(calledBranch).toBeCloseTo(2.16, 10);
    expect(foldBranch + calledBranch).toBeCloseTo(3.76, 10);
    expect(answerOf(`${LESSON_ID}-q7`)).toBe('+3.76BB');
    const question = quizOf(`${LESSON_ID}-q7`);
    expect(question.options).toContain('+1.60BB');
    expect(question.options).toContain('+2.16BB');
  });

  it('q8：SPR 4.3 的翻牌尺度 18.5 × 45% ≈ 8.3BB（与 p5 的 8BB 口径互锁）', () => {
    expect(round1(18.5 * 0.45)).toBe(8.3);
    expect(answerOf(`${LESSON_ID}-q8`)).toContain('45%');
    const practice = lesson().practice?.questions ?? [];
    const p5 = practice.find((q) => q.id === `${LESSON_ID}-p5`);
    const p5Correct = p5?.options.find((o) => o.isCorrect);
    expect(p5Correct?.action).toBe('Bet 8BB（约45% pot）');
  });

  it('ex3：SPR = 93 ÷ 14 ≈ 6.6、翻牌 1/3 池 = 14 ÷ 3 ≈ 4.67BB', () => {
    expect(round1(93 / 14)).toBe(6.6);
    expect(14 / 3).toBeCloseTo(4.6667, 3);
    const ex3 = (lesson().examples ?? []).find((ex) => ex.id === `${LESSON_ID}-ex3`);
    expect(ex3?.potSize).toBe(14);
    expect(ex3?.effectiveStack).toBe(93);
    expect(ex3?.correctDecision.amount).toBe('4.7BB（1/3 pot）');
    expect(ex3?.street).toBe('flop');
  });

  it('q9 解析锁定 SB=按钮位、翻前先行动 / 翻后最后行动（IP）', () => {
    const explanation = quizOf(`${LESSON_ID}-q9`).explanation;
    expect(explanation).toContain('SB 是按钮位');
    expect(explanation).toContain('翻后才是它最后行动（IP）');
    expect(explanation).not.toContain('SB 翻后先行动');
  });
});
