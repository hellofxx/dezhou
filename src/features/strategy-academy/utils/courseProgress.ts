import { LEVELS } from '../data/courses';
import type { Lesson } from '../types';

/** 获取所有课程的扁平化列表（按级别和顺序排列） */
export function getAllLessons(): Lesson[] {
  return LEVELS.flatMap((level) => level.lessons);
}

/** 根据 ID 查找课程 */
export function findLessonById(lessonId: string): Lesson | undefined {
  return getAllLessons().find((lesson) => lesson.id === lessonId);
}

/** 获取下一课（按级别和顺序） */
export function getNextLesson(currentLessonId: string): Lesson | undefined {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.id === currentLessonId);
  if (idx === -1 || idx >= all.length - 1) return undefined;
  return all[idx + 1];
}

/** 获取某级别的已完成课程数 */
export function getLevelCompletedCount(level: number, completedLessons: string[]): number {
  const entries = LEVELS.filter((l) => l.level === level);
  if (entries.length === 0) return 0;
  return entries.flatMap((e) => e.lessons).filter((l) => completedLessons.includes(l.id)).length;
}

/** 获取总课程数 */
export function getTotalLessonCount(): number {
  return LEVELS.reduce((sum, level) => sum + level.lessons.length, 0);
}
