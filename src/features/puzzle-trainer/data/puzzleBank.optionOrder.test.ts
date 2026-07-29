import { describe, expect, it } from 'vitest';
import { getAllPuzzles, PUZZLE_BANK } from './puzzleBank';
import { parseOptionSortKey, UNKNOWN_CATEGORY } from '../utils/optionOrder';

/**
 * 题库选项语义固定排序测试（"答案位置偏差治理"方案）。
 *
 * 背景：原始题库数据中正确答案高度集中于 options[0]。
 * getAllPuzzles / getPuzzlesByTheme 现按动作语义固定排序
 * （Fold → Check → Call → Limp → Bet → Raise → 全下，同类按尺度升序），
 * 与真实扑克客户端一致，正确答案位置与书写顺序解耦且 100% 确定。
 */
describe('puzzleBank 选项语义固定排序', () => {
  it('每道题恰有 1 个正确选项，且其 evLoss 为 0 或 undefined', () => {
    const puzzles = getAllPuzzles();
    expect(puzzles.length).toBeGreaterThan(0);
    for (const q of puzzles) {
      const correct = q.options.filter((o) => o.isCorrect);
      expect(correct, `题目 ${q.id} 正确选项数量异常`).toHaveLength(1);
      const evLoss = correct[0]?.evLoss;
      expect(
        evLoss === undefined || evLoss === 0,
        `题目 ${q.id} 正确选项 evLoss=${evLoss} 应为 0 或 undefined`
      ).toBe(true);
    }
  });

  it('两次调用选项顺序完全一致（确定性）', () => {
    const first = getAllPuzzles();
    const second = getAllPuzzles();
    expect(second.length).toBe(first.length);
    for (let i = 0; i < first.length; i++) {
      const a = first[i];
      const b = second[i];
      expect(b?.id).toBe(a?.id);
      expect(b?.options.map((o) => o.id)).toEqual(a?.options.map((o) => o.id));
    }
  });

  it('全部题目的每个选项文本均可被 parseOptionSortKey 解析（类别 ≠ 99）', () => {
    const puzzles = getAllPuzzles();
    for (const q of puzzles) {
      for (const o of q.options) {
        const key = parseOptionSortKey(o.text);
        expect(
          key.category,
          `题目 ${q.id} 选项 "${o.text}" 无法识别类别（category=99），请扩展 optionOrder.ts 解析规则`
        ).not.toBe(UNKNOWN_CATEGORY);
      }
    }
  });

  it('每题选项已按 (category, size) 非降序排列，同类不同尺度按尺度升序', () => {
    const puzzles = getAllPuzzles();
    for (const q of puzzles) {
      const keys = q.options.map((o) => parseOptionSortKey(o.text));
      for (let i = 1; i < keys.length; i++) {
        const prev = keys[i - 1];
        const curr = keys[i];
        if (!prev || !curr) continue;
        const ordered =
          prev.category < curr.category ||
          (prev.category === curr.category && prev.size <= curr.size);
        expect(
          ordered,
          `题目 ${q.id} 选项顺序违规：` +
            `"${q.options[i - 1]?.text}"(${prev.category},${prev.size}) 应排在 ` +
            `"${q.options[i]?.text}"(${curr.category},${curr.size}) 之前或同位`
        ).toBe(true);
      }
    }
  });

  it('排序不丢失选项：每题排序后选项 id 集合与原始 PUZZLE_BANK 一致', () => {
    const originalById = new Map(
      Object.values(PUZZLE_BANK)
        .flat()
        .map((q) => [q.id, [...q.options.map((o) => o.id)].sort()])
    );
    const puzzles = getAllPuzzles();
    expect(puzzles.length).toBe(originalById.size);
    for (const q of puzzles) {
      const sortedIds = [...q.options.map((o) => o.id)].sort();
      expect(sortedIds, `题目 ${q.id} 选项集合不一致`).toEqual(originalById.get(q.id));
    }
  });

  it('正确答案索引分布：任一索引占比 < 60%', () => {
    const puzzles = getAllPuzzles();
    const counts = new Map<number, number>();
    for (const q of puzzles) {
      const idx = q.options.findIndex((o) => o.isCorrect);
      expect(idx, `题目 ${q.id} 未找到正确选项`).toBeGreaterThanOrEqual(0);
      counts.set(idx, (counts.get(idx) ?? 0) + 1);
    }
    const distribution = [...counts.entries()]
      .sort(([a], [b]) => a - b)
      .map(([idx, n]) => `索引${idx}: ${n} 题 (${((n / puzzles.length) * 100).toFixed(1)}%)`)
      .join(', ');
    // 输出实测分布，便于报告核对

    console.log(`[语义排序分布] 共 ${puzzles.length} 题 → ${distribution}`);
    for (const [idx, n] of counts) {
      expect(n / puzzles.length, `索引 ${idx} 占比过高`).toBeLessThan(0.6);
    }
  });
});
