/**
 * 单挑 T6 内容轨量化断言审计（本次扩容新增题中的数值题）。
 *
 * 口径与 standardQuantAudit / variantQuantAudit 同源：
 * - 薄价值保本胜率 w = B/(P+2B)（`requiredEquity`）
 * - 弃牌率保本线 α = B/(P+B)（`calculateAlpha`）、最低防守率 MDF = P/(P+B)（`calculateMDF`）
 * - 诈唬占比 f = b/(1+2b)、价值:诈唬 = (1−f):f
 * - outs 权益走 `outsToEquity`（52 张主线默认 47/46）
 * 本文件直接读 `quizBank/t6hu.ts`（不依赖聚合层），题库数字、correctIndex 或选项文本
 * 任一漂移即变红。
 *
 * 人工复核索引（正文散文数值，下标 0 起、含 heading 段）
 * [正确] t6hu-sizing-optimal idx11（尺度速查表）：f=b/(1+2b)=20.0/25.0/28.6/33.3/37.5%；
 *        α=b/(1+b)=25.0/33.3/40.0/50.0/60.0%；MDF=1/(1+b)=75.0/66.7/60.0/50.0/40.0%
 *        （1/3、1/2、2/3、1、1.5 五个尺度逐项复算）
 * [正确] t6hu-barrel idx11（三连注几何表）：P=5 逐街 2/3 池 → 3.3/11.7、7.8/27.2、18.1/63.5
 *        （与既有 t6hu-barrel idx2 同一几何链，四舍五入到 0.1）
 * [正确] t6hu-bet-purpose idx4：B/(P+2B) 于 P=8 → 1/4 池 16.7%、半池 25.0%、满池 33.3%
 * [正确] t6hu-bet-purpose idx5：0.3×12−0.7×4=+0.8；0.3×16−0.7×8=−0.8（同一 30% 胜率两尺度）
 * [正确] t6hu-bet-purpose idx6：α 于 P=8 → 20.0/33.3/50.0%；MDF → 80.0/66.7/50.0%
 * [正确] t6hu-bet-purpose idx7：0.45×8−0.55×4=+1.4；0.30×8−0.70×4=−0.4；
 *        门槛差 45−33.3=11.7 个百分点、33.3−30=3.3 个百分点
 * [正确] t6hu-bet-purpose idx10（目的与门槛表）：价值档 28.6–33.3%（2/3 与 1 倍池的 B/(P+2B)）、
 *        薄价值 16.7–20.0%、拒绝权益 33.3–40.0%（α）、诈唬 40.0–60.0%、权益实现 20.0%
 * [正确] t6hu-equity-realization idx2：门槛 4÷16=25.0%；25.0÷0.85=29.4%、25.0÷0.80=31.3%
 * [正确] t6hu-equity-realization idx3：9÷47=19.1%；1−(38/47)(37/46)=35.0%（outsToEquity 单源）
 * [正确] t6hu-equity-realization idx6：1−(39/47)(38/46)=31.5%（8 outs 两街，精确 31.45%）
 * [正确] t6hu-equity-realization idx7：门槛÷实现率=29.4%；账面 31% 过、22% 不过（29.4 为界）
 * [示意值] t6hu-equity-realization idx10（牌面折扣表）：0.70–1.00 的实现率区间无标定依据，
 *        正文标「经验区间」，只作量级不作承诺
 * [示意值] t6hu-equity-realization idx2/idx7 的实现率 0.85 / 0.80 本身为经验取值，
 *        倒推结论随该值线性移动（与 short-deck 同名章同一处置）
 * [定性] t6hu-equity-realization idx1/idx5/idx8：实现率由位置、主动权与牌面决定，机制陈述
 */
import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './t6hu';
import type { TheoryQuizQuestion } from '../../../../../types';
import {
  calculateAlpha,
  calculateMDF,
  outsToEquity,
  requiredEquity,
} from '../../../../../utils/theoryFormulas';

const getQuiz = (questionId: string): TheoryQuizQuestion => {
  for (const questions of Object.values(QUIZ_BANK)) {
    const found = questions.find((question) => question.id === questionId);
    if (found) return found;
  }
  throw new Error(`小测题 ${questionId} 不存在`);
};

const expectAnswerIs = (questionId: string, answer: string): void => {
  const question = getQuiz(questionId);
  expect(question.options[question.correctIndex], `${questionId} 复算后的正确选项`).toBe(answer);
};

/** 复算值取到十分位百分比，与正文「约 xx.x%」的书写精度一致 */
const pct = (x: number) => Math.round(x * 1000) / 10;
/** 诈唬占比 f = b/(1+2b)，b 为下注/底池倍数 */
const bluffShare = (b: number) => b / (1 + 2 * b);

describe('t6hu 量化审计：尺度表与门槛', () => {
  it('t6hu-sizing-optimal-q6：MDF = 6÷8 = 75%，α = 2÷8 = 25%', () => {
    expect(calculateMDF(6, 2)).toBe(0.75);
    expect(pct(calculateAlpha(6, 2))).toBe(25.0);
    expectAnswerIs('t6hu-sizing-optimal-q6', '75%');
  });

  it('t6hu-sizing-optimal-q8：f(2)=0.4 → 价值:诈唬 = 3:2', () => {
    expect(bluffShare(2)).toBe(0.4);
    expect(0.6 / 0.4).toBeCloseTo(1.5, 10);
    expectAnswerIs('t6hu-sizing-optimal-q8', '3:2');
  });

  it('t6hu-bet-purpose-q2：1/4 池薄价值保本胜率 = 2÷12 ≈ 16.7%', () => {
    expect(pct(requiredEquity(2, 8 + 2 * 2))).toBe(16.7);
    expect(pct(requiredEquity(4, 8 + 2 * 4))).toBe(25.0);
    expect(pct(requiredEquity(8, 8 + 2 * 8))).toBe(33.3);
    expectAnswerIs('t6hu-bet-purpose-q2', '16.7%');
  });

  it('t6hu-bet-purpose-q4：0.45×8−0.55×4 = +1.4BB（保本弃牌率 33.3%）', () => {
    const ev = 0.45 * 8 - 0.55 * 4;
    expect(ev).toBeCloseTo(1.4, 10);
    expect(pct(calculateAlpha(8, 4))).toBe(33.3);
    expectAnswerIs('t6hu-bet-purpose-q4', '+1.4BB');
  });

  it('t6hu-bet-purpose-q7：满池 f = 1/3 → 价值:诈唬 = 2:1', () => {
    expect(bluffShare(1)).toBeCloseTo(1 / 3, 10);
    expect((2 / 3) / (1 / 3)).toBe(2);
    expectAnswerIs('t6hu-bet-purpose-q7', '2:1');
  });
});

describe('t6hu 量化审计：几何、权益与实现率', () => {
  it('t6hu-barrel-q6：8 + 4 + 4 = 16BB（河牌下注前底池）', () => {
    const potAfterTurn = 8 + 4 + 4;
    expect(potAfterTurn).toBe(16);
    // 河牌再下 8BB 并被跟注才是终局 32BB
    expect(potAfterTurn + 8 + 8).toBe(32);
    expectAnswerIs('t6hu-barrel-q6', '16BB');
  });

  it('t6hu-barrel-q8：2/3 池 f ≈ 28.6%', () => {
    expect(pct(bluffShare(2 / 3))).toBe(28.6);
    expectAnswerIs('t6hu-barrel-q8', '28.6%');
  });

  it('t6hu-equity-realization-q2：9 outs 两街 = 35.0%（单街 19.1%）', () => {
    expect(pct(outsToEquity(9, 1))).toBe(19.1);
    expect(pct(outsToEquity(9, 2))).toBe(35.0);
    expectAnswerIs('t6hu-equity-realization-q2', '约 35.0%');
  });

  it('t6hu-equity-realization-q3：25.0 ÷ 0.85 ≈ 29.4%（0.80 → 31.3%）', () => {
    const threshold = requiredEquity(4, 16);
    expect(threshold).toBe(0.25);
    expect(pct(threshold / 0.85)).toBe(29.4);
    expect(pct(threshold / 0.8)).toBe(31.3);
    expectAnswerIs('t6hu-equity-realization-q3', '约 29.4%');
  });

  it('t6hu-equity-realization-q6：8 outs 两街 = 31.5%（单街 17.4%）', () => {
    expect(pct(outsToEquity(8, 2))).toBe(31.5);
    expect(pct(outsToEquity(8, 1))).toBe(17.0); // 翻牌单街 8÷47；17.4% 是转牌到河牌的 8÷46 口径
    expect(pct(outsToEquity(8, 2) - requiredEquity(4, 16))).toBe(6.5);
    expectAnswerIs('t6hu-equity-realization-q6', '约 31.5%');
  });
});

describe('t6hu 题库结构：题号连续、四选一、题 id 契约', () => {
  it('每章 8 题、四选一、id 前缀与题号一致', () => {
    expect(Object.keys(QUIZ_BANK)).toEqual([
      't6hu-sizing-optimal',
      't6hu-barrel',
      't6hu-bet-purpose',
      't6hu-equity-realization',
    ]);
    const problems: string[] = [];
    for (const [chapterId, questions] of Object.entries(QUIZ_BANK)) {
      if (questions.length !== 8) problems.push(`${chapterId}: 题数 ${questions.length}`);
      questions.forEach((question, index) => {
        if (question.id !== `${chapterId}-q${index + 1}`) problems.push(`${question.id}: 题号不连续`);
        if (question.options.length !== 4) problems.push(`${question.id}: 选项数 ${question.options.length}`);
        if (new Set(question.options).size !== question.options.length) problems.push(`${question.id}: 选项重复`);
        if (question.correctIndex < 0 || question.correctIndex > 3) {
          problems.push(`${question.id}: correctIndex 越界`);
        }
      });
    }
    expect(problems).toEqual([]);
  });
});
