import { describe, expect, it } from 'vitest';
import { getDailyPuzzles, DAILY_PUZZLE_COUNT } from './dailyPuzzles';
import { getAllPuzzles } from './puzzleBank';

/**
 * 每日谜题契约守卫：
 * 同一天所有用户看到相同题目与相同选项顺序（完全确定），
 * 不同日期题目集合轮换（种子有效）。
 */
describe('每日谜题契约', () => {
  const day1 = new Date(2026, 7, 22);
  const day2 = new Date(2026, 7, 23);

  it('返回 DAILY_PUZZLE_COUNT 题且 id 唯一', () => {
    const puzzles = getDailyPuzzles(day1);
    expect(puzzles).toHaveLength(DAILY_PUZZLE_COUNT);
    expect(new Set(puzzles.map((q) => q.id)).size).toBe(DAILY_PUZZLE_COUNT);
  });

  it('同一天两次调用题目与顺序完全一致（确定性，选项顺序同源 canonical 排序）', () => {
    const first = getDailyPuzzles(day1);
    const second = getDailyPuzzles(day1);
    expect(second.map((q) => q.id)).toEqual(first.map((q) => q.id));
    // 选项顺序与 getAllPuzzles 单源一致（同一题对象选项顺序相同）
    const all = new Map(getAllPuzzles().map((q) => [q.id, q]));
    for (const q of first) {
      expect(q.options.map((o) => o.id)).toEqual(all.get(q.id)?.options.map((o) => o.id));
    }
  });

  it('不同日期题目集合不同（日期种子有效轮换）', () => {
    const a = new Set(getDailyPuzzles(day1).map((q) => q.id));
    const b = new Set(getDailyPuzzles(day2).map((q) => q.id));
    // 8 题中应至少有一半不同（纯随机下完全相同的概率可忽略）
    const overlap = [...a].filter((id) => b.has(id)).length;
    expect(overlap).toBeLessThan(DAILY_PUZZLE_COUNT / 2);
  });
});
