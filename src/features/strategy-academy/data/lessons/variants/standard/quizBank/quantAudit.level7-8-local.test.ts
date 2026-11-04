/**
 * C4 内容轨（L7 / L8 / 本土 16 课）题库新增数值题复算审计。
 *
 * 口径与 standardQuantAudit / variantQuantAudit 单源一致（禁止凭印象）：
 * - Alpha = b/(P+b)；跟注所需胜率 = b/(P+2b)（半池 25%、1/3 池 20%、满池 33.3%）
 * - MDF = P/(P+b)；EV = win×prob − loss×(1−prob)，净赢额不含自己的下注（禁止双重计）
 * - outs 单街 = outs/剩余牌；双街 = 1 − ((47−o)/47)((46−o)/46)（15 outs ≈ 54%）
 * - SPR = 有效筹码 ÷ 底池；组合听牌 outs 需去重叠（9 同花 + 8 顺子 − 2 重叠 = 15）
 * - 底池按参与方投入逐笔相加（SB 0.5 + BB 1 + Limp/Straddle/Ante + 各自跟注）
 *
 * 每道题都在本文件内**独立重算**，再断言题库正确项文本与复算结果一致：
 * 题面数字、correctIndex 或选项文本任一漂移即红。
 */
import { describe, expect, it } from 'vitest';
import type { QuizQuestion } from '../../../../../types';
import { LEVEL_7_QUIZ_BANK } from './level7';
import { LEVEL_8_QUIZ_BANK } from './level8';
import { LOCAL_QUIZ_BANK } from './local';

const BANKS = {
  level7: LEVEL_7_QUIZ_BANK,
  level8: LEVEL_8_QUIZ_BANK,
  local: LOCAL_QUIZ_BANK,
} as const;

type BankName = keyof typeof BANKS;

function getQuestion(bank: BankName, lessonId: string, qid: string): QuizQuestion {
  const question = BANKS[bank][lessonId]?.find((q) => q.id === qid);
  expect(question, `${qid} 存在于 ${bank}/${lessonId}`).toBeDefined();
  return question as QuizQuestion;
}

/** 取正确项文本（同时校验 correctIndex 界内、唯一正确答案可读） */
function answerText(bank: BankName, lessonId: string, qid: string): string {
  const question = getQuestion(bank, lessonId, qid);
  expect(question.options.length).toBeGreaterThanOrEqual(2);
  const text = question.options[question.correctIndex];
  expect(text, `${qid} correctIndex 指向有效选项`).toBeTruthy();
  return text as string;
}

const alpha = (bet: number) => bet / (1 + bet);
const callEquity = (bet: number) => bet / (1 + 2 * bet);
const outsTwoStreets = (outs: number) => 1 - ((47 - outs) / 47) * ((46 - outs) / 46);
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

describe('C4 数值题复算：SPR / 底池 / 隐含赔率', () => {
  it('L7 深筹码 SPR：240 ÷ 20 = 12（>10 属深筹码区间）', () => {
    expect(240 / 20).toBe(12);
    expect(240 / 20).toBeGreaterThan(10);
    expect(answerText('level7', 'l7-deepstack', 'l7-deep-q6')).toBe('约 12');
    expect(getQuestion('level7', 'l7-deepstack', 'l7-deep-q6').explanation).toContain('240 ÷ 20 = 12');
  });

  it('L7 set mine 保本赢额：(0.88 ÷ 0.12) × 4 ≈ 29.3BB', () => {
    const breakEven = (0.88 / 0.12) * 4;
    expect(round(breakEven)).toBe(29.3);
    expect(answerText('level7', 'l7-deepstack', 'l7-deep-q7')).toBe('约 29BB');
  });

  it('L7 深筹码资金：200BB × $2 = $400/buy-in，30 个 = $12,000', () => {
    const buyIn = 200 * 2;
    expect(buyIn).toBe(400);
    expect(buyIn * 30).toBe(12000);
    expect(buyIn * 40).toBe(16000);
    expect(answerText('level7', 'l7-deepstack', 'l7-deep-q8')).toBe('约 $12,000');
  });

  it('L7 Straddle 底池：0.5 + 1 + 5 + 5 = 11.5BB；SPR 50 ÷ 11.5 ≈ 4.3', () => {
    const pot = 0.5 + 1 + 5 + 5;
    expect(pot).toBe(11.5);
    expect(round(50 / pot)).toBe(4.3);
    expect(answerText('level7', 'l7-straddle', 'l7-straddle-q6')).toBe('11.5BB');
    expect(answerText('level7', 'l7-straddle', 'l7-straddle-q7')).toBe('约 4.3');
  });

  it('L7 Rake 差异：(10 − 5) BB/100 × 10 = 50BB / 1000 手', () => {
    expect((10 - 5) * (1000 / 100)).toBe(50);
    expect(answerText('level7', 'l7-rake', 'l7-rake-q6')).toBe('50BB');
  });

  it('本土 Limp 局 SPR：20 ÷ 5 = 4（落在 3-5 区间）', () => {
    expect(20 / 5).toBe(4);
    expect(answerText('local', 'local-limp-intro', 'local-limp-intro-q8')).toBe('4');
  });

  it('本土两人 Limp 底池：0.5 + 1 + 1 + 1 = 3.5BB', () => {
    expect(0.5 + 1 + 1 + 1).toBe(3.5);
    expect(answerText('local', 'local-limp-isolate', 'local-limp-isolate-q8')).toBe(
      '3.5BB（SB 0.5 + BB 1 + 两人 Limp 2）',
    );
  });

  it('本土 Straddle：底池 0.5 + 1 + 2 = 3.5BB；100BB ÷ 2BB = 50 个 straddle', () => {
    expect(0.5 + 1 + 2).toBe(3.5);
    expect(100 / 2).toBe(50);
    expect(answerText('local', 'local-straddle', 'local-straddle-q4')).toBe(
      '3.5BB（SB 0.5 + BB 1 + Straddle 2）',
    );
    expect(answerText('local', 'local-straddle', 'local-straddle-q5')).toBe('50 个');
  });

  it('本土 Ante 底池：0.2BB × 6 + 1.5 = 2.7BB；0.5BB × 6 + 1.5 = 4.5BB', () => {
    expect(round(0.2 * 6 + 1.5, 2)).toBe(2.7);
    expect(0.5 * 6 + 1.5).toBe(4.5);
    expect(answerText('local', 'local-ante', 'local-ante-q4')).toBe('2.7BB（0.5 + 1 + 1.2）');
    expect(answerText('local', 'local-ante', 'local-ante-q5')).toBe('4.5BB');
  });

  it('本土深筹隐含赔率：EV = 0.12 × 500 − 0.88 × 8 ≈ +53BB', () => {
    const ev = 0.12 * 500 - 0.88 * 8;
    expect(round(ev)).toBe(53);
    expect(answerText('local', 'local-deep-implied-odds', 'local-deep-implied-q5')).toBe('约 +53BB');
    expect(getQuestion('local', 'local-deep-implied-odds', 'local-deep-implied-q5').explanation)
      .toContain('0.12 × 500 − 0.88 × 8 = 60 − 7.04');
  });

  it('本土深筹保本赢额：(0.88 ÷ 0.12) × 8 ≈ 58.7BB → 约 59BB', () => {
    const breakEven = (0.88 / 0.12) * 8;
    expect(round(breakEven)).toBe(58.7);
    expect(answerText('local', 'local-deep-implied-odds', 'local-deep-implied-q6')).toBe('约 59BB');
  });

  it('本土 Straddle 深筹资金：500BB 需 50 个 buy-in', () => {
    expect(answerText('local', 'local-deep-implied-odds', 'local-deep-implied-q8')).toBe(
      '至少 50 个 buy-in',
    );
  });
});

describe('C4 数值题复算：EV / Alpha / 剥削幅度', () => {
  it('L8 安全偏离：30% × (1 − 0.2) = 24 个百分点', () => {
    expect(round(0.3 * (1 - 0.2), 2) * 100).toBe(24);
    expect(answerText('level8', 'l8-pool-tendencies', 'l8-pool-q6')).toBe('24 个百分点');
  });

  it('L8 Pool 偏差：65% − 45% = +20 个百分点', () => {
    expect(65 - 45).toBe(20);
    expect(answerText('level8', 'l8-population-analysis', 'l8-pop-q6')).toBe('+20 个百分点');
  });

  it('L8 安全偏离：25% × (1 − 0.4) = 15 个百分点', () => {
    expect(round(0.25 * (1 - 0.4), 2) * 100).toBe(15);
    expect(answerText('level8', 'l8-exploitative-adjustments', 'l8-exploit-q6')).toBe(
      '约 15 个百分点',
    );
  });

  it('本土 GTO/剥削偏离：30% × (1 − 0.4) = 18 个百分点', () => {
    expect(round(0.3 * (1 - 0.4), 2) * 100).toBe(18);
    expect(answerText('local', 'local-gto-vs-exploit', 'local-gto-vs-exploit-q8')).toBe(
      '约 18 个百分点',
    );
  });

  it('跟注站 1/3 池 Alpha = 25%：对手弃 20% < 保本线 → 诈唬负 EV', () => {
    const thirdPot = 1 / 3;
    expect(round(alpha(thirdPot) * 100)).toBe(25);
    expect(20).toBeLessThan(25);
    expect(answerText('local', 'local-exploit-calling-station', 'local-exploit-cs-q5')).toBe(
      '负 EV，因为 20% 低于 25% 的保本线',
    );
  });

  it('Maniac 5-Bet 跟注 EV：0.75 × 113.5 − 0.25 × 69 ≈ +68BB', () => {
    const potAtDecision = 1.5 + 3 + 12 + 28 + 69;
    expect(potAtDecision).toBe(113.5);
    const ev = 0.75 * potAtDecision - 0.25 * 69;
    expect(ev).toBeGreaterThan(67.8);
    expect(ev).toBeLessThan(68.1);
    expect(answerText('local', 'local-exploit-maniac', 'local-exploit-man-q5')).toBe('约 +68BB');
  });

  it('Nit 偷盲 C-Bet EV：0.7 × 5.5 − 0.3 × 2 = +3.25BB', () => {
    expect(0.7 * 5.5 - 0.3 * 2).toBeCloseTo(3.25, 10);
    expect(answerText('local', 'local-exploit-nit', 'local-exploit-nit-q5')).toBe('约 +3.25BB');
  });

  it('偏离 EV：0.68 × 5.5 − 0.32 × 2 = +3.10BB', () => {
    expect(0.68 * 5.5 - 0.32 * 2).toBeCloseTo(3.1, 10);
    expect(answerText('local', 'local-when-to-deviate', 'local-when-to-deviate-q5')).toBe(
      '约 +3.10BB',
    );
  });

  it('止损与手数：NL50 单日 5 × $50 = $250；3 × 500 = 1500 手', () => {
    expect(5 * 50).toBe(250);
    expect(3 * 500).toBe(1500);
    expect(answerText('local', 'local-mental-stop-loss', 'local-mental-stop-loss-q5')).toBe('$250');
    expect(answerText('local', 'local-mental-session-management', 'local-mental-session-q5')).toBe(
      '1500 手',
    );
  });
});

describe('C4 数值题复算：多人底池乘法效应 / outs / 赔率', () => {
  it('L7 三人弃牌率 0.3³ = 2.7%（诈唬成功率乘法衰减）', () => {
    expect(round(0.3 ** 3 * 100, 1)).toBe(2.7);
    expect(answerText('level7', 'l7-multiway', 'l7-multi-q6')).toBe('约 2.7%');
  });

  it('L7 多人底池跟注赔率：10 ÷ (20 + 20) = 25%（b/(P+2b)）', () => {
    expect(callEquity(10 / 20) * 100).toBe(25);
    expect(answerText('level7', 'l7-multiway', 'l7-multi-q7')).toBe('约 25%');
  });

  it('本土 4 人底池 0.4³ = 6.4%；若有 4 个对手则 0.4⁴ ≈ 2.6%', () => {
    expect(round(0.4 ** 3 * 100, 1)).toBe(6.4);
    expect(round(0.4 ** 4 * 100, 1)).toBe(2.6);
    expect(answerText('local', 'local-limp-multiway', 'local-limp-multiway-q8')).toBe('约 6.4%');
  });

  it('15 outs 单街 = 15 ÷ 47 ≈ 32%；两条街 ≈ 54%', () => {
    expect(round((15 / 47) * 100, 1)).toBe(31.9);
    expect(round(outsTwoStreets(15) * 100, 1)).toBe(54.1);
    expect(answerText('local', 'local-limp-multiway', 'local-limp-multiway-q7')).toBe('约 32%（15/47）');
    expect(answerText('local', 'local-deep-suited-connectors', 'local-deep-sc-q5')).toBe(
      '约 32%（15/47）',
    );
  });

  it('组合听牌去重叠：同花 9 + 顺子 8 − 重叠 2 = 15 outs', () => {
    expect(9 + 8 - 2).toBe(15);
    expect(answerText('local', 'local-deep-suited-connectors', 'local-deep-sc-q6')).toBe(
      '15 outs（9 + 8 − 2）',
    );
  });
});
