import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import {
  useAcademyLessonsForLesson,
  useAcademyLessonsForLevel,
  useAcademyLessonsForQuickDrill,
} from './useAcademyLessons';
import {
  loadAcademyLessonsForLevel,
  loadAcademyLessonsForLesson,
  loadAcademyLessonsForQuickDrill,
} from '../data/lessons/loaders';
import { getAllLessonSummaries } from '../utils/academyMeta';

/**
 * useAcademyLessons 懒加载 hook 契约：
 * - 未缓存：先返回 null（调用方渲染骨架），加载完成后返回课程
 * - 已缓存：同步返回课程，课程间切换不闪骨架
 * - 加载失败（未知 Level）：返回空数组兜底，不无限挂起
 * - 空 lessonId：返回空数组
 *
 * 真实 loaders 缓存为模块级：每个用例自行预载所需 Level，避免依赖用例顺序。
 */

afterEach(() => {
  cleanup();
});

describe('useAcademyLessonsForLevel', () => {
  it('未缓存时先返回 null，加载后返回该 Level 课程', async () => {
    const { result } = renderHook(() => useAcademyLessonsForLevel(6));
    expect(result.current).toBeNull();

    await waitFor(() => {
      expect(result.current).not.toBeNull();
    });
    expect(result.current!.length).toBeGreaterThan(0);
    expect(result.current!.every((lesson) => lesson.level === 6)).toBe(true);
  });

  it('已缓存时同步返回课程（不闪骨架）', async () => {
    const loaded = await loadAcademyLessonsForLevel(5);
    const { result } = renderHook(() => useAcademyLessonsForLevel(5));
    expect(result.current).toBe(loaded);
  });

  it('未知 Level 加载失败时返回空数组（不无限挂起）', async () => {
    const { result } = renderHook(() => useAcademyLessonsForLevel(99));
    expect(result.current).toBeNull();
    await waitFor(() => {
      expect(result.current).toEqual([]);
    });
  });
});

describe('useAcademyLessonsForLesson', () => {
  it('按课程 id 所属 Level 加载（变体课程独立数据源）', async () => {
    const loaded = await loadAcademyLessonsForLesson('l3sd-intro');
    const { result } = renderHook(() => useAcademyLessonsForLesson('l3sd-intro'));
    expect(result.current).toBe(loaded);
    expect(result.current!.some((lesson) => lesson.id === 'l3sd-intro')).toBe(true);
  });

  it('lessonId 为空时同步返回空数组', () => {
    const { result } = renderHook(() => useAcademyLessonsForLesson(undefined));
    expect(result.current).toEqual([]);
  });
});

describe('useAcademyLessonsForQuickDrill', () => {
  it('加载标准全部级别，课程数与 manifest 一致', async () => {
    const preloaded = await loadAcademyLessonsForQuickDrill();
    const { result } = renderHook(() => useAcademyLessonsForQuickDrill());
    // 速训池每次扁平化生成新数组（实现按 Level 缓存），按内容比对
    expect(result.current).toHaveLength(getAllLessonSummaries().length);
    expect(result.current!.map((lesson) => lesson.id)).toEqual(preloaded.map((lesson) => lesson.id));
  });
});
