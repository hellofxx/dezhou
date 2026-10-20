import { useEffect, useState } from 'react';
import type { Lesson } from '../types';
import {
  getLoadedAcademyLessonsForLesson,
  getLoadedAcademyLessonsForLevel,
  getLoadedAcademyLessonsForQuickDrill,
  loadAcademyLessonsForLesson,
  loadAcademyLessonsForLevel,
  loadAcademyLessonsForQuickDrill,
} from '../data/lessons/loaders';

/**
 * 策略学院完整课程数据加载钩子。
 * - 已缓存：同步返回，课程间切换不闪骨架
 * - 未缓存：返回 null（调用方渲染骨架），加载完成后重渲染
 * - 加载失败：返回空数组，由调用方的数据缺失分支兜底（不无限挂起）
 */
function useLessons(
  key: string,
  getCached: () => Lesson[] | null,
  load: () => Promise<Lesson[]>,
): Lesson[] | null {
  const cached = key ? getCached() : [];
  const [loaded, setLoaded] = useState<{ key: string; lessons: Lesson[] } | null>(
    cached && key ? { key, lessons: cached } : null,
  );

  useEffect(() => {
    if (!key) return;
    const cachedNow = getCached();
    if (cachedNow) {
      setLoaded((previous) => (previous?.key === key ? previous : { key, lessons: cachedNow }));
      return;
    }
    let cancelled = false;
    void load()
      .then((lessons) => {
        if (!cancelled) setLoaded({ key, lessons });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, lessons: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key) return [];
  return cached ?? (loaded?.key === key ? loaded.lessons : null);
}

export function useAcademyLessonsForLesson(lessonId: string | undefined): Lesson[] | null {
  return useLessons(
    lessonId ?? '',
    () => (lessonId ? getLoadedAcademyLessonsForLesson(lessonId) : null),
    () => loadAcademyLessonsForLesson(lessonId!),
  );
}

export function useAcademyLessonsForLevel(level: number): Lesson[] | null {
  return useLessons(
    `level:${level}`,
    () => getLoadedAcademyLessonsForLevel(level),
    () => loadAcademyLessonsForLevel(level),
  );
}

export function useAcademyLessonsForQuickDrill(): Lesson[] | null {
  return useLessons(
    'quick-drill',
    getLoadedAcademyLessonsForQuickDrill,
    loadAcademyLessonsForQuickDrill,
  );
}