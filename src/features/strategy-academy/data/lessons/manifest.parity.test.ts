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

/**
 * 与 `scripts/generate-academy-manifest.mjs` 的 VARIANT_LEVEL_OVERRIDES 保持同步：
 * 变体按数字 level 去重，L4 合并为一个条目（id 保留 l4b 以匹配标准 L8 前置）。
 */
const VARIANT_LEVEL_OVERRIDES: Record<number, Partial<LevelSummary>> = {
  4: {
    id: 'l4b',
    title: '进阶思维 · 范围、EV 与 GTO',
    description: '范围、EV 与 GTO 博弈的整合',
    icon: '🧠',
    unlockRequirement: '完成 Level 3 所有课程',
  },
};

function expectedVariantLevels(variant: 'short-deck' | 'heads-up'): LevelSummary[] {
  const byLevel = new Map<number, Lesson[]>();
  for (const lesson of VARIANT_LESSON_INDEX[variant]) {
    const list = byLevel.get(lesson.level) ?? [];
    list.push(lesson);
    byLevel.set(lesson.level, list);
  }
  const baseByLevel = new Map<number, LevelSummary>();
  for (const level of LEVELS) {
    if (byLevel.has(level.level) && !baseByLevel.has(level.level)) {
      baseByLevel.set(level.level, level);
    }
  }
  return [...byLevel.entries()]
    .toSorted(([a], [b]) => a - b)
    .map(([levelNumber, lessons]) =>
      projectLevel(
        { ...baseByLevel.get(levelNumber)!, ...VARIANT_LEVEL_OVERRIDES[levelNumber] },
        lessons,
      ),
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

  it('变体 L4 只出现一次，且完整包含该变体全部 level:4 课程', () => {
    for (const variant of ['short-deck', 'heads-up'] as const) {
      const levels = variant === 'short-deck' ? SHORT_DECK_LEVEL_SUMMARIES : HEADS_UP_LEVEL_SUMMARIES;
      const l4 = levels.filter((level) => level.level === 4);
      expect(l4, `${variant} L4 条目数`).toHaveLength(1);
      expect(l4[0]?.id).toBe('l4b');
      expect(l4[0]?.lessons.map((lesson) => lesson.id)).toEqual(
        VARIANT_LESSON_INDEX[variant]
          .filter((lesson) => lesson.level === 4)
          .map((lesson) => lesson.id),
      );
    }
  });

  it('变体每个 Level 的课时 order 严格递增且不重复（L4 合并后不得回到 1,2,3,1,2）', () => {
    for (const variant of ['short-deck', 'heads-up'] as const) {
      const ordersByLevel = new Map<number, number[]>();
      for (const lesson of VARIANT_LESSON_INDEX[variant]) {
        const orders = ordersByLevel.get(lesson.level) ?? [];
        orders.push(lesson.order);
        ordersByLevel.set(lesson.level, orders);
      }
      for (const [level, orders] of ordersByLevel) {
        expect(
          new Set(orders).size,
          `${variant} L${level} order 重复：${orders.join(',')}`,
        ).toBe(orders.length);
        for (let i = 1; i < orders.length; i += 1) {
          expect(
            orders[i]!,
            `${variant} L${level} order 非递增：${orders.join(',')}`,
          ).toBeGreaterThan(orders[i - 1]!);
        }
      }
    }
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
