/**
 * theory 章末小测选项排序黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：标准 / 短牌 / 单挑三变体各取代表性题共 20 题（硬编码 id 列表），
 * 外加 1 道数值选项集合成题锁住"数值升序 + correctIndex 重映射"分支。
 *
 * 断言口径 `[原索引置换, correctIndex]`：与选项文案解耦，只锁顺序与正确项落位。
 * 迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { orderTheoryQuizQuestion } from './quizOrder';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import type { TheoryQuizQuestion } from '../types';

const ALL_QUIZ: TheoryQuizQuestion[] = ALL_VARIANT_THEORY_LEVELS.flatMap((level) =>
  level.chapters.flatMap((chapter) => chapter.quiz),
);

/** id → [选项置换, correctIndex] */
const GOLDEN: ReadonlyArray<readonly [string, number[], number]> = [
  ['t1-combinatorics-q1', [1, 3, 0, 2], 2],
  ['t2-pot-odds-q1', [0, 1, 2, 3], 1],
  ['t3-blind-battle-q1', [0, 1, 2, 3], 1],
  ['t4-structure-economics-q1', [3, 2, 0, 1], 2],
  ['t5-mixed-strategy-q1', [2, 1, 0, 3], 1],
  ['t6-equity-realization-q1', [0, 1, 2, 3], 2],
  ['t7-player-types-q1', [2, 0, 1, 3], 2],
  ['t8-bankroll-psych-q1', [1, 3, 0, 2], 0],
  ['t9-alpha-q1', [3, 1, 2, 0], 1],
  ['t1sd-outs-q2', [3, 1, 2, 0], 1],
  ['t4sd-range-construction-q2', [0, 3, 1, 2], 2],
  ['t6sd-equity-realization-q2', [3, 0, 1, 2], 1],
  ['t9sd-case-study-q2', [0, 3, 1, 2], 2],
  ['t2hu-odds-q8', [1, 2, 3, 0], 3],
  ['t3hu-position-reversal-q8', [1, 0, 2, 3], 1],
  ['t4hu-preflop-structure-q8', [0, 3, 2, 1], 3],
  ['t5hu-postflop-equilibrium-q8', [2, 1, 0, 3], 1],
  ['t7hu-patterns-q8', [2, 0, 3, 1], 1],
  ['t8hu-reads-q8', [2, 0, 1, 3], 2],
  ['t9hu-mop-q8', [1, 3, 2, 0], 2],
];

const BY_ID = new Map(ALL_QUIZ.map((q) => [q.id, q]));

describe('theory orderTheoryQuizQuestion 黄金快照', () => {
  it('20 道固定样例题的选项置换与 correctIndex 不变', () => {
    for (const [id, order, correctIndex] of GOLDEN) {
      const source = BY_ID.get(id);
      expect(source, `题目 ${id} 不在变体题库中`).toBeDefined();
      const ordered = orderTheoryQuizQuestion(source!);
      expect(
        ordered.options.map((option) => source!.options.indexOf(option)),
        `题目 ${id} 选项顺序漂移`,
      ).toEqual(order);
      expect(ordered.correctIndex, `题目 ${id} correctIndex 漂移`).toBe(correctIndex);
    }
  });

  it('数值选项集合成题：按数值升序且 correctIndex 重映射', () => {
    const numeric: TheoryQuizQuestion = {
      id: 'golden-numeric',
      question: '期望值是多少？',
      options: ['50%', '25%', '33%', '20%'],
      correctIndex: 0,
      explanation: '合成样本',
    };
    const ordered = orderTheoryQuizQuestion(numeric);
    expect(ordered.options).toEqual(['20%', '25%', '33%', '50%']);
    expect(ordered.correctIndex).toBe(3);
  });
});
