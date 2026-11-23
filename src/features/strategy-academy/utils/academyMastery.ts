/** 课程枢纽掌握度派生（展示层，不门禁）：策略掌握与理论掌握投影共用口径。 */
import type { MasteryState, MasterySummary } from '@/shared/types/academy';

/** 掌握度阈值（唯一事实源）：≥80 已掌握，60–79 通过，<60 待复习。 */
export const ACADEMY_MASTERY_THRESHOLDS = { mastered: 80, passing: 60 } as const;

export interface MasteryThresholds {
  mastered: number;
  passing: number;
}

/**
 * 掌握度分数口径（两院共用）：首次成绩优先，缺失时回退 quizScores 历史最高分。
 * 0 是合法首次分，不回退（避免把「首次考砸」显示成未测）。
 */
export function resolveFirstScore<T extends { firstScore: number }>(
  id: string,
  quizScores: Readonly<Record<string, number>>,
  attempts?: Readonly<Record<string, T>>,
): number | undefined {
  const attempt = attempts?.[id];
  if (attempt) return attempt.firstScore;
  return quizScores[id];
}

export function getMasteryState(
  score: number | undefined,
  thresholds: MasteryThresholds = ACADEMY_MASTERY_THRESHOLDS,
): MasteryState {
  if (typeof score !== 'number') return 'untested';
  if (score >= thresholds.mastered) return 'mastered';
  if (score >= thresholds.passing) return 'passing';
  return 'needsReview';
}

/**
 * 汇总掌握度。
 * - 只统计传入 items；集合外分数不进入计数。
 * - 首次成绩口径由调用方先解析为 scores 再传入。
 * - 最弱项严格小于才替换，同分保留传入顺序靠前者。
 */
export function summarizeMastery<T extends { id: string }>(
  items: readonly T[],
  scores: Readonly<Record<string, number | undefined>>,
  thresholds: MasteryThresholds = ACADEMY_MASTERY_THRESHOLDS,
): MasterySummary {
  const counts: Record<MasteryState, number> = {
    mastered: 0,
    passing: 0,
    needsReview: 0,
    untested: 0,
  };
  let weakestId: string | undefined;
  let weakestScore = Number.POSITIVE_INFINITY;

  for (const item of items) {
    const score = scores[item.id];
    counts[getMasteryState(score, thresholds)] += 1;
    if (typeof score === 'number' && score < weakestScore) {
      weakestScore = score;
      weakestId = item.id;
    }
  }

  return {
    mastered: counts.mastered,
    passing: counts.passing,
    needsReview: counts.needsReview,
    untested: counts.untested,
    total: items.length,
    weakestId,
  };
}
