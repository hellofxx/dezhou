import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './t3hu';
import { calculateAlpha, calculateMDF, requiredEquity } from '../../../../../utils/theoryFormulas';
import type { TheoryQuizQuestion } from '../../../../../types';

/**
 * T3HU 单挑题库量化审计（本批扩容新增的 q5-q8）。
 *
 * 既有 q1-q4 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定新增题。口径单源：
 * - 跟注所需胜率 = 跟注额 ÷ 跟注后总底池（`requiredEquity`）
 * - 偷盲保本弃牌率 α = b ÷ (P + b)，MDF = 1 − α（`calculateAlpha` / `calculateMDF`）
 * - 街间位置价值沿 t3hu 正文的 0.05/0.10/0.20BB 模型
 *
 * ========================= 人工复核索引（0 起；分类见 PRD §6.7.1） =========================
 * [正确] t3hu-sb-strategy-q5：α(1.5,2)=2÷3.5≈57.1%（对照 min-raise 50%、3BB 62.5%）
 * [正确] t3hu-sb-strategy-q6：0.15×1.5≈0.23BB（被 3-bet 时损失额外投入的 1.5BB）
 * [正确] t3hu-sb-strategy-q7：底池 2+7=9、跟注 5 ⇒ 5÷14≈35.7%
 * [定性] t3hu-sb-strategy-q8：limp 叠范围保护的机制陈述，不含新增数值
 * [正确] t3hu-bb-defense-q5：3÷(5+3)=37.5%（开池 4BB、底池 4+1=5）
 * [正确] t3hu-bb-defense-q6：MDF=1−2÷3.5≈42.9%（死钱口径，与 SB 侧 57.1% 互补）
 * [正确] t3hu-bb-defense-q7：EV≈0.7×1.5+0.3×0.5=+1.20BB（被跟注项只计翻后优势）
 * [定性] t3hu-bb-defense-q8：防守三层结构的机制陈述，60%-70% 沿用正文既有量级
 * [正确] t3hu-position-reversal-q5：0.10÷0.35≈28.6%（河牌 57%、翻牌 14.3% 互补）
 * [正确] t3hu-position-reversal-q6：2.7÷(8+2.7+2.7)≈20.1%，与 1/3 池统一口径 20% 一致
 * [定性] t3hu-position-reversal-q7：随后过牌的机制陈述，不含新增数值
 * [定性] t3hu-position-reversal-q8：c-bet 频率的机制陈述，不含新增数值
 * ======================================================================================
 */
const BANK = QUIZ_BANK;
const NEW_IDS = ['q5', 'q6', 'q7', 'q8'];

const quizOf = (chapterId: string): TheoryQuizQuestion[] => {
  const quiz = BANK[chapterId];
  expect(quiz, `题库存在章节 ${chapterId}`).toBeDefined();
  return quiz as TheoryQuizQuestion[];
};

const answerOf = (chapterId: string, questionId: string): string => {
  const question = quizOf(chapterId).find((candidate) => candidate.id === questionId);
  expect(question, `小测题 ${questionId} 存在`).toBeDefined();
  const target = question as TheoryQuizQuestion;
  expect(target.options[target.correctIndex], `${questionId} 复算后的正确选项`).toBeDefined();
  return target.options[target.correctIndex] as string;
};

const pct = (x: number) => Math.round(x * 1000) / 10;

describe('quantAudit T3HU：新增题结构与题号', () => {
  it('每章 8 题、题号连续 q1-q8、四选一且 correctIndex 界内', () => {
    for (const [chapterId, quiz] of Object.entries(BANK)) {
      expect(quiz.length, `${chapterId} 题量`).toBe(8);
      const numbers = quiz.map((q) => Number(q.id.slice(chapterId.length + 2)));
      expect(numbers, `${chapterId} 题号`).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      for (const q of quiz) {
        expect(q.id.startsWith(`${chapterId}-q`), `${q.id} 前缀`).toBe(true);
        expect(q.options.length, `${q.id} 选项数`).toBe(4);
        expect(q.correctIndex >= 0 && q.correctIndex < 4, `${q.id} correctIndex`).toBe(true);
        expect(q.question.trim().length, `${q.id} 题干`).toBeGreaterThan(0);
        expect(q.explanation.trim().length, `${q.id} 解析`).toBeGreaterThan(0);
      }
      for (const suffix of NEW_IDS) {
        expect(
          quiz.some((q) => q.id === `${chapterId}-${suffix}`),
          `${chapterId}-${suffix} 存在`,
        ).toBe(true);
      }
    }
  });
});

describe('quantAudit T3HU：新增数值题逐题复算', () => {
  it('t3hu-sb-strategy：2.5BB 保本 57.1%、3-bet 侵蚀 0.23BB、3-bet 跟注 35.7%', () => {
    expect(pct(calculateAlpha(1.5, 2))).toBe(57.1);
    expect(pct(calculateAlpha(1.5, 1.5))).toBe(50.0);
    expect(pct(calculateAlpha(1.5, 2.5))).toBe(62.5);
    expect(answerOf('t3hu-sb-strategy', 't3hu-sb-strategy-q5')).toBe('57.1%');

    expect(0.15 * 1.5).toBeCloseTo(0.225, 6);
    expect(answerOf('t3hu-sb-strategy', 't3hu-sb-strategy-q6')).toBe('0.23BB');

    expect(2 + 7).toBe(9);
    expect(pct(requiredEquity(5, 14))).toBe(35.7);
    expect(answerOf('t3hu-sb-strategy', 't3hu-sb-strategy-q7')).toBe('35.7%');
  });

  it('t3hu-bb-defense：4BB 开池 37.5%、min-raise MDF 42.9%、isolate EV +1.20', () => {
    expect(4 + 1).toBe(5);
    expect(pct(requiredEquity(3, 8))).toBe(37.5);
    expect(answerOf('t3hu-bb-defense', 't3hu-bb-defense-q5')).toBe('37.5%');

    expect(pct(calculateMDF(1.5, 2))).toBe(42.9);
    expect(pct(calculateAlpha(1.5, 2) + calculateMDF(1.5, 2))).toBe(100.0);
    expect(answerOf('t3hu-bb-defense', 't3hu-bb-defense-q6')).toBe('42.9%');

    const ev = 0.7 * 1.5 + 0.3 * 0.5;
    expect(ev).toBeCloseTo(1.2, 10);
    expect(answerOf('t3hu-bb-defense', 't3hu-bb-defense-q7')).toBe('+1.20BB');
  });

  it('t3hu-position-reversal：转牌占比 28.6%、1/3 池 20%', () => {
    const total = 0.05 + 0.1 + 0.2;
    expect(total).toBeCloseTo(0.35, 10);
    expect(pct(0.1 / total)).toBe(28.6);
    expect(pct(0.2 / total)).toBe(57.1);
    expect(answerOf('t3hu-position-reversal', 't3hu-position-reversal-q5')).toBe('约 28.6%');

    expect(pct(requiredEquity(2.7, 8 + 2.7 + 2.7))).toBe(20.1);
    expect(answerOf('t3hu-position-reversal', 't3hu-position-reversal-q6')).toBe('20%');
  });
});
