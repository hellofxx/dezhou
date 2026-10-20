import { describe, expect, it } from 'vitest';
import {
  getLoadedAcademyLessonsForLesson,
  loadAcademyLessonsForLesson,
  loadAcademyLessonsForQuickDrill,
} from './loaders';
import { getAllLessonSummaries } from '../../utils/academyMeta';

/**
 * 完整课程数据按 Level/变体懒加载守卫：
 * - 课程页只加载当前课程所属 Level（L4 合并 4A/4B）
 * - 变体/本土课走各自 chunk
 * - 速训才加载标准全级别
 */

describe('academy 完整课程按 Level/变体懒加载', () => {
  it('未加载时同步查询为 null，加载后命中缓存', async () => {
    expect(getLoadedAcademyLessonsForLesson('l1-basics')).toBeNull();
    const lessons = await loadAcademyLessonsForLesson('l1-basics');
    expect(lessons.some((lesson) => lesson.id === 'l1-basics')).toBe(true);
    expect(getLoadedAcademyLessonsForLesson('l1-basics')).toEqual(lessons);
  });

  it('L4 课程合并加载 4A + 4B', async () => {
    const lessons = await loadAcademyLessonsForLesson('l4-gto-basics');
    expect(lessons.some((lesson) => lesson.id === 'l4-range-thinking')).toBe(true);
    expect(lessons.some((lesson) => lesson.id === 'l4-gto-basics')).toBe(true);
  });

  it('变体与本土课走各自数据源', async () => {
    expect((await loadAcademyLessonsForLesson('l3sd-intro')).some((l) => l.id === 'l3sd-intro')).toBe(
      true,
    );
    expect(
      (await loadAcademyLessonsForLesson('l3hu-bn-aggression')).some(
        (l) => l.id === 'l3hu-bn-aggression',
      ),
    ).toBe(true);
    expect(
      (await loadAcademyLessonsForLesson('local-limp-intro')).some(
        (l) => l.id === 'local-limp-intro',
      ),
    ).toBe(true);
  });

  it('Drill 课程归 Level 1 数据', async () => {
    const lessons = await loadAcademyLessonsForLesson('drill-hand-ranking');
    expect(lessons.some((lesson) => lesson.id === 'drill-hand-ranking')).toBe(true);
  });

  it('速训加载标准全部级别，课程数与 manifest 一致', async () => {
    const lessons = await loadAcademyLessonsForQuickDrill();
    expect(lessons.length).toBe(getAllLessonSummaries().length);
  });
});
