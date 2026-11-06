/**
 * puzzle-trainer canonical 选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：`getAllPuzzles()` 输出中 10 个主题各取代表题共 21 题（硬编码 id），
 * 断言选项 id 展示顺序 + 正确项展示位置。动作语义排序是 100% 确定的，
 * 因此该快照是纯回归锁。迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { getAllPuzzles } from './puzzleBank';

/** id → [展示选项 id 顺序, 正确项展示位置] */
const GOLDEN: ReadonlyArray<readonly [string, string[], number]> = [
  ['rfi-001', ['c', 'b', 'a'], 2],
  ['rfi-011', ['b', 'c', 'a'], 0],
  ['rfi-021', ['b', 'c', 'a'], 2],
  ['bbd-001', ['c', 'a', 'b'], 1],
  ['bbd-012', ['c', 'a', 'b'], 1],
  ['bbd-022', ['c', 'a', 'b'], 1],
  ['3bet-007', ['c', 'b', 'a'], 1],
  ['3bet-017', ['c', 'b', 'a'], 2],
  ['cbet-006', ['c', 'a', 'b'], 1],
  ['cbet-016', ['b', 'a', 'c'], 1],
  ['flsh-006', ['b', 'a', 'c'], 1],
  ['flsh-016', ['c', 'b', 'a'], 2],
  ['rv-006', ['b', 'c', 'a'], 2],
  ['rv-016', ['b', 'c', 'a'], 2],
  ['blf-006', ['b', 'c', 'a'], 2],
  ['ss-001', ['b', 'a', 'c'], 1],
  ['ss-011', ['b', 'a', 'c'], 1],
  ['icm-001', ['b', 'a', 'c'], 1],
  ['icm-011', ['a', 'b', 'c'], 0],
  ['mw-006', ['c', 'b', 'a'], 2],
  ['mw-016', ['b', 'a', 'c'], 1],
];

describe('puzzleBank getAllPuzzles canonical 顺序黄金快照', () => {
  it('21 道固定样本的选项顺序与正确项位置不变', () => {
    const puzzles = getAllPuzzles();
    const byId = new Map(puzzles.map((q) => [q.id, q]));
    for (const [id, ids, correctPosition] of GOLDEN) {
      const puzzle = byId.get(id);
      expect(puzzle, `题目 ${id} 不存在`).toBeDefined();
      expect(puzzle!.options.map((option) => option.id), `题目 ${id} 顺序漂移`).toEqual(ids);
      expect(
        puzzle!.options.findIndex((option) => option.isCorrect),
        `题目 ${id} 正确项位置漂移`,
      ).toBe(correctPosition);
    }
  });
});
