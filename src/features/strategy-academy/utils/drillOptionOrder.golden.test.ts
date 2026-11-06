/**
 * strategy-academy orderResolvedOptions 黄金快照（Batch 6a：先锁行为，再迁移实现）。
 *
 * 固定样本：四类 i18n-key 型 Drill 题库共 32 题（outs 8 + potOdds 6 + handRanking 10
 * + opponent 第 2 问 8），全量取样。
 *
 * 断言口径 `[原索引置换, correctIndex]`：文本视图传原始 key / 文本本身，只锁顺序与
 * 正确项落位（数值方向由 hash(id + '@v2') 奇偶决定，必须保持不变）。
 * 迁移实现时本文件必须零改动。
 */
import { describe, expect, it } from 'vitest';
import { orderResolvedOptions } from './quizShuffle';
import { OUTS_QUESTIONS } from '../components/drills/outsQuestions';
import { POT_ODDS_QUESTIONS } from '../components/drills/potOddsQuestions';
import { HAND_RANKING_QUESTIONS } from '../components/drills/handRankingQuestions';
import { OPPONENT_DRILL_QUESTIONS } from '../data/opponentProfiles';

/** id → [选项置换, correctIndex] */
const GOLDEN: ReadonlyArray<readonly [string, number[], number]> = [
  ['outs-q1', [3, 2, 1, 0], 2],
  ['outs-q2', [0, 1, 2, 3], 1],
  ['outs-q3', [3, 2, 1, 0], 1],
  ['outs-q4', [0, 1, 2, 3], 2],
  ['outs-q5', [3, 2, 1, 0], 2],
  ['outs-q6', [0, 1, 2, 3], 1],
  ['outs-q7', [3, 2, 1, 0], 2],
  ['outs-q8', [0, 1, 2, 3], 1],
  ['po-q1', [3, 2, 1, 0], 2],
  ['po-q2', [0, 1, 2, 3], 1],
  ['po-q3', [0, 1], 0],
  ['po-q4', [0, 1], 1],
  ['po-q5', [3, 2, 1, 0], 2],
  ['po-q6', [0, 1], 0],
  ['hr-q1', [2, 0, 1], 2],
  ['hr-q2', [1, 0, 2], 0],
  ['hr-q3', [0, 2, 1], 0],
  ['hr-q4', [1, 2, 3, 0], 3],
  ['hr-q5', [1, 0, 3, 2], 0],
  ['hr-q6', [3, 0, 1, 2], 3],
  ['hr-q7', [2, 1, 3, 0], 1],
  ['hr-q8', [3, 2, 1, 0], 1],
  ['hr-q9', [0, 2, 1], 0],
  ['hr-q10', [2, 0, 1], 1],
  ['opp-drill-q1', [3, 2, 0, 1], 3],
  ['opp-drill-q2', [3, 0, 2, 1], 3],
  ['opp-drill-q3', [0, 1, 3, 2], 0],
  ['opp-drill-q4', [3, 0, 2, 1], 1],
  ['opp-drill-q5', [1, 3, 0, 2], 2],
  ['opp-drill-q6', [2, 0, 3, 1], 1],
  ['opp-drill-q7', [2, 0, 3, 1], 1],
  ['opp-drill-q8', [0, 3, 1, 2], 0],
];

interface Sample {
  id: string;
  options: readonly string[];
  correctIndex: number;
}

const SAMPLES: Sample[] = [
  ...[...OUTS_QUESTIONS, ...POT_ODDS_QUESTIONS].map((q) => ({
    id: q.id,
    options: q.optionsKeys,
    correctIndex: q.correctIndex,
  })),
  ...HAND_RANKING_QUESTIONS.map((q) => ({
    id: q.id,
    options: q.optionsKeys,
    correctIndex: q.correctIndex,
  })),
  ...OPPONENT_DRILL_QUESTIONS.map((q) => ({
    id: q.id,
    options: q.strategyOptions,
    correctIndex: q.correctStrategyIndex,
  })),
];

describe('strategy orderResolvedOptions 黄金快照', () => {
  it('32 道固定样例题的选项置换与 correctIndex 不变', () => {
    const goldenById = new Map(GOLDEN.map(([id, order, correct]) => [id, { order, correct }]));
    expect(SAMPLES).toHaveLength(GOLDEN.length);
    for (const sample of SAMPLES) {
      const golden = goldenById.get(sample.id);
      expect(golden, `题目 ${sample.id} 缺少黄金条目`).toBeDefined();
      const ordered = orderResolvedOptions(
        sample.id,
        sample.options,
        sample.correctIndex,
        (option) => option,
      );
      expect(
        ordered.options.map((option) => sample.options.indexOf(option)),
        `题目 ${sample.id} 顺序漂移`,
      ).toEqual(golden!.order);
      expect(ordered.correctIndex, `题目 ${sample.id} correctIndex 漂移`).toBe(golden!.correct);
    }
  });
});
