/**
 * P0B-01 分布守卫：practice 题库（含 QuickDrill 消费路径）选项排序出口。
 *
 * 背景：259 题按题库原序渲染时正确答案 55.2% 集中在 index 1。
 * 本守卫全量迭代 practice 题库，断言经 orderPracticeOptions 重排后：
 *  1. 正确答案在任一位置的占比 ≤60%（治理红线，口径与 drillOptionOrder 守卫一致）；
 *  2. 同一题两次排序结果完全一致（确定性，跨会话稳定）；
 *  3. 源题目对象未被修改（源题库静态数据一律不动）；
 *  4. 重排后正确选项保留且唯一（isCorrect 随选项对象整体移动）。
 */
import { describe, it, expect } from 'vitest';
import { collectAllPracticeQuestions } from './quickDrill';
import { orderPracticeOptions } from './practiceOptionOrder';

const BANK = collectAllPracticeQuestions();

describe('practiceOptionOrder 分布守卫（P0B-01）', () => {
  it('题库非空且每题恰有一个正确选项（守卫前提）', () => {
    expect(BANK.length).toBeGreaterThan(0);
    for (const q of BANK) {
      const correctCount = q.options.filter((o) => o.isCorrect).length;
      expect(correctCount, `题目 ${q.id} 正确选项数`).toBe(1);
    }
  });

  it('重排后正确答案任一位置占比 ≤60%', () => {
    const positionCounts = new Map<number, number>();
    for (const q of BANK) {
      const ordered = orderPracticeOptions(q);
      const idx = ordered.options.findIndex((o) => o.isCorrect);
      expect(idx, `题目 ${q.id} 重排后仍需存在正确选项`).toBeGreaterThanOrEqual(0);
      positionCounts.set(idx, (positionCounts.get(idx) ?? 0) + 1);
    }
    for (const [position, count] of positionCounts) {
      const share = count / BANK.length;
      expect(
        share,
        `位置 ${position} 占比 ${(share * 100).toFixed(1)}%（${count}/${BANK.length}）超过 60% 红线`,
      ).toBeLessThanOrEqual(0.6);
    }
  });

  it('同一题两次排序结果完全一致（确定性）', () => {
    for (const q of BANK) {
      const first = orderPracticeOptions(q);
      const second = orderPracticeOptions(q);
      expect(second.options).toEqual(first.options);
      // 选项对象引用也应一致（重排只移动引用，不复制选项对象）
      first.options.forEach((option, i) => {
        expect(second.options[i]).toBe(option);
      });
    }
  });

  it('不修改源题目对象（源题库静态数据不动）', () => {
    for (const q of BANK) {
      const snapshot = [...q.options];
      const ordered = orderPracticeOptions(q);
      expect(ordered).not.toBe(q);
      expect(q.options).toEqual(snapshot);
      q.options.forEach((option, i) => {
        expect(snapshot[i]).toBe(option);
      });
    }
  });

  it('重排后正确选项保留且唯一（isCorrect 随对象移动，无需索引重映射）', () => {
    for (const q of BANK) {
      const ordered = orderPracticeOptions(q);
      expect(ordered.options).toHaveLength(q.options.length);
      expect(ordered.options.filter((o) => o.isCorrect)).toHaveLength(1);
      // 重排是置换：原选项对象一个不少
      expect(new Set(ordered.options)).toEqual(new Set(q.options));
    }
  });
});
