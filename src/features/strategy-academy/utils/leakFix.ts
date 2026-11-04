import type { EloDimension, EloRating } from '@/shared/types/elo';
import { getLessonMeta } from '../data/lessonMeta';
import { getVariantLessonSummaries } from './academyMeta';

const DIMENSIONS: readonly EloDimension[] = [
  'preflop',
  'postflop',
  'math',
  'handReading',
  'mental',
];

/** 五维 ELO 最低维度；同分按固定顺序取先者（结果稳定）。 */
export function findWeakestEloDimension(elo: EloRating): EloDimension {
  let weakest: EloDimension = DIMENSIONS[0]!;
  let lowest = Number.POSITIVE_INFINITY;
  for (const dimension of DIMENSIONS) {
    if (elo[dimension] < lowest) {
      lowest = elo[dimension];
      weakest = dimension;
    }
  }
  return weakest;
}

/**
 * 实战弱点修补轨道的动态推荐：最弱 ELO 维度 → 未完成的标准课。
 * 不足 limit 时用其他未完成课补齐；只读，不写 store。
 */
export function resolveLeakFixLessonIds(
  elo: EloRating,
  completedLessons: readonly string[],
  limit = 3,
): string[] {
  const weakest = findWeakestEloDimension(elo);
  const completed = new Set(completedLessons);
  const candidates = getVariantLessonSummaries('standard').filter(
    (lesson) => lesson.type !== 'drill' && !completed.has(lesson.id),
  );
  const matching = candidates.filter(
    (lesson) => getLessonMeta(lesson.id).eloDimension === weakest,
  );
  const rest = candidates.filter((lesson) => !matching.includes(lesson));
  return [...matching, ...rest].slice(0, limit).map((lesson) => lesson.id);
}
