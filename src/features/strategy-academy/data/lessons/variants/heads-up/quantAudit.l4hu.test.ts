import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L4 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / p4 / formula / takeaway）。
 *
 * 既有 q1-q5 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落（本文件不改它）；
 * 本文件只锁定 L4 新增内容。口径单源（与 L3 及理论侧 t2hu/t4hu/t5hu/t7hu 同一套式子）：
 * - 纯偷盲保本弃牌率 f = 再投额 ÷（底池 1.5 + 再投额）；EV(steal) = f×1.5 − (1−f)×1.5
 * - 跟注所需胜率 = 再跟额 ÷（跟注前底池 + 对手下注 + 跟注额）
 * - 诈唬占比 = b ÷ (1 + 2b)；MDF = 1 ÷ (1 + b)
 * - 一街 C-Bet EV = f × P − (1 − f) × b；x/r 保本弃牌率 f ≥ R ÷ (P + R)
 * - 两街成牌概率 = 1 − (未中/剩牌) × (未中/剩牌)
 *
 * ===================== 人工复核索引（题号即 q6-q10） =====================
 * [正确] bn-opening-q6/q7/q8：57.1%（2 ÷ 3.5）、62.5%（2.5 ÷ 4）、−0.45BB（0.35×1.5 − 0.65×1.5）
 * [正确] ev-adjustments-q6/q7/q8：20%（2 ÷ 10）、25%（2 ÷ 8）、+0.4BB（0.30×6 − 0.70×2）
 * [正确] gto-basics-q6/q7/q8：66.7%（1 ÷ 1.5）、25%（0.5 ÷ 2）、MDF 33.3% 与诈唬 40%
 * [正确] counter-strategies-q6/q7/q8：0BB、+0.9BB（0.8×1.5 − 0.2×1.5）、+1.60BB（0.55×4 − 0.45×1.33）
 * [定性] 各课 q9/q10：宽度来源、保本点、隐含赔率、位置语义、节点锁定、反制过头
 * [正确] p4 / ex2 / ex3：0.21BB、两街 35%、1.5 ÷ 5 = 30%、半池 25%、4 ÷ 9.3 ≈ 43%
 * ==========================================================================
 */
const LESSON_IDS = [
  'l4hu-bn-opening',
  'l4hu-ev-adjustments',
  'l4hu-gto-basics',
  'l4hu-counter-strategies',
];

const ANCHORS: Record<string, string[]> = {
  'l4hu-bn-opening': ['t4hu-range-width', 't5hu-preflop-equilibrium'],
  'l4hu-ev-adjustments': ['t2hu-ev', 't2hu-risk'],
  'l4hu-gto-basics': ['t5hu-gto-he', 't5hu-frequency'],
  'l4hu-counter-strategies': ['t5hu-node-locking', 't7hu-exploit'],
};

const lessonOf = (lessonId: string): Lesson => {
  const lesson = HEADS_UP_STRATEGY_COURSES.find((candidate) => candidate.id === lessonId);
  expect(lesson, `课程 ${lessonId} 存在`).toBeDefined();
  return lesson as Lesson;
};

const quizOf = (lessonId: string, questionId: string): QuizQuestion => {
  const question = lessonOf(lessonId).quiz.find((candidate) => candidate.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  return question as QuizQuestion;
};

const answerOf = (lessonId: string, questionId: string): string => {
  const question = quizOf(lessonId, questionId);
  expect(question.correctIndex).toBeGreaterThanOrEqual(0);
  expect(question.correctIndex).toBeLessThan(question.options.length);
  return question.options[question.correctIndex] as string;
};

const contentText = (lessonId: string): string =>
  lessonOf(lessonId)
    .content.map((section) => section.content)
    .join('\n');

const pct = (x: number) => Math.round(x * 1000) / 10;

describe('quantAudit L4HU：新增内容结构', () => {
  it('每课 10 题、题号连续 q1-q10、四选一且解析非空', () => {
    for (const lessonId of LESSON_IDS) {
      const quiz = lessonOf(lessonId).quiz;
      expect(quiz.length, `${lessonId} 题量`).toBe(10);
      expect(quiz.map((q) => q.id), `${lessonId} 题号`).toEqual(
        Array.from({ length: 10 }, (_, i) => `${lessonId}-q${i + 1}`),
      );
      for (const q of quiz) {
        expect(q.options.length, `${q.id} 选项数`).toBe(4);
        expect(new Set(q.options).size, `${q.id} 选项唯一`).toBe(4);
        expect(q.correctIndex >= 0 && q.correctIndex < 4, `${q.id} correctIndex`).toBe(true);
        expect(q.explanation.trim().length, `${q.id} 解析`).toBeGreaterThan(0);
      }
    }
  });

  it('每课 3 个牌例、3 个手写小节、2 条理论引用、1 个 takeaway 与 1 个 formula', () => {
    for (const lessonId of LESSON_IDS) {
      const lesson = lessonOf(lessonId);
      expect((lesson.examples ?? []).map((ex) => ex.id), `${lessonId} 牌例 id`).toEqual([
        `${lessonId}-ex1`,
        `${lessonId}-ex2`,
        `${lessonId}-ex3`,
      ]);
      const units = lesson.units ?? [];
      expect(units.map((u) => u.id), `${lessonId} 小节 id`).toEqual(['u1', 'u2', 'u3']);
      for (const unit of units) {
        expect(unit.checkpoint, `${lessonId}/${unit.id} 不设 checkpoint`).toBeFalsy();
        expect(unit.sections.length, `${lessonId}/${unit.id} 有正文`).toBeGreaterThan(0);
        for (const section of unit.sections) {
          expect(lesson.content.includes(section), `${lessonId}/${unit.id} 引用相等`).toBe(true);
        }
      }
      const refs = lesson.content.filter((s) => s.type === 'theory-reference');
      expect(refs.map((ref) => ref.data?.theoryChapterId)).toEqual(ANCHORS[lessonId]);
      for (const ref of refs) {
        expect(typeof ref.data?.theoryLevelId).toBe('string');
        expect(ref.content).toContain('理论学院 T');
        expect(ref.content).not.toMatch(/t\dhu-/);
      }
      expect(lesson.content.filter((s) => s.type === 'takeaway').length, lessonId).toBe(1);
      expect(lesson.content.filter((s) => s.type === 'formula').length, lessonId).toBe(1);
      expect(lesson.content.length, `${lessonId} 段落数`).toBeGreaterThanOrEqual(10);
      expect(lesson.content.length, `${lessonId} 段落数`).toBeLessThanOrEqual(14);
    }
  });

  it('variantContext 统一 sb_ante + 100BB，按钮位归属只落在 bn-opening', () => {
    for (const lessonId of LESSON_IDS) {
      const ctx = lessonOf(lessonId).variantContext;
      expect(ctx?.anteStructure, `${lessonId} 前注结构`).toBe('sb_ante');
      expect(ctx?.stackDepth, `${lessonId} 筹码深度`).toBe(100);
      if (lessonId === 'l4hu-bn-opening') {
        expect(ctx?.dealerButtonPosition).toBe('HU_SB');
      } else {
        expect(ctx?.dealerButtonPosition, `${lessonId} 不声明按钮位`).toBeUndefined();
      }
    }
  });

  it('新增牌例的 board 张数与 street 一致、手牌与公共牌不重复', () => {
    const boardLen: Record<string, number> = { preflop: 0, flop: 3, turn: 4, river: 5 };
    for (const lessonId of LESSON_IDS) {
      for (const ex of (lessonOf(lessonId).examples ?? []).slice(1)) {
        expect(ex.board?.length ?? 0, `${ex.id} board 张数`).toBe(boardLen[ex.street]);
        const cards = [...ex.heroHand, ...(ex.board ?? [])];
        expect(new Set(cards).size, `${ex.id} 卡牌不重复`).toBe(cards.length);
        expect(ex.effectiveStack).toBeGreaterThan(0);
        expect(ex.potSize).toBeGreaterThan(0);
      }
    }
  });

  it('每课新增 1 个 practice 题（p4），恰有 1 个正确选项', () => {
    for (const lessonId of LESSON_IDS) {
      const questions = lessonOf(lessonId).practice?.questions ?? [];
      expect(questions.length, `${lessonId} 实战题量`).toBe(4);
      const p4 = questions.find((q) => q.id === `${lessonId}-p4`);
      expect(p4, `${lessonId}-p4 存在`).toBeDefined();
      expect(p4!.options.filter((o) => o.isCorrect).length).toBe(1);
      expect(p4!.relatedLessonId).toBe(lessonId);
    }
  });
});

describe('quantAudit L4HU：新增数值题逐题复算', () => {
  const stealEV = (f: number) => f * 1.5 - (1 - f) * 1.5;
  const breakEven = (extra: number) => extra / (1.5 + extra);
  const required = (call: number, pot: number, bet: number) => call / (pot + bet + call);

  it('l4hu-bn-opening：50% / 57.1% / 62.5% 三条保本线与 EV 代入', () => {
    expect(pct(breakEven(1.5))).toBe(50);
    expect(pct(breakEven(2))).toBe(57.1);
    expect(pct(breakEven(2.5))).toBe(62.5);
    expect(stealEV(0.35)).toBeCloseTo(-0.45, 10);
    expect(stealEV(0.55)).toBeCloseTo(0.15, 10);
    expect(stealEV(0.57)).toBeCloseTo(0.21, 10);

    expect(answerOf('l4hu-bn-opening', 'l4hu-bn-opening-q6')).toBe('约 57.1%');
    expect(answerOf('l4hu-bn-opening', 'l4hu-bn-opening-q7')).toBe('62.5%');
    expect(answerOf('l4hu-bn-opening', 'l4hu-bn-opening-q8')).toContain('0.45BB');

    const formula = contentText('l4hu-bn-opening');
    expect(formula).toContain('f = 1.5/(1.5+1.5) = 50%');
    expect(formula).toContain('2.5BB（再投 2）→ 2/3.5 ≈ 57.1%');
    expect(formula).toContain('2.5/4 = 62.5%');
    expect(formula).toContain('0.35×1.5 − 0.65×1.5 = −0.45BB');
    expect(formula).toContain('0.55×1.5 − 0.45×1.5 = +0.15BB');
  });

  it('l4hu-ev-adjustments：20% / 25% / 33.3% / 30% 四档跟注线与 EV(call)', () => {
    expect(pct(required(2, 6, 2))).toBe(20);
    expect(pct(required(2, 4, 2))).toBe(25);
    expect(pct(required(4, 4, 4))).toBe(33.3);
    expect(pct(required(1.5, 1.5, 2))).toBe(30);
    const evCall = 0.3 * (4 + 2) - 0.7 * 2;
    expect(evCall).toBeCloseTo(0.4, 10);

    expect(answerOf('l4hu-ev-adjustments', 'l4hu-ev-adjustments-q6')).toBe('20%');
    expect(answerOf('l4hu-ev-adjustments', 'l4hu-ev-adjustments-q7')).toBe('25%');
    expect(answerOf('l4hu-ev-adjustments', 'l4hu-ev-adjustments-q8')).toBe('+0.4BB');

    const formula = contentText('l4hu-ev-adjustments');
    expect(formula).toContain('1 ÷ (1.5 + 1.5 + 1) = 1 ÷ 4 = 25%');
    expect(formula).toContain('不可漏算');
    expect(formula).toContain('2 ÷ (6 + 2 + 2) = 20%');
    expect(formula).toContain('4 ÷ (4 + 4 + 4) = 33.3%');
    expect(formula).toContain('0.30×6 − 0.70×2 = 1.8 − 1.4 = +0.4BB');
  });

  it('l4hu-gto-basics：MDF 与诈唬占比四条尺度（1/3、半池、满池、2 倍池）', () => {
    const mdf = (b: number) => 1 / (1 + b);
    const bluff = (b: number) => b / (1 + 2 * b);
    expect(pct(mdf(1 / 3))).toBe(75);
    expect(pct(mdf(0.5))).toBe(66.7);
    expect(pct(mdf(1))).toBe(50);
    expect(pct(mdf(2))).toBe(33.3);
    expect(pct(bluff(0.5))).toBe(25);
    expect(pct(bluff(2))).toBe(40);

    expect(answerOf('l4hu-gto-basics', 'l4hu-gto-basics-q6')).toBe('66.7%');
    expect(answerOf('l4hu-gto-basics', 'l4hu-gto-basics-q7')).toBe('25%');
    expect(answerOf('l4hu-gto-basics', 'l4hu-gto-basics-q8')).toBe('33.3% 与 40%');

    const formula = contentText('l4hu-gto-basics');
    expect(formula).toContain('f = b/(1+2b) = 1/(1+2) = 1/3');
    expect(formula).toContain('2 倍池（b=2）：f = 2/(1+4) = 40%');
    expect(formula).toContain('1/3 池 → 75%');
  });

  it('l4hu-counter-strategies：0 / +0.3 / +0.6 / +0.9 BB 与 1/3 池 C-Bet EV', () => {
    expect(stealEV(0.4)).toBeCloseTo(-0.3, 10);
    expect(stealEV(0.5)).toBeCloseTo(0, 10);
    expect(stealEV(0.6)).toBeCloseTo(0.3, 10);
    expect(stealEV(0.7)).toBeCloseTo(0.6, 10);
    expect(stealEV(0.8)).toBeCloseTo(0.9, 10);
    const cbetEV = 0.55 * 4 - 0.45 * 1.33;
    expect(cbetEV).toBeCloseTo(1.6015, 3);

    expect(answerOf('l4hu-counter-strategies', 'l4hu-counter-strategies-q6')).toBe('0BB');
    expect(answerOf('l4hu-counter-strategies', 'l4hu-counter-strategies-q7')).toBe('+0.9BB');
    expect(answerOf('l4hu-counter-strategies', 'l4hu-counter-strategies-q8')).toBe('+1.60BB');

    const formula = contentText('l4hu-counter-strategies');
    expect(formula).toContain('0.4×1.5 − 0.6×1.5 = −0.3BB');
    expect(formula).toContain('0.6×1.5 − 0.4×1.5 = +0.3BB');
    expect(formula).toContain('0.7×1.5 − 0.3×1.5 = +0.6BB');
    expect(formula).toContain('0.8×1.5 − 0.2×1.5 = +0.9BB');
    expect(contentText('l4hu-counter-strategies')).toContain('0.55×4 − 0.45×1.33 = 2.20 − 0.60 ≈ +1.60BB');
  });
});

describe('quantAudit L4HU：新增牌例与实战的赔率复算', () => {
  it('l4hu-bn-opening-ex2 / ex3：弃牌率与尺度的方向相反', () => {
    const ex2 = (lessonOf('l4hu-bn-opening').examples ?? []).find(
      (ex) => ex.id === 'l4hu-bn-opening-ex2',
    );
    expect(ex2?.street).toBe('preflop');
    expect(ex2?.correctDecision.action).toBe('Min-raise');
    expect(ex2?.correctDecision.reasoning.join('\n')).toContain('2 ÷ 3.5');

    const ex3 = (lessonOf('l4hu-bn-opening').examples ?? []).find(
      (ex) => ex.id === 'l4hu-bn-opening-ex3',
    );
    expect(ex3?.street).toBe('preflop');
    expect(ex3?.correctDecision.reasoning.join('\n')).toContain('−0.45BB');
  });

  it('l4hu-ev-adjustments-ex2 / ex3：两街 35% 与 2.5BB 开池的 30% 跟注线', () => {
    const twoStreet = 1 - (38 / 47) * (37 / 46);
    expect(pct(twoStreet)).toBe(35);
    expect(twoStreet).toBeGreaterThan(2 / (4 + 2 + 2));

    const ex2 = (lessonOf('l4hu-ev-adjustments').examples ?? []).find(
      (ex) => ex.id === 'l4hu-ev-adjustments-ex2',
    );
    expect(ex2?.street).toBe('flop');
    expect(ex2?.board).toEqual(['Js', '7s', '2h']);
    expect(ex2?.potSize).toBe(6);

    const ex3 = (lessonOf('l4hu-ev-adjustments').examples ?? []).find(
      (ex) => ex.id === 'l4hu-ev-adjustments-ex3',
    );
    expect(ex3?.street).toBe('preflop');
    expect(ex3?.correctDecision.reasoning.join('\n')).toContain('1.5 ÷ 5 = 30%');
  });

  it('l4hu-gto-basics-ex3 / p4：半池跟注线与 MDF 的组合', () => {
    expect(pct(5.5 / (11 + 5.5 + 5.5))).toBe(25);
    const ex3 = (lessonOf('l4hu-gto-basics').examples ?? []).find(
      (ex) => ex.id === 'l4hu-gto-basics-ex3',
    );
    expect(ex3?.street).toBe('river');
    expect(ex3?.board?.length).toBe(5);

    const p4 = (lessonOf('l4hu-gto-basics').practice?.questions ?? []).find(
      (q) => q.id === 'l4hu-gto-basics-p4',
    );
    expect(pct(8 / (16 + 8 + 8))).toBe(25);
    expect(p4?.options.find((o) => o.isCorrect)?.action).toBe('Call');
  });

  it('l4hu-counter-strategies-ex3：x/r 保本弃牌率 43%', () => {
    expect(pct(4 / (5.3 + 4))).toBe(43);
    const ex3 = (lessonOf('l4hu-counter-strategies').examples ?? []).find(
      (ex) => ex.id === 'l4hu-counter-strategies-ex3',
    );
    expect(ex3?.correctDecision.action).toBe('Check-Raise');
    expect(ex3?.correctDecision.reasoning.join('\n')).toContain('4 ÷ (5.3 + 4) ≈ 43%');
  });
});
