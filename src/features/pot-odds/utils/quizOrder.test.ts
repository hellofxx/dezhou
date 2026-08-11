import { describe, expect, it } from 'vitest';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from './quizOrder';

/**
 * 赔率测验题库选项排序测试（答案位置偏差治理守卫）。
 *
 * 背景：原 14 题正确答案高度集中于 options[0]（10/14 = 71.4%），
 * 且 11 道二选一题中 10 道的正确答案是"是/跟注有利"式肯定项。
 * 治理：扩充 5 道否定项平衡题（id 15-19）+ orderQuizOptions 统一排序
 * （数值选项升序、其余按题目 id 种子确定性洗牌）。
 */
describe('pot-odds 题库选项排序（quizOrder）', () => {
  const ordered = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));

  it('题库共 19 题（14 原题 + 5 平衡题）', () => {
    expect(QUIZ_QUESTIONS).toHaveLength(19);
    expect(QUIZ_QUESTIONS.map((q) => q.id)).toEqual(
      Array.from({ length: 19 }, (_, i) => i + 1),
    );
  });

  it('处理后正确答案索引分布：任一索引占比 < 60%', () => {
    const counts = new Map<number, number>();
    for (const q of ordered) {
      const idx = q.options.findIndex((o) => o.isCorrect);
      expect(idx, `题目 ${q.id} 未找到正确选项`).toBeGreaterThanOrEqual(0);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    const distribution = [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([idx, n]) => `索引${idx}: ${n} 题 (${((n / ordered.length) * 100).toFixed(1)}%)`)
      .join(', ');
    // 输出实测分布，便于报告核对

    console.log(`[pot-odds 排序分布] 共 ${ordered.length} 题 → ${distribution}`);
    for (const [idx, n] of counts) {
      expect(n / ordered.length, `索引 ${idx} 占比过高`).toBeLessThan(0.6);
    }
  });

  it('内容平衡：否定项平衡题（balanceQuestion 标记）≥ 5', () => {
    // i18n 化后选项文本为 key（potOdds.quizBank.qN.optX.text），无法再从文本判语义。
    // 平衡题语义由数据层的 balanceQuestion 标记显式声明（id 15-19，正确答案为弃牌/不跟注否定项）。
    const balanceQuestions = QUIZ_QUESTIONS.filter((q) => q.balanceQuestion === true);
    expect(balanceQuestions.length).toBeGreaterThanOrEqual(5);
    // 每题正确答案存在且为 1 个（平衡题仍是有效题）
    for (const q of balanceQuestions) {
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `平衡题 ${q.id} 正确选项数量异常`).toHaveLength(1);
    }
  });

  it('确定性：两次处理结果完全一致', () => {
    const again = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));
    expect(again).toEqual(ordered);
  });

  it('数值选项题（id 2/6/11）走升序分支：选项按首个数字升序', () => {
    const numericIds = [2, 6, 11];
    for (const id of numericIds) {
      const q = ordered.find((item) => item.id === id);
      expect(q, `题目 ${id} 不存在`).toBeDefined();
      const values = q!.options.map((o) => {
        const match = /\d+(?:\.\d+)?/.exec(o.text);
        expect(match, `题目 ${id} 选项「${o.text}」无数字`).not.toBeNull();
        return parseFloat(match![0]);
      });
      const sorted = [...values].sort((a, b) => a - b);
      expect(values, `题目 ${id} 选项未按数值升序`).toEqual(sorted);
    }
  });

  it('排序不丢失选项：每题选项文本集合与原始一致', () => {
    const originalById = new Map(
      QUIZ_QUESTIONS.map((q) => [q.id, [...q.options.map((o) => o.text)].sort()]),
    );
    for (const q of ordered) {
      const texts = [...q.options.map((o) => o.text)].sort();
      expect(texts, `题目 ${q.id} 选项集合不一致`).toEqual(originalById.get(q.id));
    }
  });

  it('每题恰有 1 个正确选项', () => {
    for (const q of ordered) {
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `题目 ${q.id} 正确选项数量异常`).toHaveLength(1);
    }
  });
});
