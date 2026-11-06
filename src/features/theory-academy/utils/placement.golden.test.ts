/**
 * theory placement 选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * `orderPlacementOptions(questionId, options, correctIndex)` 的入参是 t() 解析后的
 * 文本数组 + 源顺序 correctIndex，样本为固定合成输入（真实题库选项是 i18n key，
 * 判定只依赖解析后文本），覆盖：数值选项集 1 条 + 文字选项集 8 条（不同 id 换种子）。
 *
 * 断言口径 `[originalIndex 置换, 正确项展示位置]`。迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { orderPlacementOptions } from './placement';

const TEXT_OPTIONS = ['甲', '乙', '丙', '丁'];

/** [id, 选项文本, 源 correctIndex, 期望置换, 期望正确项展示位置] */
const GOLDEN: ReadonlyArray<readonly [string, string[], number, number[], number]> = [
  ['pl-t5-mdf', ['33%', '75%', '50%', '66%'], 2, [0, 2, 3, 1], 1],
  ['pl-t1-combos', TEXT_OPTIONS, 0, [2, 0, 3, 1], 1],
  ['pl-t1-outs', TEXT_OPTIONS, 2, [2, 0, 3, 1], 0],
  ['pl-t1-variance', TEXT_OPTIONS, 2, [0, 1, 2, 3], 2],
  ['pl-t2-implied', TEXT_OPTIONS, 2, [0, 3, 1, 2], 3],
  ['pl-t3-position', TEXT_OPTIONS, 1, [3, 1, 0, 2], 1],
  ['pl-t3-gap', TEXT_OPTIONS, 3, [2, 1, 3, 0], 2],
  ['pl-t4-blockers', TEXT_OPTIONS, 3, [0, 1, 3, 2], 2],
  ['pl-t6-spr', TEXT_OPTIONS, 1, [2, 1, 0, 3], 1],
];

describe('theory orderPlacementOptions 黄金快照', () => {
  it('固定样本的选项置换与正确项展示位置不变', () => {
    for (const [id, options, correctIndex, order, correctPosition] of GOLDEN) {
      const ordered = orderPlacementOptions(id, options, correctIndex);
      expect(
        ordered.map((option) => option.originalIndex),
        `题目 ${id} 选项顺序漂移`,
      ).toEqual(order);
      expect(
        ordered.findIndex((option) => option.isCorrect),
        `题目 ${id} 正确项位置漂移`,
      ).toBe(correctPosition);
      expect(
        ordered.map((option) => option.text),
        `题目 ${id} 文本随选项漂移`,
      ).toEqual(order.map((index) => options[index]));
    }
  });

  it('数值选项集按数值升序（pl-t5-mdf 明细）', () => {
    const ordered = orderPlacementOptions('pl-t5-mdf', ['33%', '75%', '50%', '66%'], 2);
    expect(ordered.map((option) => option.text)).toEqual(['33%', '50%', '66%', '75%']);
  });
});
