import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './t2hu';
import { calculateAlpha, requiredEquity } from '../../../../../utils/theoryFormulas';
import type { TheoryQuizQuestion } from '../../../../../types';

/**
 * T2HU 单挑题库量化审计（本批扩容新增的 q5-q8）。
 *
 * 既有 q1-q4 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定新增题。口径单源：
 * - 跟注所需胜率 = 跟注额 ÷ 跟注后总底池（`requiredEquity`）
 * - 纯诈唬保本弃牌率 = b ÷ (P + b)（`calculateAlpha`）
 * - EV(call) = E×(P+B) − (1−E)×B；位置价值 = SPR = 剩余筹码 ÷ 底池
 *
 * ========================= 人工复核索引（0 起；分类见 PRD §6.7.1） =========================
 * [正确] t2hu-odds-q5：1÷(3+1+1)=20.0%（1/3 池的统一口径）
 * [正确] t2hu-odds-q6：底池 2.5+1=3.5、跟注 1.5 ⇒ 1.5÷5=30.0%（对照 3BB 开池 2÷6=33.3%）
 * [正确] t2hu-odds-q7：1÷(2+1+1)=25.0%（半池统一口径）
 * [定性] t2hu-odds-q8：价格侧与人数无关的机制陈述，不含新增数值
 * [正确] t2hu-ev-q5：f*=2÷(8+2)=20.0%
 * [正确] t2hu-ev-q6：EV=0.4×(6+3)−0.6×3=+1.8BB
 * [正确] t2hu-ev-q7：0.5×1.5−0.5×1.5=0（保本弃牌率 50%，与 T3HU SB 章同一 1.5/1.5 口径）
 * [定性] t2hu-ev-q8：EV 取最大的机制陈述，引用既有 0.53/0.29 模型值
 * [正确] t2hu-risk-q5：SPR=(100−3)÷6=16.2（底池 3+2+1=6）
 * [正确] t2hu-risk-q6：10f=12(1−f) ⇒ f=12÷22≈54.5%（check-fold 基准；36.4% 是 check-call 基准）
 * [示意值] t2hu-risk-q7：set mining 20 倍门槛为经验锚点（正文另有 15 倍满员桌旧口径），
 *          60BB=20×3BB 只是把该门槛算术化，门槛本身不推导
 * [定性] t2hu-risk-q8：高 SPR 控池的机制陈述，SPR 值取自 q5
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

describe('quantAudit T2HU：新增题结构与题号', () => {
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

describe('quantAudit T2HU：新增数值题逐题复算', () => {
  it('t2hu-odds：1/3 池 20%、2.5BB 开池 30%、半池 25%', () => {
    expect(pct(requiredEquity(1, 5))).toBe(20.0);
    expect(answerOf('t2hu-odds', 't2hu-odds-q5')).toBe('20%');

    expect(2.5 + 1).toBeCloseTo(3.5, 10);
    expect(pct(requiredEquity(1.5, 5))).toBe(30.0);
    expect(pct(requiredEquity(2, 6))).toBe(33.3);
    expect(answerOf('t2hu-odds', 't2hu-odds-q6')).toBe('30%');

    expect(pct(requiredEquity(1, 4))).toBe(25.0);
    expect(answerOf('t2hu-odds', 't2hu-odds-q7')).toBe('25%');
  });

  it('t2hu-ev：保本弃牌率 20%、EV(call)=+1.8、偷盲 EV=0', () => {
    expect(pct(calculateAlpha(8, 2))).toBe(20.0);
    expect(answerOf('t2hu-ev', 't2hu-ev-q5')).toBe('20%');

    const evCall = 0.4 * (6 + 3) - 0.6 * 3;
    expect(evCall).toBeCloseTo(1.8, 10);
    expect(answerOf('t2hu-ev', 't2hu-ev-q6')).toBe('+1.8BB');

    const stealEv = 0.5 * 1.5 - 0.5 * 1.5;
    expect(stealEv).toBe(0);
    expect(1.5 / (1.5 + 1.5)).toBe(0.5);
    expect(answerOf('t2hu-ev', 't2hu-ev-q7')).toBe('0BB');
  });

  it('t2hu-risk：SPR 16.2、check-raise 保本弃牌率 54.5%、set mining 60BB', () => {
    expect(Math.round(((100 - 3) / 6) * 10) / 10).toBe(16.2);
    expect(answerOf('t2hu-risk', 't2hu-risk-q5')).toBe('约 16.2');

    const breakEven = 12 / (10 + 12);
    expect(pct(breakEven)).toBe(54.5);
    expect(answerOf('t2hu-risk', 't2hu-risk-q6')).toBe('54.5%');

    expect(20 * 3).toBe(60);
    expect(answerOf('t2hu-risk', 't2hu-risk-q7')).toBe('60BB');
  });
});
