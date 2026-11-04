/**
 * 理论章末小测选项排序测试：
 * ① correctIndex 重映射正确性 ② 确定性 ③ 集合不变且不改源对象 ④ 真实题库分布守卫。
 * 分布守卫覆盖全部三变体（standard / short-deck / heads-up）题库。
 */
import { describe, it, expect } from 'vitest';
import { orderTheoryQuizQuestion } from './quizOrder';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import { THEORY_LEVELS } from '../data/levels';
import type { TheoryQuizQuestion } from '../types';

const ALL_QUIZ: TheoryQuizQuestion[] = ALL_VARIANT_THEORY_LEVELS.flatMap((level) =>
  level.chapters.flatMap((c) => c.quiz)
);

/** 标准变体题库（内容扩容与 correctIndex 平衡的责任范围；变体题库另行维护） */
const STANDARD_QUIZ: TheoryQuizQuestion[] = THEORY_LEVELS.flatMap((level) =>
  level.chapters.flatMap((c) => c.quiz)
);

describe('orderTheoryQuizQuestion', () => {
  it('① 重排后正确答案文本不变（correctIndex 重映射正确）', () => {
    expect(ALL_QUIZ.length).toBeGreaterThan(0);
    for (const q of ALL_QUIZ) {
      const ordered = orderTheoryQuizQuestion(q);
      expect(ordered.options[ordered.correctIndex]).toBe(q.options[q.correctIndex]);
    }
  });

  it('② id 稳定种子确定性：同题两次调用结果一致', () => {
    for (const q of ALL_QUIZ.slice(0, 30)) {
      expect(orderTheoryQuizQuestion(q)).toEqual(orderTheoryQuizQuestion(q));
    }
  });

  it('③ 选项集合不变（仅顺序改变），且不修改原对象', () => {
    for (const q of ALL_QUIZ) {
      const optionsBefore = [...q.options];
      const correctBefore = q.correctIndex;
      const ordered = orderTheoryQuizQuestion(q);
      expect([...ordered.options].sort()).toEqual([...q.options].sort());
      expect(q.options).toEqual(optionsBefore);
      expect(q.correctIndex).toBe(correctBefore);
    }
  });

  it('④ 分布守卫：全题库处理后正确答案索引分布任一 <50%', () => {
    const distribution: Record<number, number> = {};
    for (const q of ALL_QUIZ) {
      const ordered = orderTheoryQuizQuestion(q);
      distribution[ordered.correctIndex] = (distribution[ordered.correctIndex] ?? 0) + 1;
    }
    const total = ALL_QUIZ.length;
    const readable = Object.entries(distribution)
      .map(([idx, count]) => {
        const letter = String.fromCharCode(65 + Number(idx));
        return `${letter}: ${count} (${((count / total) * 100).toFixed(1)}%)`;
      })
      .join(', ');
    console.log(`[theory quizOrder 分布守卫] 共 ${total} 题 → ${readable}`);
    for (const count of Object.values(distribution)) {
      expect(count / total).toBeLessThan(0.5);
    }
  });

  it('⑤ 标准变体题库原始数据（未排序）正确答案索引同样无单一位置超过 50%', () => {
    // 排序出口会打散原始 correctIndex，因此这里直接对数据层断言：
    // 内容作者必须把正确答案分散到 A-D，排序守卫无法替代这条内容口径。
    const raw: Record<number, number> = {};
    for (const q of STANDARD_QUIZ) raw[q.correctIndex] = (raw[q.correctIndex] ?? 0) + 1;
    const total = STANDARD_QUIZ.length;
    for (const count of Object.values(raw)) {
      expect(count / total).toBeLessThan(0.5);
    }
    // 题库扩容后总量必须显著增长，防止「只剩少数章节」时分布断言空转。
    expect(total).toBeGreaterThan(300);
  });
});
