/**
 * L3–L4 题库数值题复算审计（侧内守卫）。
 *
 * 复算口径与 standardQuantAudit.test.ts 同源（禁止凭印象写答案）：
 * - Alpha（进攻方纯诈唬保本弃牌率）= b / (P + b)
 * - 跟注所需胜率（跟注保本线）= b / (P + 2b)
 * - MDF（防守方最低继续频率）= P / (P + b)
 * - 河牌诈唬占比 = b / (P + 2b)（与跟注保本线同分母，用途不同）
 * - outs 双街命中率 = 1 - ((47 - o)/47) × ((46 - o)/46)；单街 = outs / 46
 * - EV 净赢额 = 新底池 - 自注（被跟注后收回，不计入赢利）
 *
 * 断言方式：取该题 correctIndex 指向的正确选项文本里的首个数值，与测试内**重新计算**的结果比较
 * （容差 0.6，覆盖「约 28.6%」这类四舍五入写法）。数据侧若被改动（选项文本、correctIndex、
 * 题面数值任一漂移）测试即红。
 */
import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../../../../types';
import { LEVEL_3_QUIZ_BANK } from './level3';
import { LEVEL_4_QUIZ_BANK } from './level4';

const ALL_QUESTIONS: QuizQuestion[] = [
  ...Object.values(LEVEL_3_QUIZ_BANK).flat(),
  ...Object.values(LEVEL_4_QUIZ_BANK).flat(),
];
const BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

/** 唯一正确项文本（判分以重排后的对象为准，此处只读数据层的 correctIndex） */
function answerText(id: string): string {
  const question = BY_ID.get(id);
  expect(question, `题 ${id} 存在于 L3/L4 题库`).toBeDefined();
  const text = (question as QuizQuestion).options[(question as QuizQuestion).correctIndex];
  expect(text, `题 ${id} 的 correctIndex 指向有效选项`).toBeDefined();
  return text as string;
}

/** 正确选项文本中的首个数值 */
function answerNumber(id: string): number {
  const match = answerText(id).match(/-?\d+(?:\.\d+)?/);
  expect(match, `题 ${id} 的正确选项应包含数值`).not.toBeNull();
  return Number((match as RegExpMatchArray)[0]);
}

function expectNumber(id: string, expected: number, tol = 0.6): void {
  const actual = answerNumber(id);
  expect(
    { id, actual, expected, ok: Math.abs(actual - expected) <= tol },
    `${id} 复算不一致：数据 ${actual} vs 复算 ${expected}`,
  ).toEqual({ id, actual, expected, ok: true });
}

const alpha = (pot: number, bet: number) => bet / (pot + bet);
const callEquity = (pot: number, bet: number) => bet / (pot + 2 * bet);
const mdf = (pot: number, bet: number) => pot / (pot + bet);
const bluffShare = (pot: number, bet: number) => bet / (pot + 2 * bet);
const twoStreet = (outs: number) => 1 - ((47 - outs) / 47) * ((46 - outs) / 46);

describe('L3 题库数值题复算', () => {
  it('C-Bet EV 与诈唬保本弃牌率（净赢额不含自注）', () => {
    // 底池 6、C-Bet 3、弃牌率 0.5、被跟注胜率 0.25：0.5×6 + 0.5×(0.25×9 - 0.75×3)
    expectNumber('l3-cbet-q6', 0.5 * 6 + 0.5 * (0.25 * 9 - 0.75 * 3));
    expectNumber('l3-cbet-q10', alpha(1, 0.5) * 100);
  });

  it('outs 命中率（双街精确值 / 单街 / 15 outs 组合听牌）', () => {
    expectNumber('l3-draw-q6', twoStreet(9) * 100);
    expectNumber('l3-draw-q7', (9 / 46) * 100);
    // 该题正确项同时给出胜率与保本线（31.5% 高于 25%），两者都要复算
    expect(answerText('l3-draw-q8')).toContain('31.5%');
    expect(answerText('l3-draw-q8')).toContain(`${callEquity(10, 5) * 100}%`);
    expect(twoStreet(8) * 100).toBeCloseTo(31.5, 1);
    expectNumber('l3-draw-q10', twoStreet(15) * 100);
    expect(answerNumber('l3-draw-q9')).toBe(13); // 修正公式阈值（outs ≥ 13）
  });

  it('SPR / 加注后底池 / 尺度换算', () => {
    expectNumber('l3-multi-q6', 100 / 6);
    expectNumber('l3-cr-q10', 5.5 + 4 + 12 + 8);
    expectNumber('l3-bs-q10', 20 * (2 / 3));
    expectNumber('l3-3bet-pf-q6', 80 / 18.5);
    expectNumber('l3-3bet-pf-q10', 60 / 20);
  });

  it('MDF 与 Alpha（尺度越大概率越低 / 保本线越高）', () => {
    expectNumber('l3-bs-q6', mdf(1, 1 / 3) * 100);
    expectNumber('l3-bs-q7', alpha(1, 0.75) * 100);
    expectNumber('l3-bs-q8', mdf(1, 0.5) * 100);
    expectNumber('l3-bluff-q7', alpha(1, 1) * 100);
    expectNumber('l3-bluff-q6', 0.5 * 10 - 0.5 * 10);
  });
});

describe('L4 题库数值题复算', () => {
  it('范围权益加权与组合数', () => {
    expectNumber('l4-range-q6', 0.5 * 93 + 0.5 * 70);
    expectNumber('l4-range-q9', 4 * 4);
    expectNumber('l4-blockers-q4', 3 * 4);
    expectNumber('l4-blockers-q5', 3 * 3);
    expectNumber('l4-blockers-q6', 6); // K 不阻断 AA
    expectNumber('l4-blockers-q8', 3 + 3 + 9);
  });

  it('跟注 EV / 保本胜率 / 死钱口径', () => {
    expectNumber('l4-ev-q6', 0.4 * 150 - 0.6 * 50);
    expectNumber('l4-ev-q7', callEquity(80, 40) * 100);
    expectNumber('l4-opp-q10', callEquity(100, 100) * 100);
    expectNumber('l4-bc-q10', callEquity(1, 1) * 100);
    expectNumber('l4-bc-q4', callEquity(1, 2 / 3) * 100);
  });

  it('实战牌例 EV（含弃牌权益 + 被跟注分支）', () => {
    expectNumber('l4-ev-rc-q3', 5);
    expectNumber('l4-ev-rc-q4', 0.45 * 10 + 0.55 * (0.54 * 16 - 0.46 * 6));
    expectNumber('l4-ev-rc-q5', 10 + 6 + 6 - 6);
    expectNumber('l4-ev-rc-q10', 0.45 * 10);
    expectNumber('l4-mdf-rc-q4', 0.65 * 9 - 0.35 * 3);
  });

  it('博弈树节点 EV（概率加权）', () => {
    expectNumber('l4-gt-q6', 0.4 * 6 + 0.6 * 3);
    expectNumber('l4-gt-q9', 0.3 * 8 + 0.5 * 4 + 0.2 * -2);
  });

  it('MDF / Alpha / 诈唬占比三口径不混用', () => {
    expectNumber('l4-gto-q6', bluffShare(1, 0.5) * 100);
    expectNumber('l4-freq-q6', bluffShare(1, 2 / 3) * 100);
    expectNumber('l4-freq-q7', bluffShare(1, 1 / 3) * 100);
    expectNumber('l4-mdf-q6', mdf(1, 0.75) * 100);
    expectNumber('l4-mdf-q7', mdf(1, 1.5) * 100);
    expectNumber('l4-mdf-q8', mdf(1, 2) * 100);
    expectNumber('l4-mdf-rc-q3', alpha(1, 0.5) * 100);
    expectNumber('l4-mdf-rc-q5', mdf(50, 40) * 100);
    expectNumber('l4-mdf-rc-q10', callEquity(50, 40) * 100);
    expectNumber('l4-overbet-q6', callEquity(10, 15) * 100);

    // 1/2 池：诈唬占比 25% ⇒ value:bluff = 3:1
    expectNumber('l4-freq-q10', (1 - bluffShare(1, 0.5)) / bluffShare(1, 0.5));
    // 150% 池：诈唬占比 37.5% ⇒ value:bluff 精确 5:3
    expect(bluffShare(1, 1.5) * 100).toBeCloseTo(37.5, 5);
    expect(answerText('l4-overbet-q7')).toBe('5:3');
  });

  it('非数值决策题的正确项文本锁定', () => {
    expect(answerText('l4-ev-rc-q8')).toBe('下注');
    expect(answerText('l3-check-range-q10')).toBe('过牌');
  });
});
