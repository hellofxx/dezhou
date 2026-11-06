/**
 * strategy-academy orderPracticeOptions 黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：PracticeDrill 题库（含 QuickDrill 消费路径）21 题，覆盖三个分流分支：
 *  - 动作类（全部选项可识别 → 消极→激进 canonical 排序）；
 *  - 数值类（数值升序）；
 *  - 文字陈述混合集（hash(id + '@practice-v1') 种子洗牌）。
 *
 * 断言口径 `[原索引置换, 正确项展示位置]`（PracticeOption 自带 isCorrect 随对象移动）。
 * 迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { orderPracticeOptions } from './practiceOptionOrder';
import { collectAllPracticeQuestions } from './quickDrill';
import { getAllLessons } from './courseProgress';

const BANK = collectAllPracticeQuestions(getAllLessons());
const BY_ID = new Map(BANK.map((q) => [q.id, q]));

/** id → [选项置换, 正确项展示位置] */
const GOLDEN: ReadonlyArray<readonly [string, number[], number]> = [
  ['l1-basics-p1', [0, 1, 2], 2],
  ['l2-raise-p4', [2, 0, 1], 1],
  ['l2-squeeze-p1', [2, 1, 0], 0],
  ['l2-blind-p3', [0, 1, 2], 1],
  ['l3-cbet-p5', [0, 2, 1], 2],
  ['l3-cr-p2', [0, 1, 2], 2],
  ['l3-bs-p4', [2, 0, 1], 1],
  ['l3-check-range-p1', [0, 1, 2], 1],
  ['l4-range-p3', [0, 1, 2], 2],
  ['l4-opp-p5', [0, 1, 2], 0],
  ['l4-gt-p2', [2, 1, 0], 2],
  ['l4-mdf-p4', [1, 0, 2], 1],
  ['l4-bc-p1', [1, 0, 2], 0],
  ['l5-tilt-p3', [2, 0, 1], 1],
  ['l5-sr-p5', [0, 1, 2], 0],
  ['l5-online-vs-live-p2', [1, 0, 2], 1],
  ['l6-pushfold-p4', [2, 0, 1], 2],
  ['l6-bounty-p1', [0, 1, 2], 1],
  ['l7-multi-p3', [0, 2, 1], 2],
  ['l7-rake-p5', [2, 0, 1], 2],
  ['l8-pop-p2', [0, 1, 2], 1],
];

describe('strategy orderPracticeOptions 黄金快照', () => {
  it('21 道固定样例题的选项置换与正确项位置不变', () => {
    for (const [id, order, correctPosition] of GOLDEN) {
      const source = BY_ID.get(id);
      expect(source, `题目 ${id} 不存在`).toBeDefined();
      const ordered = orderPracticeOptions(source!);
      expect(
        ordered.options.map((option) => source!.options.indexOf(option)),
        `题目 ${id} 顺序漂移`,
      ).toEqual(order);
      expect(
        ordered.options.findIndex((option) => option.isCorrect),
        `题目 ${id} 正确项位置漂移`,
      ).toBe(correctPosition);
    }
  });
});
