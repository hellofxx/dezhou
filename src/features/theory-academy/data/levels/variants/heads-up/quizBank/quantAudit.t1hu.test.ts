import { describe, expect, it } from 'vitest';
import { QUIZ_BANK } from './t1hu';
import { outsToEquity } from '../../../../../utils/theoryFormulas';
import type { TheoryQuizQuestion } from '../../../../../types';

/**
 * T1HU 单挑题库量化审计（本批扩容新增的 q5-q8）。
 *
 * 既有 q1-q4 的复算索引在 `variants/variantQuantAudit.test.ts` 的 heads-up 段落；
 * 本文件只锁定新增题：题面数字、correctIndex 与正确选项文本三者任一漂移即变红。
 * 口径单源：组合计数 C(n,k)、outs 精确概率走 `utils/theoryFormulas.outsToEquity`
 * （52 张主线默认 [47, 46]）、伯努利标准差 σ=√(p(1−p))×筹码、√N 累计。
 *
 * ========================= 人工复核索引（0 起；分类见 PRD §6.7.1） =========================
 * [正确] t1hu-probability-q5：C(44,2)=946、C(50,2)=1225 ⇒ 1−946÷1225≈22.8%
 *        （你持 A♠K♦ 后剩余 50 张仅 3 张 A + 3 张 K，44 张非 A 非 K）
 * [正确] t1hu-probability-q6：13×C(4,2)=78、78÷1326≈5.9%（52 张牌堆每牌级 6 种对子组合）
 * [正确] t1hu-probability-q7：1−C(48,3)/C(50,3)=1−17296÷19600≈11.8%（余 2 张 A）
 * [定性] t1hu-probability-q8：范围密度 vs 出现频率的机制陈述，不含可复算数值
 * [正确] t1hu-outs-q5：1÷45≈2.2%（已知对手两张底牌 ⇒ 未知牌 45 张）
 * [正确] t1hu-outs-q6：outsToEquity(9,2)=1−(38/47)(37/46)≈35.0%
 * [正确] t1hu-outs-q7：outsToEquity(8,2)=1−(39/47)(38/46)≈31.5%
 * [定性] t1hu-outs-q8：折扣从 7-8 折放宽到约 9 折的机制说明，9 折本身是经验量级
 * [正确] t1hu-variance-q5：100×(0.6−0.4)×100=2000 筹码
 * [正确] t1hu-variance-q6：49×√100=490（49=√(0.6×0.4)×100 的单手 σ）
 * [正确] t1hu-variance-q7：0.45⁶≈0.83%（对照 0.45⁵≈1.8%、0.45⁸≈0.17% 已在正文登记）
 * [定性] t1hu-variance-q8：连败窗口的解读，依赖 0.45⁸ 的既有量级，不引入新数值
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

describe('quantAudit T1HU：新增题结构与题号', () => {
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

describe('quantAudit T1HU：新增数值题逐题复算', () => {
  it('t1hu-probability：A/K 并集 22.8%、口袋对密度 5.9%、翻牌见 A 11.8%', () => {
    const atLeastOneOfSix = 1 - (44 * 43) / 2 / ((50 * 49) / 2);
    expect(pct(atLeastOneOfSix)).toBe(22.8);
    expect(answerOf('t1hu-probability', 't1hu-probability-q5')).toBe('约 22.8%');

    const pairs = (13 * (4 * 3)) / 2;
    expect(pairs).toBe(78);
    expect(pct(pairs / 1326)).toBe(5.9);
    expect(answerOf('t1hu-probability', 't1hu-probability-q6')).toBe('约 5.9%');

    const flopAce = 1 - 17296 / 19600;
    expect(pct(flopAce)).toBe(11.8);
    expect(answerOf('t1hu-probability', 't1hu-probability-q7')).toBe('约 11.8%');
  });

  it('t1hu-outs：单张 out 2.2%、9 outs 双街 35.0%、8 outs 双街 31.5%', () => {
    expect(pct(1 / 45)).toBe(2.2);
    expect(answerOf('t1hu-outs', 't1hu-outs-q5')).toBe('约 2.2%');

    expect(pct(outsToEquity(9, 2))).toBe(35.0);
    expect(answerOf('t1hu-outs', 't1hu-outs-q6')).toBe('约 35%');

    expect(pct(outsToEquity(8, 2))).toBe(31.5);
    expect(answerOf('t1hu-outs', 't1hu-outs-q7')).toBe('约 31.5%');
  });

  it('t1hu-variance：期望 2000、累计 σ=490、0.45⁶≈0.83%', () => {
    expect(Math.round(100 * (0.6 - 0.4) * 100)).toBe(2000);
    expect(answerOf('t1hu-variance', 't1hu-variance-q5')).toBe('2000 筹码');

    const sigma = Math.sqrt(0.6 * 0.4) * 100;
    expect(Math.round(sigma)).toBe(49);
    expect(Math.round(sigma * Math.sqrt(100))).toBe(490);
    expect(answerOf('t1hu-variance', 't1hu-variance-q6')).toBe('约 490');

    expect(Math.round(0.45 ** 6 * 10000) / 100).toBeCloseTo(0.83, 2);
    expect(answerOf('t1hu-variance', 't1hu-variance-q7')).toBe('约 0.83%');
  });
});
