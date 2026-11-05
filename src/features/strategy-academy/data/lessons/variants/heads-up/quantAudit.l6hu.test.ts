import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L6 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / p4 / formula / theory-reference）。
 *
 * 既有 q1-q5 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定 L6 新增内容。口径单源（与 l3hu / l4hu / l7sd-shallow-stack 同一套式子）：
 * - EV(全下) = f × P + (1 − f) × [E × (P + S) − (1 − E) × S]
 *   P = 全下前底池（含双方已投死钱）、S = 全下额、f = 对手弃牌率、E = 被跟注时胜率
 * - 被跟注分支 A = E × (P + S) − (1 − E) × S；保本弃牌率 f ≥ |A| ÷ (P + |A|)
 * - 跟注所需胜率 = 再跟额 ÷ 跟注后总底池；ICM（赢家通吃）近似随筹码线性 = 己方 ÷ 总量
 *
 * ===================== 人工复核索引（题号即 q6-q10） =====================
 * [正确] l6hu-tourney-q6：A = 0.45×13.5 − 0.55×12 = −0.525；EV = 0.5×1.5 + 0.5×(−0.525) ≈ +0.49BB
 * [正确] l6hu-tourney-q7：f ≥ 0.525 ÷ (1.5 + 0.525) ≈ 25.9%
 * [正确] l6hu-tourney-q8：1.5BB/圈 × 4 圈 = 6BB（12BB → 6BB，减半）
 * [定性] l6hu-tourney-q9：20-40BB 与 15BB 以下的分界依据（S 变大 → E 下降 → 门槛抬高）
 * [正确] l6hu-tourney-q10：60 ÷ (60 + 20) = 75%（赢家通吃的线性 ICM）
 * [正确] l6hu-tourney-ex2：A = 0.45×26.5 − 0.55×25 = −1.825；f ≥ 1.825 ÷ 3.325 ≈ 54.9%
 * [正确] l6hu-tourney-ex3：A = 0.42×9.5 − 0.58×8 = −0.65；f ≥ 0.65 ÷ 2.15 ≈ 30.2%；
 *        f = 35% 时 EV = 0.35×1.5 − 0.65×0.65 ≈ +0.10BB
 * [正确] l6hu-tourney-p4：A = 0.44×10.5 − 0.56×9 = −0.42；f ≥ 0.42 ÷ 1.92 ≈ 21.9%；
 *        f = 45% 时 EV = 0.45×1.5 − 0.55×0.42 ≈ +0.44BB
 * [示意值] 对手弃牌率 35%/45%/50%、被跟注胜率 42%/44%/45%、E 从 58% 掉到 45%
 * ==========================================================================
 */
const LESSON_ID = 'l6hu-tourney';

const lessonOf = (lessonId: string): Lesson => {
  const lesson = HEADS_UP_STRATEGY_COURSES.find((candidate) => candidate.id === lessonId);
  expect(lesson, `课程 ${lessonId} 存在`).toBeDefined();
  return lesson as Lesson;
};

const quizOf = (questionId: string): QuizQuestion => {
  const question = lessonOf(LESSON_ID).quiz.find((candidate) => candidate.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question as QuizQuestion;
};

/** 选项文本比对：U+2212 负号与 ASCII 连字符等价（题库内统一用 U+2212，避免字形分裂口径） */
const norm = (s: string): string => s.replace(/−/g, '-');

const answerOf = (questionId: string): string => {
  const question = quizOf(questionId);
  expect(question.correctIndex).toBeGreaterThanOrEqual(0);
  expect(question.correctIndex).toBeLessThan(question.options.length);
  return question.options[question.correctIndex] as string;
};

const pct = (x: number) => Math.round(x * 1000) / 10;

/** 全下 EV 口径：A 为被跟注分支；f 为对手弃牌率 */
const calledBranch = (pot: number, shove: number, equity: number): number =>
  equity * (pot + shove) - (1 - equity) * shove;
const shoveEv = (pot: number, shove: number, equity: number, fold: number): number =>
  fold * pot + (1 - fold) * calledBranch(pot, shove, equity);
const breakEvenFold = (pot: number, shove: number, equity: number): number => {
  const branch = calledBranch(pot, shove, equity);
  return Math.abs(branch) / (pot + Math.abs(branch));
};

const contentText = (lessonId: string): string =>
  lessonOf(lessonId)
    .content.map((section) => section.content)
    .join('\n');

const exampleOf = (exampleId: string) => {
  const example = (lessonOf(LESSON_ID).examples ?? []).find((ex) => ex.id === exampleId);
  expect(example, `牌例 ${exampleId} 存在`).toBeDefined();
  return example!;
};

describe('quantAudit L6HU：新增内容结构', () => {
  it('10 题、题号连续 q1-q10、四选一且解析非空', () => {
    const quiz = lessonOf(LESSON_ID).quiz;
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

  it('3 个牌例、3 段手写小节、2 条理论引用、1 个 takeaway 与 1 个可复算 formula', () => {
    const lesson = lessonOf(LESSON_ID);
    expect((lesson.examples ?? []).map((ex) => ex.id)).toEqual([
      `${LESSON_ID}-ex1`,
      `${LESSON_ID}-ex2`,
      `${LESSON_ID}-ex3`,
    ]);
    const units = lesson.units ?? [];
    expect(units.length).toBe(3);
    expect(units.map((u) => u.id)).toEqual(['u1', 'u2', 'u3']);
    for (const unit of units) {
      expect(unit.checkpoint, `${unit.id} 不设 checkpoint`).toBeFalsy();
      expect(unit.sections.length, `${unit.id} 有正文`).toBeGreaterThan(0);
      for (const section of unit.sections) {
        expect(lesson.content.includes(section), `${unit.id} 引用相等`).toBe(true);
      }
    }
    const refs = lesson.content.filter((s) => s.type === 'theory-reference');
    expect(refs.length).toBe(2);
    for (const ref of refs) {
      expect(typeof ref.data?.theoryChapterId).toBe('string');
      expect(typeof ref.data?.theoryLevelId).toBe('string');
      expect(ref.content).toContain('理论学院 T');
      expect(ref.content).not.toMatch(/t\dhu-/);
      expect(ref.content).not.toContain('《');
    }
    expect(lesson.content.filter((s) => s.type === 'takeaway').length).toBe(1);
    expect(lesson.content.filter((s) => s.type === 'formula').length).toBe(1);
    expect(lesson.content.length).toBeGreaterThanOrEqual(10);
    expect(lesson.content.length).toBeLessThanOrEqual(14);
  });

  it('theory-reference 锚点与 lessonMeta 一致（t9hu-icm / t9hu-cash-vs-mtt）', () => {
    const anchors = lessonOf(LESSON_ID)
      .content.filter((s) => s.type === 'theory-reference')
      .map((s) => s.data?.theoryChapterId);
    expect(anchors).toEqual(['t9hu-icm', 't9hu-cash-vs-mtt']);
  });

  it('新增牌例的 board 张数与 street 一致、手牌与公共牌不重复', () => {
    const boardLen: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };
    for (const ex of (lessonOf(LESSON_ID).examples ?? []).slice(1)) {
      expect(ex.board?.length ?? 0, `${ex.id} board 张数`).toBe(boardLen[ex.street]);
      const cards = [...ex.heroHand, ...(ex.board ?? [])];
      expect(new Set(cards).size, `${ex.id} 卡牌不重复`).toBe(cards.length);
      expect(ex.effectiveStack).toBeGreaterThan(0);
      expect(ex.potSize).toBeGreaterThan(0);
    }
  });

  it('新增 1 个 practice 题（p4），恰有 1 个正确选项', () => {
    const questions = lessonOf(LESSON_ID).practice?.questions ?? [];
    expect(questions.length).toBe(4);
    const p4 = questions.find((q) => q.id === `${LESSON_ID}-p4`);
    expect(p4).toBeDefined();
    expect(p4!.options.filter((o) => o.isCorrect).length).toBe(1);
    expect(p4!.relatedLessonId).toBe(LESSON_ID);
  });

  it('variantContext：sb_ante + stackDepth 40 保持', () => {
    const ctx = lessonOf(LESSON_ID).variantContext;
    expect(ctx?.anteStructure).toBe('sb_ante');
    expect(ctx?.stackDepth).toBe(40);
  });
});

describe('quantAudit L6HU：全下 EV 与保本弃牌率逐项复算', () => {
  it('formula：A = −0.525、EV ≈ +0.49BB、保本 25.9% 三处互锁', () => {
    expect(calledBranch(1.5, 12, 0.45)).toBeCloseTo(-0.525, 10);
    expect(shoveEv(1.5, 12, 0.45, 0.5)).toBeCloseTo(0.4875, 10);
    expect(pct(breakEvenFold(1.5, 12, 0.45))).toBe(25.9);

    const formula = contentText(LESSON_ID);
    expect(formula).toContain('EV(全下) = f × P + (1 − f) × [E × (P + S) − (1 − E) × S]');
    expect(formula).toContain('0.45 × 13.5 − 0.55 × 12 = 6.075 − 6.6 = −0.525BB');
    expect(formula).toContain('0.75 − 0.2625 ≈ +0.49BB');
    expect(formula).toContain('0.525 ÷ (1.5 + 0.525) ≈ 25.9%');
  });

  it('q6/q7：同一输入下的 EV 与保本弃牌率（禁把输入当门槛）', () => {
    expect(norm(answerOf('l6hu-tourney-q6'))).toBe('约 +0.49BB');
    expect(answerOf('l6hu-tourney-q7')).toBe('约 25.9%');
    expect(norm(answerOf('l6hu-tourney-q6'))).not.toBe('约 -0.53BB');
  });

  it('q8：每圈 1.5BB 盲注 × 4 圈 = 6BB（12BB 减半）', () => {
    expect(1.5 * 4).toBe(6);
    expect(12 - 6).toBe(6);
    expect(answerOf('l6hu-tourney-q8')).toBe('付 6BB，剩 6BB');
  });

  it('q10：赢家通吃的线性 ICM = 60 ÷ 80 = 75%', () => {
    expect(pct(60 / (60 + 20))).toBe(75);
    expect(answerOf('l6hu-tourney-q10')).toBe('约 75%');
  });

  it('l6hu-tourney-ex2：25BB 全下保本 54.9%（中筹码不转全下的数学依据）', () => {
    expect(calledBranch(1.5, 25, 0.45)).toBeCloseTo(-1.825, 10);
    expect(pct(breakEvenFold(1.5, 25, 0.45))).toBe(54.9);
    const ex2 = exampleOf('l6hu-tourney-ex2');
    expect(ex2.effectiveStack).toBe(25);
    expect(ex2.correctDecision.action).toBe('Min-raise');
    expect(ex2.correctDecision.reasoning.join('\n')).toContain('54.9%');
  });

  it('l6hu-tourney-ex3：8BB 全下保本 30.2%、f=35% 时 EV ≈ +0.10BB', () => {
    expect(calledBranch(1.5, 8, 0.42)).toBeCloseTo(-0.65, 10);
    expect(pct(breakEvenFold(1.5, 8, 0.42))).toBe(30.2);
    expect(Math.round(shoveEv(1.5, 8, 0.42, 0.35) * 100) / 100).toBe(0.1);
    const ex3 = exampleOf('l6hu-tourney-ex3');
    expect(ex3.effectiveStack).toBe(8);
    expect(ex3.correctDecision.action).toBe('All-in');
    expect(ex3.correctDecision.reasoning.join('\n')).toContain('30.2%');
  });

  it('l6hu-tourney-p4：9BB 全下保本 21.9%、f=45% 时 EV ≈ +0.44BB', () => {
    expect(calledBranch(1.5, 9, 0.44)).toBeCloseTo(-0.42, 10);
    expect(pct(breakEvenFold(1.5, 9, 0.44))).toBe(21.9);
    expect(Math.round(shoveEv(1.5, 9, 0.44, 0.45) * 100) / 100).toBe(0.44);
    const p4 = (lessonOf(LESSON_ID).practice?.questions ?? []).find(
      (q) => q.id === `${LESSON_ID}-p4`,
    );
    const explanation = p4?.options.find((o) => o.isCorrect)?.explanation ?? '';
    expect(explanation).toContain('21.9%');
    expect(explanation).toContain('+0.44BB');
  });

  it('正文断言：takeaway 锁定「每圈 1.5BB / 4 圈只剩 6BB」与保本率口径', () => {
    const text = contentText(LESSON_ID);
    expect(text).toContain('每圈盲注合计 1.5BB');
    expect(text).toContain('12BB 的筹码等 4 圈就只剩 6BB（减半）');
    expect(text).toContain('0.525 ÷ 2.025 ≈ 25.9%');
  });
});
