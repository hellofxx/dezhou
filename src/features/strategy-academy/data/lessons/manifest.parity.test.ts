import { describe, expect, it } from 'vitest';
import { LEVELS } from '../courses';
import { VARIANT_LESSON_INDEX } from './variants';
import {
  ALL_VARIANT_LESSON_SUMMARIES,
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from './manifest';
import {
  getQuizCountForLevel,
  getVariantLessonSummaries,
  inferVariantFromLessonId,
} from '../../utils/academyMeta';
import type { LevelSummary, Lesson, LessonSummary } from '../../types';

/**
 * 摘要 manifest ↔ 完整课程数据一致性守卫。
 * 首页/store/成就检查只读 manifest；它一旦落后于 lessons/variants/*，
 * 目录、解锁、进度与认证题量会静默错位。失败时运行 `pnpm academy:manifest`。
 */

function projectLesson(lesson: Lesson): LessonSummary {
  return {
    id: lesson.id,
    level: lesson.level,
    order: lesson.order,
    title: lesson.title,
    subtitle: lesson.subtitle,
    duration: lesson.duration,
    ...(lesson.type ? { type: lesson.type } : {}),
    variant: lesson.variant ?? 'standard',
    ...(lesson.prerequisites ? { prerequisites: lesson.prerequisites } : {}),
    hasPractice: Boolean(lesson.practice && lesson.practice.questions.length > 0),
    quizCount: lesson.quiz?.length ?? 0,
  };
}

function projectLevel(level: LevelSummary, lessons: Lesson[]): LevelSummary {
  return {
    ...(level.id ? { id: level.id } : {}),
    level: level.level,
    title: level.title,
    description: level.description,
    icon: level.icon,
    unlockRequirement: level.unlockRequirement,
    ...(level.prerequisiteLevelIds ? { prerequisiteLevelIds: level.prerequisiteLevelIds } : {}),
    lessons: lessons.map(projectLesson),
  };
}

function expectedVariantLevels(variant: 'short-deck' | 'heads-up'): LevelSummary[] {
  const byLevel = new Map<number, Lesson[]>();
  for (const lesson of VARIANT_LESSON_INDEX[variant]) {
    const list = byLevel.get(lesson.level) ?? [];
    list.push(lesson);
    byLevel.set(lesson.level, list);
  }
  return LEVELS.filter((level) => byLevel.has(level.level)).map((level) =>
    projectLevel(level, byLevel.get(level.level) ?? []),
  );
}

describe('academy manifest 与完整课程数据一致', () => {
  it('standard：Level/课程目录字段逐项一致（落后时运行 pnpm academy:manifest）', () => {
    expect(STANDARD_LEVEL_SUMMARIES).toEqual(
      LEVELS.map((level) => projectLevel(level, level.lessons)),
    );
  });

  it('short-deck / heads-up：按标准 Level 元数据分组后逐项一致', () => {
    expect(SHORT_DECK_LEVEL_SUMMARIES).toEqual(expectedVariantLevels('short-deck'));
    expect(HEADS_UP_LEVEL_SUMMARIES).toEqual(expectedVariantLevels('heads-up'));
  });

  it('变体课程摘要去重后与 VARIANT_LESSON_INDEX 的课程集合一致', () => {
    for (const variant of ['standard', 'short-deck', 'heads-up'] as const) {
      expect(getVariantLessonSummaries(variant).map((lesson) => lesson.id)).toEqual(
        VARIANT_LESSON_INDEX[variant].map((lesson) => lesson.id),
      );
    }
  });

  it('课程 id → 变体推断与数据一致（课程页按变体懒载的前置契约）', () => {
    for (const lesson of ALL_VARIANT_LESSON_SUMMARIES) {
      expect(inferVariantFromLessonId(lesson.id), lesson.id).toBe(lesson.variant ?? 'standard');
    }
  });

  it('认证题池大小与完整数据逐级一致', () => {
    for (let level = 1; level <= 8; level += 1) {
      const expected = LEVELS.filter((entry) => entry.level === level)
        .flatMap((entry) => entry.lessons)
        .reduce((sum, lesson) => sum + lesson.quiz.length, 0);
      expect(getQuizCountForLevel(level)).toBe(expected);
    }
  });
});
