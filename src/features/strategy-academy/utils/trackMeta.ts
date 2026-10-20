import type { LearningTrack } from '../types';
import { findLevelSummaryById } from './academyMeta';

/**
 * 检查用户是否已完成指定 Track 的前置 Level。
 * 口径：按 Level 条目的全部课程是否都在 completedLessons 中判定（不依赖认证）。
 */
export function isTrackPrerequisiteMet(
  track: LearningTrack,
  completedLessons: readonly string[],
): boolean {
  if (!track.prerequisiteLevelIds?.length) return true;
  const completed = new Set(completedLessons);
  return track.prerequisiteLevelIds.every((id) => {
    const entry = findLevelSummaryById(id);
    if (!entry || entry.lessons.length === 0) return false;
    return entry.lessons.every((lesson) => completed.has(lesson.id));
  });
}

/** 生成前置条件未满足时的提示文字 */
export function getPrerequisiteHint(prerequisiteLevelIds: string[]): string {
  const labels = prerequisiteLevelIds.map((id) => id.replace(/^l/i, 'Level '));
  return `建议先完成 ${labels.join('、')} 的课程`;
}
