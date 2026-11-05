/**
 * 单挑 T7 内容轨量化断言审计（本次扩容新增题中的数值题）。
 *
 * 口径与 standardQuantAudit / variantQuantAudit 同源：
 * - VPIP = 主动投钱入池 ÷ 总手数（`vpipPercent`）、AF =（下注 + 加注）÷ 跟注（`aggressionFactor`）
 * - 弃牌率保本线 α = B/(P+B)（`calculateAlpha`）
 * - 偷盲期望 EV = f × 1.5 − (1 − f) × 1.5（0.5 死钱已沉没、加注到 2BB 口径）
 * - 二项标准误 SE = √(p(1−p)/n)、95% 半宽 = 1.96 SE、反解样本量
 * - 挡牌组合数 C(n,2)、诈唬占比 f = b/(1+2b)
 * 本文件直接读 `quizBank/t7hu.ts`（不依赖聚合层），题库数字、correctIndex 或选项文本
 * 任一漂移即变红。
 *
 * 人工复核索引（正文散文数值，下标 0 起、含 heading 段）
 * [正确] t7hu-patterns idx10（对手类型表）：high/low/mid 为序数标签，无算术语义 → [定性]；
 *        该表的调整方向与既有 idx5/idx7 的指标组合结论一致
 * [正确] t7hu-exploit idx11（偷盲期望表）：EV = 3f − 1.5 → f=30% −0.60、40% −0.30、
 *        50% 0.00、60% +0.30、70% +0.60（与既有 t7hu-exploit idx2/q2 的 1.5/1.5 口径单源）
 * [正确] t7hu-stats idx2：VPIP 35÷150=23.3%、PFR 28÷150=18.7%、AF (60+30)÷30=3.0
 * [正确] t7hu-stats idx3：显示值差 23.3−18.7=4.6 个百分点（精确 4.67，正文按一位小数读数相减）
 * [正确] t7hu-stats idx6：p=0.45 → n=100 SE=4.97（约 5.0）、半宽 9.75（约 ±9.8）；
 *        n=300 SE=2.87（约 2.9）、半宽 5.63（约 ±5.6）；反解 n=1.96²×0.45×0.55÷0.025²≈1521
 * [正确] t7hu-stats idx7：72÷120=60.0%；半池 α=4÷12≈33.3%，差 26.7 个百分点；
 *        p=0.6、n=120 → SE 4.47、半宽 ±8.8、置信下限约 51%
 * [示意值] t7hu-stats idx5/index10：FCB 40%–55%、WWSF 45%–55% 等基线区间与「几十手／跨百手」
 *          均为经验量级，正文已标注，不得当精确值引用
 * [正确] t7hu-hand-reading idx2：C(4,2)=6、C(3,2)=3、C(2,2)=1；1+3×4=13 条三条组合
 * [正确] t7hu-hand-reading idx3：f(1.5)=1.5÷4=37.5%、价值:诈唬=5:3、20×0.6=12 个诈唬
 * [正确] t7hu-hand-reading idx4：25÷60≈41.7% > 37.5%（比例结论由给定组合数现算）
 * [正确] t7hu-hand-reading idx7：37.5% 均衡诈唬占比复用同一式子，未引入新数值
 * [假设] t7hu-hand-reading idx4/index10：600/420/200/60（价值 35、诈唬 25）的组合数是
 *        教学结构设定，数字随范围结构变化；约束是与 1.5 倍池的均衡占比 37.5% 的比较关系
 * [定性] t7hu-hand-reading idx1/idx5/idx6/idx8：读牌四步与叙事优先级为机制陈述，不含可算量
 */
import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './t7hu';
import type { TheoryQuizQuestion } from '../../../../../types';
import {
  aggressionFactor,
  calculateAlpha,
  vpipPercent,
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
/** `vpipPercent` 返回的已经是百分点（×100 之后），只需收到十分位 */
const pct1 = (x: number) => Math.round(x * 10) / 10;
/** 诈唬占比 f = b/(1+2b) */
const bluffShare = (b: number) => b / (1 + 2 * b);
/** 偷盲期望（0.5 死钱已沉没、加注到 2BB 的 1.5 对 1.5 口径） */
const stealEv = (foldRate: number) => foldRate * 1.5 - (1 - foldRate) * 1.5;

describe('t7hu 量化审计：指标定义与样本噪声', () => {
  it('t7hu-stats-q2：VPIP 35÷150 ≈ 23.3%（PFR 28÷150 ≈ 18.7%）', () => {
    const vpip = vpipPercent(35, 150);
    const pfr = vpipPercent(28, 150);
    expect(pct1(vpip)).toBe(23.3);
    expect(pct1(pfr)).toBe(18.7);
    // PFR 是 VPIP 的子集：正文按显示值相减得 4.6（精确 4.67）
    expect(pct1(pct1(vpip) - pct1(pfr))).toBe(4.6);
    expect(pct1(vpip - pfr)).toBe(4.7);
    expectAnswerIs('t7hu-stats-q2', '23.3%');
  });

  it('t7hu-stats-q3：AF = (60 + 30) ÷ 30 = 3.0', () => {
    expect(aggressionFactor(60, 30, 30)).toBe(3);
    expectAnswerIs('t7hu-stats-q3', '3.0');
  });

  it('t7hu-stats-q5：p=0.45、n=100 → 半宽 ≈ ±9.8 个百分点', () => {
    const se = Math.sqrt((0.45 * 0.55) / 100);
    expect(pct(se)).toBe(5.0);
    expect(pct(1.96 * se)).toBe(9.8);
    const se300 = Math.sqrt((0.45 * 0.55) / 300);
    expect(pct(se300)).toBe(2.9);
    expect(pct(1.96 * se300)).toBe(5.6);
    expectAnswerIs('t7hu-stats-q5', '±9.8 个百分点');
  });

  it('t7hu-stats-q6：反解样本量 n ≈ 1521 手', () => {
    const n = (1.96 ** 2 * 0.45 * 0.55) / 0.025 ** 2;
    expect(Math.round(n)).toBe(1521);
    expectAnswerIs('t7hu-stats-q6', '约 1521 手');
  });

  it('t7hu-patterns-q6：FCB 72÷120 = 60.0%，半池门槛 33.3%', () => {
    expect(pct1(vpipPercent(72, 120))).toBe(60.0);
    expect(pct(calculateAlpha(8, 4))).toBe(33.3);
    expect(pct1(vpipPercent(72, 120) - calculateAlpha(8, 4) * 100)).toBe(26.7);
    expectAnswerIs('t7hu-patterns-q6', '60.0%，高于 33.3% 的门槛，可提高下注频率');
  });
});

describe('t7hu 量化审计：剥削期望与读牌组合数学', () => {
  it('t7hu-exploit-q6：偷盲 EV 于 f=0.45 为 −0.15BB（保本 50%）', () => {
    expect(stealEv(0.45)).toBeCloseTo(-0.15, 10);
    expect(stealEv(0.5)).toBeCloseTo(0, 10);
    expectAnswerIs('t7hu-exploit-q6', '−0.15BB');
  });

  it('t7hu-exploit-q8：偷盲 EV 于 f=0.70 为 +0.60BB', () => {
    expect(stealEv(0.7)).toBeCloseTo(0.6, 10);
    expectAnswerIs('t7hu-exploit-q8', '+0.60BB');
  });

  it('t7hu-hand-reading-q2/q3：C(2,2)=1、C(3,2)=3（无阻挡为 6）', () => {
    const combos = (n: number) => (n * (n - 1)) / 2;
    expect(combos(4)).toBe(6);
    expect(combos(3)).toBe(3);
    expect(combos(2)).toBe(1);
    // 三条组合合计：KK 只剩 1，99/44/77/22 各 3
    expect(1 + 3 * 4).toBe(13);
    expectAnswerIs('t7hu-hand-reading-q2', '1 种');
    expectAnswerIs('t7hu-hand-reading-q3', '3 种');
  });

  it('t7hu-hand-reading-q4/q5：f(1.5)=37.5%，20 个价值 → 12 个诈唬', () => {
    expect(bluffShare(1.5)).toBe(0.375);
    expect(pct(bluffShare(1.5))).toBe(37.5);
    expect(20 * (0.375 / 0.625)).toBeCloseTo(12, 10);
    expectAnswerIs('t7hu-hand-reading-q4', '37.5%');
    expectAnswerIs('t7hu-hand-reading-q5', '约 12 个');
  });

  it('组合账自洽：25÷60 ≈ 41.7% 高于 1.5 倍池均衡 37.5%', () => {
    expect(pct(25 / 60)).toBe(41.7);
    expect(25 / 60 > bluffShare(1.5)).toBe(true);
    expect(35 + 25).toBe(60);
  });
});

describe('t7hu 题库结构：题号连续、四选一、题 id 契约', () => {
  it('每章 8 题、四选一、id 前缀与题号一致', () => {
    expect(Object.keys(QUIZ_BANK)).toEqual([
      't7hu-patterns',
      't7hu-exploit',
      't7hu-stats',
      't7hu-hand-reading',
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
