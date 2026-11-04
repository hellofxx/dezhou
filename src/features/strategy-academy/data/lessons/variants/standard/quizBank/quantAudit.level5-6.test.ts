/**
 * L5/L6 题库数值题复算审计（C3 轨）。
 *
 * 口径与 data/lessons/variants/standardQuantAudit.test.ts 单源一致（禁止凭印象）：
 * - Kelly 最优比例 f* = (bp − q) / b；Half Kelly = f* / 2
 * - 资金管理 = 买入额 × 买入个数（现金最低 20 / 推荐 30-50，锦标赛 50-100）
 * - 跟注所需胜率 = 跟注额 ÷（底池 + 跟注额）⇒ 本课 Push/Fold 保本线 9 ÷ (11 + 9) = 45%
 * - ICM（SNG）$EV = Σ P(名次) × 奖金；Bubble Factor 以倍数作用于现金局所需胜率
 * - 赏金 $EV = 赏金 × 淘汰概率（淘汰概率 ≈ 筹码占比）
 *
 * 两类断言：
 * 1. 数值题：测试内**重新计算**，再与题库正确选项文本比对（数字或 correctIndex 漂移即红）。
 * 2. 阈值/区间题：先断言课程正文里确有该口径（文本锁定），再断言作答值 —— 防止只改题不改课。
 */
import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../../../../types';
import { STANDARD_LEVEL_5_LESSONS } from '../standardLevel5';
import { STANDARD_LEVEL_6_LESSONS } from '../standardLevel6';
import { LEVEL_5_QUIZ_BANK } from './level5';
import { LEVEL_6_QUIZ_BANK } from './level6';

const BANK: Record<string, QuizQuestion[]> = {
  ...LEVEL_5_QUIZ_BANK,
  ...LEVEL_6_QUIZ_BANK,
};

const LESSONS = [...STANDARD_LEVEL_5_LESSONS, ...STANDARD_LEVEL_6_LESSONS];

const CONTENT: Record<string, string> = Object.fromEntries(
  LESSONS.map((lesson) => [lesson.id, lesson.content.map((section) => section.content).join('\n')]),
);

const QUESTION_BY_ID = new Map<string, QuizQuestion>();
for (const questions of Object.values(BANK)) {
  for (const question of questions) QUESTION_BY_ID.set(question.id, question);
}

/** 取该题在题库中的正确选项文本（判分数据的唯一事实源） */
function answerOf(questionId: string): string {
  const question = QUESTION_BY_ID.get(questionId);
  expect(question, `题 ${questionId} 存在于 L5/L6 题库`).toBeDefined();
  const q = question as QuizQuestion;
  return q.options[q.correctIndex] ?? '';
}

/** 断言「正文确有该口径」——题目与课程不得各说一套 */
function expectContent(lessonId: string, needle: string): void {
  expect(CONTENT[lessonId], `课程 ${lessonId} 正文`).toBeDefined();
  expect(CONTENT[lessonId]).toContain(needle);
}

describe('L5/L6 题库结构', () => {
  it('每门非 Drill 课恰 10 题，题 id 课内唯一、序号连续且不与 lessonId 相撞', () => {
    const bad: string[] = [];
    const lessonIds = new Set(LESSONS.map((lesson) => lesson.id));
    for (const [lessonId, questions] of Object.entries(BANK)) {
      if (questions.length !== 10) bad.push(lessonId + ': ' + questions.length + ' 题');
      const ids = questions.map((q) => q.id);
      if (new Set(ids).size !== ids.length) bad.push(lessonId + ': 题 id 重复');
      questions.forEach((question, index) => {
        if (!question.id.endsWith('-q' + (index + 1))) bad.push(question.id + ': 序号应为 q' + (index + 1));
        if (lessonIds.has(question.id)) bad.push(question.id + ': 与 lesson id 相撞');
      });
    }
    expect(bad).toEqual([]);
  });
});

describe('L5 数值题复算：Kelly / 资金管理', () => {
  it('Kelly f* = (bp − q) / b：55% @1:1 → 10%、40% @2:1 → 10%', () => {
    const kelly = (b: number, p: number) => (b * p - (1 - p)) / b;
    expect(kelly(1, 0.55)).toBeCloseTo(0.1, 10);
    expect(kelly(2, 0.4)).toBeCloseTo(0.1, 10);
    expect(answerOf('l5-br-q6')).toBe('10%');
    expect(answerOf('l5-br-q7')).toBe('10%');
    // 正文同口径：60% @1:1 → 20%，Half Kelly → 10%
    expectContent('l5-bankroll', 'f* = (1×0.6 - 0.4) / 1 = 0.2 = 20%');
    expectContent('l5-bankroll', 'Half Kelly');
  });

  it('资金管理：20/30 个买入、50 个锦标赛买入、30 个 $2/$5 买入', () => {
    const cashMin = 20 * 200;
    const cashRecommended = 30 * 200;
    expect(cashMin).toBe(4000);
    expect(cashRecommended).toBe(6000);
    expect(answerOf('l5-br-q1')).toContain('$4,000');
    expectContent('l5-bankroll', '至少需要 20-30 个买入');
    expectContent('l5-bankroll', '推荐：30-50个买入');

    expect(50 * 20).toBe(1000);
    expect(answerOf('l5-br-q8')).toBe('$1,000');
    expectContent('l5-bankroll', '锦标赛至少需要 50-100 个买入');

    expect(30 * 500).toBe(15000);
    expect(answerOf('l5-br-q10')).toBe('$15,000');
  });

  it('VPIP/PFR 差距：45 − 25 = 20 个百分点，超过 8 个百分点阈值', () => {
    expect(45 - 25).toBe(20);
    expect(45 - 25).toBeGreaterThan(8);
    expect(answerOf('l5-dd-q6')).toBe('8 个百分点');
    expect(answerOf('l5-dd-q9')).toContain('20 个百分点');
    expectContent('l5-data-driven', 'VPIP/PFR 差距过大（>8）');
  });
});

describe('L5 阈值题与正文口径一致', () => {
  it('Tilt 暂停阈值 15%；好桌 VPIP 门槛 30%', () => {
    expect(answerOf('l5-tilt-q6')).toBe('15%');
    expectContent('l5-tilt', '正确率下降 >15% 时');
    expect(answerOf('l5-game-q6')).toBe('VPIP > 30%');
    expectContent('l5-game-selection', 'VPIP > 30%');
  });

  it('Session 纪律：单次 60 分钟上限、每 30 分钟休息 5 分钟', () => {
    expect(answerOf('l5-sr-q6')).toBe('60 分钟');
    expect(answerOf('l5-sr-q7')).toBe('5 分钟');
    expectContent('l5-session-review', '单次训练不超过 60 分钟');
    expectContent('l5-session-review', '每 30 分钟休息 5 分钟');
  });

  it('线下 25-35 手/小时、线上多桌从 2-4 桌起步', () => {
    expect(answerOf('l5-online-vs-live-q6')).toBe('25-35 手');
    expect(answerOf('l5-online-vs-live-q8')).toBe('2-4 桌');
    expectContent('l5-online-vs-live', '每小时约 25-35 手牌');
    expectContent('l5-online-vs-live', '从 2-4 桌开始');
  });
});

describe('L6 数值题复算：ICM', () => {
  it('夺冠概率 ≈ 筹码占比：40 / 100 = 40%', () => {
    expect(40 / (40 + 30 + 20 + 10)).toBeCloseTo(0.4, 10);
    expect(answerOf('l6-icm-q6')).toBe('40%');
    expectContent('l6-icm', 'P(A wins) = 40/(40+30+20+10) = 40%');
  });

  it('Bubble Factor 放大跟注门槛：25% × 1.5 = 37.5%', () => {
    expect(0.25 * 1.5).toBeCloseTo(0.375, 10);
    expect(answerOf('l6-icm-q7')).toBe('37.5%');
    expectContent('l6-icm', '25% × 1.5 = 37.5%');
  });

  it('SNG $EV = Σ P(名次) × 奖金：0.4×50 + 0.32×30 + 0.2×20 = $33.6', () => {
    const ev = 0.4 * 50 + 0.32 * 30 + 0.2 * 20;
    expect(ev).toBeCloseTo(33.6, 10);
    expect(answerOf('l6-icm-q10')).toBe('$33.6');
    expectContent('l6-icm', '0.4×$50 + 0.32×$30 + 0.2×$20 = $33.6');
    // 边际价值递减方向：50% 筹码的 $EV 低于筹码占比，10% 筹码的 $EV 高于筹码占比
    expectContent('l6-icm', '持有 50% 筹码的玩家，其 $EV 可能只有 40%');
    expectContent('l6-icm', '持有 10% 筹码的玩家，其 $EV 可能有 15%');
  });
});

describe('L6 数值题复算：Push/Fold 与赏金', () => {
  it('SB 10BB 全下保本胜率 = 9 ÷ (11 + 9) = 45%', () => {
    const potAfterShove = 10 + 1; // SB 全下 10 + BB 已投入 1
    const callAmount = 10 - 1;
    expect(callAmount / (potAfterShove + callAmount)).toBeCloseTo(0.45, 10);
    expect(answerOf('l6-pushfold-q8')).toBe('45%');
    expectContent('l6-pushfold', '所需胜率 = 9 ÷ (11 + 9) = 9/20 = 45%');
  });

  it('push / call 范围锚点：15BB BTN 25-30%、BB 对 BTN 10BB push 30-35%', () => {
    expect(answerOf('l6-pushfold-q6')).toBe('25-30%');
    expect(answerOf('l6-pushfold-q7')).toBe('30-35%');
    expectContent('l6-pushfold', 'BTN push：约 25-30%');
    expectContent('l6-pushfold', '面对 BTN 10BB push：call 约 30-35%');
  });

  it('赏金 $EV = 赏金 × 淘汰概率 = $20 × (5000/50000) = $2', () => {
    expect((5000 / 50000) * 20).toBeCloseTo(2, 10);
    expect(answerOf('l6-bounty-q6')).toBe('$2');
    expectContent('l6-bounty', '赏金贡献 $EV = 0.1 × $20 = $2');
    expect(answerOf('l6-bounty-q10')).toBe('5-10%');
    expectContent('l6-bounty', '放宽约 5-10%');
  });

  it('泡沫期与决赛桌锚点：100 人 / 前 15 名 → 16-18 人；HU BB defend 60-70%；open > 40%', () => {
    expect(answerOf('l6-bubble-q6')).toBe('16-18 人');
    expectContent('l6-bubble', '当只剩 16-18 人时，就是泡沫期');
    expect(answerOf('l6-finaltable-q6')).toBe('60-70%');
    expect(answerOf('l6-finaltable-q9')).toBe('40%');
    expectContent('l6-finaltable', 'BB defend 60-70%');
    expectContent('l6-finaltable', 'open > 40%');
  });
});
