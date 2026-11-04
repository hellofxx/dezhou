import type { LearningTrack, LessonSummary } from '../types';

/** 一组 id 是否全部完成（空集合视为未完成）。 */
export function areAllIdsCompleted(
  ids: readonly string[],
  completedLessons: readonly string[],
): boolean {
  if (ids.length === 0) return false;
  const completed = new Set(completedLessons);
  return ids.every((id) => completed.has(id));
}

/** 一组课时是否全部完成（空集合视为未完成）。 */
export function areAllLessonsCompleted(
  lessons: readonly LessonSummary[],
  completedLessons: readonly string[],
): boolean {
  return areAllIdsCompleted(
    lessons.map((lesson) => lesson.id),
    completedLessons,
  );
}

/** 学习轨道是否全部完成；空 lessonIds（动态轨道）视为未完成。 */
export function isTrackComplete(
  track: Pick<LearningTrack, 'lessonIds'>,
  completedLessons: readonly string[],
): boolean {
  return areAllIdsCompleted(track.lessonIds, completedLessons);
}

/** 课时完成百分比（0-100，四舍五入）。 */
export function computeLessonProgress(
  lessons: readonly LessonSummary[],
  completedLessons: readonly string[],
): number {
  if (lessons.length === 0) return 0;
  const completed = new Set(completedLessons);
  return Math.round(
    (lessons.filter((lesson) => completed.has(lesson.id)).length / lessons.length) * 100,
  );
}
