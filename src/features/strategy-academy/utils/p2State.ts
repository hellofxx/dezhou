import type {
  CheckpointRecord,
  LessonAttemptRecord,
  LessonNote,
  PlacementState,
} from '../types';

/** 定位免修上限：只放宽到 L4B，L5+ 必须实际完成。 */
export const PLACEMENT_CREDIT_LEVELS = ['l1', 'l2', 'l3', 'l4a', 'l4b'] as const;

export const MAX_LESSON_NOTE_LENGTH = 2000;

const PLACEMENT_LEVEL_ORDER: readonly string[] = PLACEMENT_CREDIT_LEVELS;

function levelRank(id: string | undefined): number {
  return id ? PLACEMENT_LEVEL_ORDER.indexOf(id) : -1;
}

/** 重测不降级：取更高起点；未知 id 按低档处理。 */
export function higherPlacementLevel(
  previous: string | undefined,
  next: string,
): string {
  return levelRank(next) >= levelRank(previous) ? next : (previous ?? next);
}

export interface PlacementInput {
  recommendedLevelId: string;
  creditLevels: string[];
  correct: number;
  total: number;
}

/** creditLevels 单调并集，只保留 L1-L4B；不触碰 completedLessons。 */
export function mergePlacement(
  existing: PlacementState | null,
  input: PlacementInput,
  now = Date.now(),
): PlacementState {
  const credit = new Set([...(existing?.creditLevels ?? []), ...input.creditLevels]);
  return {
    recommendedLevelId: higherPlacementLevel(existing?.recommendedLevelId, input.recommendedLevelId),
    creditLevels: [...credit]
      .filter((id) => (PLACEMENT_CREDIT_LEVELS as readonly string[]).includes(id))
      .toSorted(),
    correct: input.correct,
    total: input.total,
    takenAt: now,
  };
}

/** 课后尝试：首次写 first*，每次更新 attempts/best/last。 */
export function nextLessonAttemptRecord(
  previous: LessonAttemptRecord | undefined,
  payload: { score: number; correct: number; total: number },
  now = Date.now(),
): LessonAttemptRecord {
  return previous
    ? {
        ...previous,
        attempts: previous.attempts + 1,
        bestScore: Math.max(previous.bestScore, payload.score),
        lastScore: payload.score,
        lastAt: now,
      }
    : {
        attempts: 1,
        firstScore: payload.score,
        firstCorrect: payload.correct,
        firstTotal: payload.total,
        bestScore: payload.score,
        lastScore: payload.score,
        lastAt: now,
      };
}

/** Checkpoint 记录：首次分数定掌握度，重考只更新 best/last。 */
export function nextCheckpointRecord(
  previous: CheckpointRecord | undefined,
  payload: { score: number; questionIds: string[] },
  now = Date.now(),
): { record: CheckpointRecord; isFirstAttempt: boolean } {
  const score = Math.max(0, Math.min(100, Math.round(payload.score)));
  return {
    isFirstAttempt: previous === undefined,
    record: {
      attempts: (previous?.attempts ?? 0) + 1,
      firstScore: previous?.firstScore ?? score,
      bestScore: Math.max(previous?.bestScore ?? 0, score),
      lastScore: score,
      questionIds: payload.questionIds,
      lastAt: now,
    },
  };
}

export function toggleBookmark(ids: readonly string[], lessonId: string): string[] {
  return ids.includes(lessonId)
    ? ids.filter((id) => id !== lessonId)
    : [...ids, lessonId];
}

/** 纯文本笔记：trim + 截断；空文本即删除。 */
export function upsertLessonNote(
  notes: Readonly<Record<string, LessonNote>>,
  lessonId: string,
  text: string,
  now = Date.now(),
): Record<string, LessonNote> {
  const trimmed = text.trim().slice(0, MAX_LESSON_NOTE_LENGTH);
  const next = { ...notes };
  if (trimmed) {
    next[lessonId] = { text: trimmed, updatedAt: now };
  } else {
    delete next[lessonId];
  }
  return next;
}
