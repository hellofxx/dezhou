import type { TheoryLearningSnapshot } from '@/shared/types/theoryDataSource';
import {
  ACADEMY_MASTERY_THRESHOLDS,
  getMasteryState,
  resolveFirstScore,
  type MasteryThresholds,
} from './academyMastery';

export interface HubConceptCounts {
  total: number;
  done: number;
  mastered: number;
  needsReview: number;
  untested: number;
}

/** 章级首次分（首次优先、回退 quizScores）；理论快照未就绪时全部 undefined。 */
export function buildConceptScores(
  chapterIds: readonly string[],
  snapshot?: TheoryLearningSnapshot,
): Record<string, number | undefined> {
  const scores: Record<string, number | undefined> = {};
  for (const id of chapterIds) {
    scores[id] = snapshot
      ? resolveFirstScore(id, snapshot.quizScores, snapshot.chapterAttempts)
      : undefined;
  }
  return scores;
}

/** 段内最弱概念：首次分 < passing；未测不算弱项；同分保留 chapterIds 顺序靠前者。 */
export function selectWeakConceptInStage(
  chapterIds: readonly string[],
  scores: Readonly<Record<string, number | undefined>>,
  thresholds: MasteryThresholds = ACADEMY_MASTERY_THRESHOLDS,
): string | undefined {
  let weakest: string | undefined;
  let weakestScore = Number.POSITIVE_INFINITY;
  for (const id of chapterIds) {
    const score = scores[id];
    if (typeof score !== 'number' || score >= thresholds.passing) continue;
    if (score < weakestScore) {
      weakest = id;
      weakestScore = score;
    }
  }
  return weakest;
}

/** 段内下一未读概念（保持 chapterIds 顺序）。 */
export function selectNextConceptInStage(
  chapterIds: readonly string[],
  completedChapters: readonly string[],
): string | undefined {
  const completed = new Set(completedChapters);
  return chapterIds.find((id) => !completed.has(id));
}

export function stageConceptCounts(
  chapterIds: readonly string[],
  completedChapters: readonly string[],
  scores: Readonly<Record<string, number | undefined>>,
  thresholds: MasteryThresholds = ACADEMY_MASTERY_THRESHOLDS,
): HubConceptCounts {
  const completed = new Set(completedChapters);
  const counts: HubConceptCounts = {
    total: chapterIds.length,
    done: 0,
    mastered: 0,
    needsReview: 0,
    untested: 0,
  };
  for (const id of chapterIds) {
    if (completed.has(id)) counts.done += 1;
    const state = getMasteryState(scores[id], thresholds);
    if (state === 'mastered') counts.mastered += 1;
    else if (state === 'needsReview') counts.needsReview += 1;
    else if (state === 'untested') counts.untested += 1;
  }
  return counts;
}