import { describe, expect, it } from 'vitest';
import i18n from './config';
import { switchLanguage } from './preload';
import {
  ALL_ACADEMY_COURSE_FILES,
  deriveAcademyCourseFilesForLesson,
  isAcademyCourseFilesLoaded,
  loadAcademyCourses,
  loadAcademyCoursesForLesson,
} from './academyCourse';

/**
 * academy-course 按文件懒加载守卫：
 * 课程页只应加载所属 Level/变体文件（+ 术语/对手专题），不能回退为一次全载。
 */

describe('deriveAcademyCourseFilesForLesson', () => {
  it('标准 Level 课程映射到 levelN + 通用专题文件', () => {
    expect(deriveAcademyCourseFilesForLesson('l1-basics')).toEqual([
      'level1',
      'term',
      'opponent',
      'opponentDrill',
    ]);
    expect(deriveAcademyCourseFilesForLesson('l4-gto-basics')[0]).toBe('level4');
    expect(deriveAcademyCourseFilesForLesson('l8-pool-tendencies')[0]).toBe('level8');
  });

  it('变体 / 本土课 / Drill 课程映射到各自文件', () => {
    expect(deriveAcademyCourseFilesForLesson('l3sd-something')[0]).toBe('short-deck');
    expect(deriveAcademyCourseFilesForLesson('l3hu-something')[0]).toBe('heads-up-l3');
    expect(deriveAcademyCourseFilesForLesson('l8hu-something')[0]).toBe('heads-up-l8');
    expect(deriveAcademyCourseFilesForLesson('local-mental-tilt-recognition')[0]).toBe(
      'local-lessons',
    );
    expect(deriveAcademyCourseFilesForLesson('drill-hand-ranking')[0]).toBe('level1');
  });

  it('未知课程 id 回退全量，保证不漏 key', () => {
    expect(deriveAcademyCourseFilesForLesson('unknown-lesson')).toEqual(ALL_ACADEMY_COURSE_FILES);
  });
});

describe('academy-course 定向加载', () => {
  it('只注入目标 Level 文件，不把其他 Level 一起拉入', async () => {
    expect(isAcademyCourseFilesLoaded(['level2'], 'zh')).toBe(false);

    await loadAcademyCoursesForLesson('l2-raise-sizing', 'zh');

    expect(
      i18n.getResource('zh', 'translation', 'academy.lessonContent.l2-raise-sizing.0'),
    ).toBeTruthy();
    expect(
      i18n.getResource('zh', 'translation', 'academy.lessonContent.l3-cbet.0'),
    ).toBeUndefined();
    expect(isAcademyCourseFilesLoaded(['level2', 'term', 'opponent', 'opponentDrill'], 'zh')).toBe(
      true,
    );
  });

  it('语言切换只补加载已访问文件的目标语言', async () => {
    await loadAcademyCoursesForLesson('l2-raise-sizing', 'zh');

    await switchLanguage('en');

    expect(
      i18n.getResource('en', 'translation', 'academy.lessonContent.l2-raise-sizing.0'),
    ).toBeTruthy();
    expect(isAcademyCourseFilesLoaded(['level2', 'term', 'opponent', 'opponentDrill'], 'en')).toBe(
      true,
    );

    await switchLanguage('zh');
  });

  it('loadAcademyCourses 全量加载仍可作为测试/兜底入口', async () => {
    await loadAcademyCourses('zh');
    expect(isAcademyCourseFilesLoaded(ALL_ACADEMY_COURSE_FILES, 'zh')).toBe(true);
  });
});
