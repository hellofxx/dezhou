/**
 * onboarding 定级测试选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：全题库 5 题（`placementQuestions`），`getText` 传选项 id（顺序判定只依赖
 * 解析文本，此处用 id 作为稳定文本视图即可复现"文字选项集走 id 种子洗牌"分支；
 * 数值题 pq-4 另有用例覆盖数值升序）。
 *
 * 断言口径 `[选项 id 展示顺序, 正确项展示位置]`：选项对象带 isCorrect 随对象移动，
 * 无需索引重映射。迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { placementQuestions } from '../data/placementQuestions';
import { orderPlacementOptions } from './optionOrder';

/** id → [展示选项 id 顺序, 正确项展示位置] */
const GOLDEN: ReadonlyArray<readonly [string, string[], number]> = [
  ['pq-1', ['c', 'b', 'a', 'd'], 2],
  ['pq-2', ['a', 'd', 'c', 'b'], 0],
  ['pq-3', ['a', 'd', 'b', 'c'], 1],
  ['pq-4', ['b', 'a', 'd', 'c'], 0],
  ['pq-5', ['a', 'b', 'c', 'd'], 3],
];

describe('onboarding orderPlacementOptions 黄金快照', () => {
  it('5 道固定样本的展示顺序与正确项位置不变（getText = 选项 id）', () => {
    for (const [id, ids, correctPosition] of GOLDEN) {
      const source = placementQuestions.find((q) => q.id === id);
      expect(source, `题目 ${id} 不存在`).toBeDefined();
      const ordered = orderPlacementOptions(source!, (option) => option.id);
      expect(ordered.map((option) => option.id), `题目 ${id} 顺序漂移`).toEqual(ids);
      expect(
        ordered.findIndex((option) => option.isCorrect),
        `题目 ${id} 正确项位置漂移`,
      ).toBe(correctPosition);
    }
  });

  it('数值题 pq-4 按数值升序展示（zh 解析文本）', () => {
    const source = placementQuestions.find((q) => q.id === 'pq-4')!;
    const zhTexts = ['20%', '25%', '33%', '50%'];
    const ordered = orderPlacementOptions(
      source,
      (option) => zhTexts['abcd'.indexOf(option.id)]!,
    );
    expect(ordered.map((option) => zhTexts['abcd'.indexOf(option.id)])).toEqual([
      '20%',
      '25%',
      '33%',
      '50%',
    ]);
  });
});
