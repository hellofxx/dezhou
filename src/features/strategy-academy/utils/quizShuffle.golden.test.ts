/**
 * strategy-academy 测验 / Drill 选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：`orderQuizQuestion` 21 题（levels + localLessons + 变体课时）、
 * `orderDrillOptions` 20 题，均为硬编码 id。
 *
 * 断言口径 `[原索引置换, correctIndex / 正确项展示位置]`：
 * QuizQuestion 用 correctIndex 重映射；DrillQuestion 的 isCorrect 随选项对象移动。
 * 迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { orderDrillOptions, orderQuizQuestion } from './quizShuffle';
import { LEVELS } from '../data/levels';
import { LOCAL_LESSONS } from '../data/localLessons';
import { ALL_VARIANT_LESSONS } from '../data/lessons/variants';
import type { DrillQuestion, Lesson } from '../types';

const ALL_LESSONS: Lesson[] = (() => {
  const map = new Map<string, Lesson>();
  for (const level of LEVELS) for (const lesson of level.lessons) map.set(lesson.id, lesson);
  for (const lesson of LOCAL_LESSONS) map.set(lesson.id, lesson);
  for (const lesson of ALL_VARIANT_LESSONS) map.set(lesson.id, lesson);
  return [...map.values()];
})();

const QUIZ_BY_ID = new Map(ALL_LESSONS.flatMap((lesson) => lesson.quiz).map((q) => [q.id, q]));
const DRILL_BY_ID = new Map(
  ALL_LESSONS.flatMap((lesson) => lesson.drillData?.questions ?? []).map((q) => [q.id, q]),
);

/** 重排后数组相对原数组的索引置换 */
function perm<T>(original: readonly T[], ordered: readonly T[]): number[] {
  return ordered.map((item) => original.indexOf(item));
}

/** QuizQuestion 样本：id → [选项置换, correctIndex] */
const QUIZ_GOLDEN: ReadonlyArray<readonly [string, number[], number]> = [
  ['l1-basics-q1', [1, 2, 0, 3], 3],
  ['l2-raise-q3', [3, 0, 1, 2], 0],
  ['l2-bb-q5', [1, 3, 2, 0], 2],
  ['l3-draw-q7', [0, 1, 2, 3], 1],
  ['l3-bs-q9', [0, 1, 2, 3], 3],
  ['l4-range-q1', [2, 1, 0, 3], 1],
  ['l4-blockers-q3', [2, 3, 1, 0], 0],
  ['l4-mdf-q5', [0, 1, 2, 3], 1],
  ['l4-bc-q7', [3, 1, 2, 0], 3],
  ['l5-sr-q9', [2, 1, 3, 0], 0],
  ['l6-pushfold-q1', [3, 1, 0, 2], 3],
  ['l7-deep-q3', [1, 0, 2, 3], 0],
  ['local-limp-intro-q5', [3, 1, 2, 0], 3],
  ['local-deep-implied-q7', [3, 0, 1, 2], 1],
  ['local-gto-vs-exploit-q1', [0, 3, 2, 1], 3],
  ['l8-pool-q3', [2, 3, 0, 1], 3],
  ['l4sd-preflop-ranges-q1', [2, 3, 1, 0], 2],
  ['l6sd-tourney-ii-q3', [3, 2, 0, 1], 3],
  ['l3hu-sb-continuation-q10', [0, 3, 1, 2], 2],
  ['l4hu-counter-strategies-q2', [1, 0, 2, 3], 0],
  ['l7hu-stakes-q4', [2, 0, 1, 3], 0],
];

/** DrillQuestion 样本：id → [选项置换, 正确项展示位置] */
const DRILL_GOLDEN: ReadonlyArray<readonly [string, number[], number]> = [
  ['d-l2-3bet-q1', [2, 1, 0], 0],
  ['d-l2-3bet-q2', [2, 0, 1], 2],
  ['d-l2-3bet-q3', [0, 1, 2], 2],
  ['d-l2-3bet-q4', [2, 0, 1], 0],
  ['d-l2-3bet-q5', [2, 1, 0], 2],
  ['d-l2-3bet-q6', [2, 1, 0], 1],
  ['d-l2-3bet-q7', [2, 0, 1], 0],
  ['d-l2-3bet-q8', [1, 2, 0], 0],
  ['d-l2-pos-q1', [2, 1, 0], 2],
  ['d-l2-pos-q2', [0, 1, 2], 1],
  ['d-l2-pos-q3', [1, 2, 0], 2],
  ['d-l2-pos-q4', [0, 1, 2], 1],
  ['d-l2-pos-q5', [0, 2, 1], 0],
  ['d-l2-pos-q6', [2, 0, 1], 1],
  ['d-l2-pos-q7', [2, 1, 0], 1],
  ['d-l2-pos-q8', [0, 1, 2], 0],
  ['d-l3-cbet-q1', [2, 1, 0], 2],
  ['d-l3-cbet-q2', [2, 1, 0], 1],
  ['d-l3-cbet-q3', [2, 1, 0], 1],
  ['d-l3-cbet-q4', [1, 0, 2], 2],
];

describe('strategy orderQuizQuestion 黄金快照', () => {
  it('21 道固定样例题的选项置换与 correctIndex 不变', () => {
    for (const [id, order, correctIndex] of QUIZ_GOLDEN) {
      const source = QUIZ_BY_ID.get(id);
      expect(source, `题目 ${id} 不存在`).toBeDefined();
      const ordered = orderQuizQuestion(source!);
      expect(perm(source!.options, ordered.options), `题目 ${id} 顺序漂移`).toEqual(order);
      expect(ordered.correctIndex, `题目 ${id} correctIndex 漂移`).toBe(correctIndex);
    }
  });
});

describe('strategy orderDrillOptions 黄金快照', () => {
  it('20 道固定样例题的选项置换与正确项位置不变', () => {
    for (const [id, order, correctPosition] of DRILL_GOLDEN) {
      const source: DrillQuestion | undefined = DRILL_BY_ID.get(id);
      expect(source, `题目 ${id} 不存在`).toBeDefined();
      const ordered = orderDrillOptions(source!);
      expect(perm(source!.options, ordered.options), `题目 ${id} 顺序漂移`).toEqual(order);
      expect(
        ordered.options.findIndex((option) => option.isCorrect),
        `题目 ${id} 正确项位置漂移`,
      ).toBe(correctPosition);
    }
  });
});
