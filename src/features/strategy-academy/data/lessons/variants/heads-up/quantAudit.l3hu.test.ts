import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L3 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / p4 / formula）。
 *
 * 既有 q1-q5 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定 L3 新增内容。口径单源（与 l4hu / 理论侧 t3hu 同一套式子）：
 * - 下注保本弃牌率 α = b ÷ (P + b)；一街 EV = f × P − (1 − f) × b
 * - MDF = P ÷ (P + b)；诈唬密度 = b ÷ (1 + 2b)
 * - 跟注所需胜率 = 再跟额 ÷ 跟注后总底池（含双方已投入的死钱）
 * - x/r 半诈唬保本弃牌率 f ≥ R ÷ (P + R)
 * - 两街成牌概率 = 1 − (未中/剩牌) × (未中/剩牌)；单街 = outs ÷ 46
 *
 * ===================== 人工复核索引（题号即 q1-q10） =====================
 * [正确] l3hu-bn-aggression-q6：1.33 ÷ (4 + 1.33) ≈ 25%
 * [正确] l3hu-bn-aggression-q7：0.6×4 − 0.4×1.33 ≈ +1.87BB
 * [正确] l3hu-bn-aggression-q8：2.67 ÷ (4 + 2.67) ≈ 40%
 * [定性] l3hu-bn-aggression-q9：25% 保本线的机制陈述，无新增数值
 * [定性] l3hu-bn-aggression-q10：被 x/r 后的弃牌决策，无新增数值
 * [正确] l3hu-sb-continuation-q6：MDF = 1 ÷ (1 + 1/3) = 75%
 * [正确] l3hu-sb-continuation-q7：0.67 ÷ 2.33 ≈ 28.6%（1/3 池 20% 对照）
 * [定性] l3hu-sb-continuation-q8/q9/q10：中性面分层、check 语义、x/r 保本率
 * [正确] l3hu-bb-defense-q6：3 ÷ 8 = 37.5%
 * [正确] l3hu-bb-defense-q7：4 ÷ 9.3 ≈ 43%
 * [定性] l3hu-bb-defense-q8/q10：3-bet 分叠依据、check-call 补偿
 * [正确] l3hu-bb-defense-q9：4 ÷ 10 = 40%（min-raise 25% 对照）
 * [正确] l3hu-bn-aggression-p4：15 outs = 8 顺 + 9 花 − 2 重叠
 * [正确] l3hu-bn-aggression-ex2：6 ÷ (18 + 6) = 25% 跟注线
 * [正确] l3hu-bn-aggression-ex3 / l3hu-sb-continuation-ex3 / l3hu-bb-defense-ex3：两街概率与
 *        x/r 保本率逐项复算；l3hu-bb-defense-ex2：3 + 6 = 9BB 底池
 * [已修] l3hu-bn-aggression-p3 解析残留板面「J-6-2」→「J-7-2」（板面早批已改，解析漏改；
 *        98 于 J-6-2 面无单街顺，本批与 en 对齐，回归锁见下方用例）
 * ==========================================================================
 */
const LESSON_IDS = ['l3hu-bn-aggression', 'l3hu-sb-continuation', 'l3hu-bb-defense'];

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

const pct = (x: number) => Math.round(x * 1000) / 10;

const contentText = (lessonId: string): string =>
  lessonOf(lessonId)
    .content.map((section) => section.content)
    .join('\n');

describe('quantAudit L3HU：新增内容结构', () => {
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

  it('每课 3 个牌例（ex2/ex3 新增）、3 个手写小节、2 条理论引用与 1 个 takeaway', () => {
    for (const lessonId of LESSON_IDS) {
      const lesson = lessonOf(lessonId);
      const exampleIds = (lesson.examples ?? []).map((ex) => ex.id);
      expect(exampleIds, `${lessonId} 牌例 id`).toEqual([
        `${lessonId}-ex1`,
        `${lessonId}-ex2`,
        `${lessonId}-ex3`,
      ]);
      const units = lesson.units ?? [];
      expect(units.length, `${lessonId} 小节数`).toBe(3);
      expect(units.map((u) => u.id)).toEqual(['u1', 'u2', 'u3']);
      for (const unit of units) {
        expect(unit.checkpoint, `${lessonId}/${unit.id} 不设 checkpoint`).toBeFalsy();
        expect(unit.sections.length, `${lessonId}/${unit.id} 有正文`).toBeGreaterThan(0);
        for (const section of unit.sections) {
          expect(lesson.content.includes(section), `${lessonId}/${unit.id} 引用相等`).toBe(true);
        }
      }
      const refs = lesson.content.filter((s) => s.type === 'theory-reference');
      expect(refs.length, `${lessonId} 理论引用数`).toBe(2);
      for (const ref of refs) {
        expect(typeof ref.data?.theoryChapterId).toBe('string');
        expect(typeof ref.data?.theoryLevelId).toBe('string');
        expect(ref.content).toContain('理论学院 T');
        expect(ref.content).not.toMatch(/t\dhu-/);
      }
      expect(lesson.content.filter((s) => s.type === 'takeaway').length).toBe(1);
      expect(lesson.content.filter((s) => s.type === 'formula').length).toBe(1);
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

describe('quantAudit L3HU：新增数值题逐题复算', () => {
  it('l3hu-bn-aggression：25% / +1.87BB / 40% 三条门槛与公式块互锁', () => {
    const alpha = (b: number, p: number) => b / (p + b);
    expect(pct(alpha(1.33, 4))).toBe(25);
    expect(pct(alpha(2.67, 4))).toBe(40);

    expect(answerOf('l3hu-bn-aggression', 'l3hu-bn-aggression-q6')).toBe('约 25%');
    expect(answerOf('l3hu-bn-aggression', 'l3hu-bn-aggression-q8')).toBe('约 40%');

    const ev = 0.6 * 4 - 0.4 * 1.33;
    expect(ev * 100).toBeCloseTo(186.8, 1);
    expect(answerOf('l3hu-bn-aggression', 'l3hu-bn-aggression-q7')).toBe('+1.87BB');

    const formula = contentText('l3hu-bn-aggression');
    expect(formula).toContain('1.33 ÷ 5.33 ≈ 25%');
    expect(formula).toContain('2.67 ÷ 6.67 ≈ 40%');
    expect(formula).toContain('≈ +1.87BB');
  });

  it('l3hu-sb-continuation：1/3 池 MDF 75%、2/3 池诈唬密度 28.6%', () => {
    const mdf = (b: number) => 1 / (1 + b);
    const bluff = (b: number) => b / (1 + 2 * b);
    expect(pct(mdf(1 / 3))).toBe(75);
    expect(pct(mdf(0.5))).toBe(66.7);
    expect(pct(mdf(2 / 3))).toBe(60);
    expect(pct(bluff(1 / 3))).toBe(20);
    expect(pct(bluff(2 / 3))).toBe(28.6);

    expect(answerOf('l3hu-sb-continuation', 'l3hu-sb-continuation-q6')).toBe('75%');
    expect(answerOf('l3hu-sb-continuation', 'l3hu-sb-continuation-q7')).toBe('约 28.6%');

    const formula = contentText('l3hu-sb-continuation');
    expect(formula).toContain('MDF = 1 ÷ (1 + 1/3) = 75%');
    expect(formula).toContain('0.67 ÷ 2.33 ≈ 28.6%');
  });

  it('l3hu-bb-defense：4BB 跟注 37.5%、x/r 43%、5BB 跟注 40%（禁回退 33.3%）', () => {
    const required = (call: number, total: number) => call / total;
    expect(pct(required(3, 8))).toBe(37.5);
    expect(pct(required(4, 10))).toBe(40);
    expect(0.5 + 1 + 1).toBe(2.5); // 死钱口径：min-raise 时弃跟 1BB 只需 25%
    expect(pct(required(1, 4))).toBe(25);
    expect(answerOf('l3hu-bb-defense', 'l3hu-bb-defense-q6')).toBe('37.5%');
    expect(answerOf('l3hu-bb-defense', 'l3hu-bb-defense-q9')).toBe(
      '收窄，因为跟注所需胜率从 25% 升到 40%',
    );

    const breakEvenXr = 4 / (5.3 + 4);
    expect(pct(breakEvenXr)).toBe(43);
    expect(answerOf('l3hu-bb-defense', 'l3hu-bb-defense-q7')).toBe('约 43%');

    const threeBet = 6 / (3 + 6);
    expect(pct(threeBet)).toBe(66.7);
    const practiceText = (lessonOf('l3hu-bb-defense').practice?.questions ?? [])
      .flatMap((q) => q.options.map((o) => o.explanation))
      .join('\n');
    expect(practiceText).toContain('6 ÷ (3 + 6) ≈ 67%');

    const formula = contentText('l3hu-bb-defense');
    expect(formula).toContain('3 ÷ 8 = 37.5%');
    expect(formula).toContain('4 ÷ 10 = 40%');
    expect(formula).toContain('4 ÷ 9.3 ≈ 43%');
    expect(`${formula}\n${practiceText}`).not.toContain('33.3%');
  });
});

describe('quantAudit L3HU：新增牌例与实战的 outs / 赔率复算', () => {
  it('l3hu-bn-aggression：15 outs 组合听牌、河牌 1/3 池只需 25% 胜率', () => {
    // 手牌 Th9h + 板 8h7c2h：同花 13−4=9，顺子 8（6/J），重叠 6h/Jh 2 张
    expect(9 + 8 - 2).toBe(15);
    expect(pct(15 / 47)).toBe(31.9);
    expect(pct(6 / (18 + 6))).toBe(25);
    const ex2 = (lessonOf('l3hu-bn-aggression').examples ?? []).find(
      (ex) => ex.id === 'l3hu-bn-aggression-ex2',
    );
    expect(ex2?.potSize).toBe(18);
    expect(ex2?.correctDecision.amount).toBe('6BB（1/3 pot）');
  });

  it('l3hu-sb-continuation：被 x/r 后 28.6% 跟注线 vs AK 两街 24%', () => {
    const potAfterXr = 4 + 2.7 + 9;
    expect(potAfterXr).toBe(15.7);
    expect(pct(6.3 / (15.7 + 6.3))).toBe(28.6);
    const twoStreet = 1 - (41 / 47) * (40 / 46);
    expect(pct(twoStreet)).toBe(24.1);
    expect(twoStreet).toBeLessThan(6.3 / (15.7 + 6.3));
    const ex3 = (lessonOf('l3hu-sb-continuation').examples ?? []).find(
      (ex) => ex.id === 'l3hu-sb-continuation-ex3',
    );
    expect(ex3?.street).toBe('flop');
    expect(ex3?.correctDecision.action).toBe('Fold');
  });

  it('l3hu-bb-defense：12 outs（9 花 + 3 顺）、两街 45%、单街 26%、3-bet 底池 9BB', () => {
    // 手牌 8s7s + 板 Js9c4s：同花 13−4=9；顺子 4 张 T，其中 T♠ 已计入同花 → 3
    expect(9 + 3).toBe(12);
    const twoStreet = 1 - (35 / 47) * (34 / 46);
    expect(pct(twoStreet)).toBe(45);
    expect(Math.round((12 / 46) * 100)).toBe(26);
    expect(3 + 6).toBe(9);
    const lesson = lessonOf('l3hu-bb-defense');
    const ex3 = (lesson.examples ?? []).find((ex) => ex.id === 'l3hu-bb-defense-ex3');
    expect(ex3?.correctDecision.amount).toBe('4BB');
    expect(ex3?.street).toBe('flop');
  });

  it('l3hu-bn-aggression-p3：解析板面与 scenario.board 同为 J-7-2（禁回退 J-6-2）', () => {
    const p3 = (lessonOf('l3hu-bn-aggression').practice?.questions ?? []).find(
      (q) => q.id === 'l3hu-bn-aggression-p3',
    );
    expect(p3?.scenario.board).toEqual(['Jd', '7c', '2s']);
    const explanations = (p3?.options ?? []).map((o) => o.explanation).join('\n');
    expect(explanations).toContain('J-7-2');
    expect(explanations).not.toContain('J-6-2');
  });
});
