import { describe, expect, it } from 'vitest';
import { HEADS_UP_STRATEGY_COURSES } from './index';
import type { Lesson, QuizQuestion } from '../../../../types';

/**
 * 单挑策略 L5 量化审计（本批扩容新增的 q6-q10 / ex2-ex3 / p4 / theory-reference / takeaway）。
 *
 * 既有 q1-q5 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定 L5 新增内容。口径单源（与 l3hu / l4hu 同一套式子）：
 * - 一街 EV = f × P − (1 − f) × b；下注保本弃牌率 α = b ÷ (P + b)
 * - 跟注所需胜率 = 再跟额 ÷ 跟注后总底池（含双方已投入的钱）
 * - x/r 半诈唬保本弃牌率 f ≥ R ÷ (P + R)
 * - 单街成牌率 = outs ÷ 46（翻牌后未知牌 52 − 2 − 3 − 1）
 *
 * ===================== 人工复核索引（题号即 q6-q10） =====================
 * [正确] l5hu-focus-q6：200 手/小时 × 1.5 小时 = 300 手
 * [正确] l5hu-focus-q7：100 ÷ 200 = 0.5 小时 = 30 分钟
 * [正确] l5hu-focus-q8：0.45×4−0.55×1.33 ≈ +1.07 与 0.30×4−0.70×1.33 ≈ +0.27 的差 ≈ −0.80BB
 * [定性] l5hu-focus-q9/q10：疲劳劣化 vs 策略选择、波动预算处置，无新增数值
 * [正确] l5hu-opponent-psychology-q6：50 ÷ 200 = 0.25 小时 = 15 分钟
 * [正确] l5hu-opp-psychology-q7：0.5×4−0.5×1.33 ≈ +1.34BB
 * [定性] l5hu-opp-psychology-q8/q10：反读取的代价、12 手样本不足以定为频率
 * [正确] l5hu-opp-psychology-q9：5 ÷ (10+5+5) = 25%
 * [正确] l5hu-focus-ex2：1.33 ÷ 5.33 ≈ 25%（1/3 池）与 8 ÷ 12 ≈ 66.7%（2 倍超池）
 * [正确] l5hu-focus-ex3：8 ÷ (4+8+8) = 40%（2 倍底池的河牌跟注线）
 * [正确] l5hu-opp-psychology-ex2：9 ÷ (18+9+9) = 25%；EV = 0.45×27 − 0.55×9 = +7.2BB
 * [正确] l5hu-opp-psychology-ex3：12 ÷ 24 = 50%；15 outs = 9 花 + 8 顺 − 重叠 2
 * [正确] l5hu-opp-psychology-p4：5 ÷ (13+5) ≈ 27.8%
 * [示意值] BB 面对 C-Bet 的弃牌率 45%/50%、河牌诈唬占比 45%、x/r 弃牌率 55%/62%、样本 120 手
 * ==========================================================================
 */
const LESSON_IDS = ['l5hu-focus', 'l5hu-opponent-psychology'];

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

/** 选项文本比对：U+2212 负号与 ASCII 连字符等价（题库内统一用 U+2212，避免口径分裂在字形上） */
const norm = (s: string): string => s.replace(/−/g, '-');

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

describe('quantAudit L5HU：新增内容结构', () => {
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

  it('每课 3 个牌例（ex2/ex3 新增）、3 段手写小节、2 条理论引用与 1 个 takeaway', () => {
    for (const lessonId of LESSON_IDS) {
      const lesson = lessonOf(lessonId);
      expect((lesson.examples ?? []).map((ex) => ex.id), `${lessonId} 牌例 id`).toEqual([
        `${lessonId}-ex1`,
        `${lessonId}-ex2`,
        `${lessonId}-ex3`,
      ]);
      const units = lesson.units ?? [];
      expect(units.length, `${lessonId} 小节数`).toBe(3);
      expect(units.map((u) => u.id), `${lessonId} 小节 id`).toEqual(['u1', 'u2', 'u3']);
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
        expect(ref.content).not.toContain('《');
      }
      expect(lesson.content.filter((s) => s.type === 'takeaway').length, `${lessonId} takeaway`).toBe(1);
      // 心态 / 心理课不强行造公式：避免把心理变量包装成假精确的算式
      expect(lesson.content.filter((s) => s.type === 'formula').length, `${lessonId} formula`).toBe(0);
      expect(lesson.content.length, `${lessonId} 正文段数`).toBeGreaterThanOrEqual(10);
      expect(lesson.content.length, `${lessonId} 正文段数`).toBeLessThanOrEqual(14);
    }
  });

  it('theory-reference 锚点与 lessonMeta 一致（t8hu-pressure/t8hu-tilt-types/t7hu-hand-reading/t8hu-reads）', () => {
    const anchorsOf = (lessonId: string) =>
      lessonOf(lessonId)
        .content.filter((s) => s.type === 'theory-reference')
        .map((s) => s.data?.theoryChapterId);
    expect(anchorsOf('l5hu-focus')).toEqual(['t8hu-pressure', 't8hu-tilt-types']);
    expect(anchorsOf('l5hu-opponent-psychology')).toEqual(['t7hu-hand-reading', 't8hu-reads']);
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

  it('variantContext：两课都补 sb_ante，且心态/心理课不写死 stackDepth', () => {
    for (const lessonId of LESSON_IDS) {
      const ctx = lessonOf(lessonId).variantContext;
      expect(ctx?.anteStructure, `${lessonId} anteStructure`).toBe('sb_ante');
      expect(ctx?.stackDepth, `${lessonId} 不写 stackDepth`).toBeUndefined();
    }
  });
});

describe('quantAudit L5HU：新增数值题逐题复算', () => {
  it('l5hu-focus：90 分钟 ≈ 300 手、每 100 手 ≈ 30 分钟', () => {
    expect(200 * 1.5).toBe(300);
    expect(answerOf('l5hu-focus', 'l5hu-focus-q6')).toBe('约 300 手');

    expect(100 / 200).toBe(0.5);
    expect((100 / 200) * 60).toBe(30);
    expect(answerOf('l5hu-focus', 'l5hu-focus-q7')).toBe('每 30 分钟');
  });

  it('l5hu-focus-q8：弃牌率 45% → 30% 的一街 EV 差 ≈ −0.80BB', () => {
    const ev = (fold: number) => fold * 4 - (1 - fold) * 1.33;
    expect(pct(ev(0.45))).toBe(106.8);
    expect(pct(ev(0.3))).toBe(26.9);
    const delta = ev(0.3) - ev(0.45);
    expect(Math.round(delta * 100) / 100).toBe(-0.8);
    expect(norm(answerOf('l5hu-focus', 'l5hu-focus-q8'))).toBe('约 -0.80BB');
  });

  it('l5hu-opponent-psychology：50 手 ≈ 15 分钟、50% 弃牌率的 C-Bet ≈ +1.34BB', () => {
    expect((50 / 200) * 60).toBe(15);
    expect(answerOf('l5hu-opponent-psychology', 'l5hu-opponent-psychology-q6')).toBe('约 15 分钟');

    const ev = 0.5 * 4 - 0.5 * 1.33;
    expect(pct(ev)).toBe(133.5);
    expect(norm(answerOf('l5hu-opponent-psychology', 'l5hu-opponent-psychology-q7'))).toBe(
      '约 +1.34BB',
    );
  });

  it('l5hu-opponent-psychology-q9：跟注 5 进 20 只需 25%（禁混用 33.3%/20%）', () => {
    const required = 5 / (10 + 5 + 5);
    expect(required).toBe(0.25);
    expect(5 / 15).toBeCloseTo(1 / 3, 10);
    expect(answerOf('l5hu-opponent-psychology', 'l5hu-opponent-psychology-q9')).toBe('25%');
  });
});

describe('quantAudit L5HU：新增牌例与实战的赔率复算', () => {
  it('l5hu-focus-ex2：1/3 池 25% 与 2 倍超池 66.7% 的尺度对比', () => {
    expect(pct(1.33 / (4 + 1.33))).toBe(25);
    expect(pct(8 / (4 + 8))).toBe(66.7);
    const ex2 = (lessonOf('l5hu-focus').examples ?? []).find(
      (ex) => ex.id === 'l5hu-focus-ex2',
    );
    expect(ex2?.potSize).toBe(4);
    expect(ex2?.correctDecision.amount).toBe('1.3BB（1/3 pot）');
    const text = [ex2?.correctDecision.reasoning.join('\n') ?? '', ex2?.commonMistake.reasoning ?? ''].join('\n');
    expect(text).toContain('66.7%');
  });

  it('l5hu-focus-ex3：2 倍底池下的河牌跟注线 = 8 ÷ 20 = 40%', () => {
    expect(pct(8 / (4 + 8 + 8))).toBe(40);
    const ex3 = (lessonOf('l5hu-focus').examples ?? []).find(
      (ex) => ex.id === 'l5hu-focus-ex3',
    );
    expect(ex3?.street).toBe('river');
    expect(ex3?.potSize).toBe(12);
    expect(ex3?.correctDecision.action).toBe('Fold');
    expect(ex3?.correctDecision.reasoning.join('\n')).toContain('40%');
  });

  it('l5hu-opponent-psychology-ex2：半池跟注线 25% 与诈唬占比 45% 的 EV', () => {
    const required = 9 / (18 + 9 + 9);
    expect(pct(required)).toBe(25);
    const evCall = 0.45 * 27 - 0.55 * 9;
    expect(evCall).toBeCloseTo(7.2, 10);
    const evIfTwenty = 0.2 * 27 - 0.8 * 9;
    expect(evIfTwenty).toBeCloseTo(-1.8, 10);
    expect(evCall).toBeGreaterThan(0);
    expect(evIfTwenty).toBeLessThan(0);
    const text = contentText('l5hu-opponent-psychology');
    expect(text).toContain('约 15 分钟');
  });

  it('l5hu-opponent-psychology-ex3：x/r 保本 50% 与 15 outs（9 花 + 8 顺 − 2 重叠）', () => {
    expect(pct(12 / (12 + 12))).toBe(50);
    // 手牌 QcJc + 板 9c5c2dTh：同花 13−4=9；顺子 8（4 张 8 + 4 张 K），其中 8♣/K♣ 已计入同花
    expect(9 + 8 - 2).toBe(15);
    expect(Math.round((15 / 46) * 100)).toBe(33);
    const ex3 = (lessonOf('l5hu-opponent-psychology').examples ?? []).find(
      (ex) => ex.id === 'l5hu-opponent-psychology-ex3',
    );
    expect(ex3?.board).toEqual(['9c', '5c', '2d', 'Th']);
    expect(ex3?.correctDecision.amount).toBe('12BB');
    expect(ex3?.correctDecision.reasoning.join('\n')).toContain('15 outs');
  });

  it('l5hu-opponent-psychology-p4：被 x/r 后 5 ÷ 18 ≈ 27.8% 的跟注线', () => {
    expect(pct(5 / (13 + 5))).toBe(27.8);
    const p4 = (lessonOf('l5hu-opponent-psychology').practice?.questions ?? []).find(
      (q) => q.id === 'l5hu-opponent-psychology-p4',
    );
    expect(p4?.options.find((o) => o.isCorrect)?.explanation).toContain('27.8%');
  });

  it('正文断言：专注力 takeaway 锁定 200 手 × 90 分钟 ≈ 300 手', () => {
    const text = contentText('l5hu-focus');
    expect(text).toContain('每小时约 200 手');
    expect(text).toContain('约 300 手');
    expect(text).toContain('约 30 分钟');
  });
});
