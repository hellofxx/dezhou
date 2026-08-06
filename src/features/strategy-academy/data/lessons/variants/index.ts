import type { Lesson } from '../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { LEVELS } from '../../levels';
import { SHORT_DECK_STRATEGY_COURSES } from './short-deck';
import { HEADS_UP_STRATEGY_COURSES } from './heads-up';

/**
 * 所有变体的 Lesson 集合（P2 变体支持，Day 3-4）。
 *
 * - standard：由 LEVELS 现有课程浅拷贝派生（缺省 variant 视为 'standard'，
 *   与 shared/types/elo DEFAULT_VARIANT 语义一致；不改动 LEVELS 原始数据，
 *   子对象引用不变，units 引用相等契约不受影响）。
 * - short-deck / heads-up：独立骨架课程，显式声明 variant。
 *
 * 供变体索引查询、学习轨道编排与课程完整性守卫测试使用。
 */
export const ALL_VARIANT_LESSONS: Lesson[] = [
  ...LEVELS.flatMap((level) =>
    level.lessons.map((lesson) => ({
      ...lesson,
      variant: (lesson.variant ?? 'standard') as PokerVariant,
    }))
  ),
  ...SHORT_DECK_STRATEGY_COURSES,
  ...HEADS_UP_STRATEGY_COURSES,
];

/** 根据变体和 Level 过滤（standard 课程允许缺省 variant 声明） */
export function getLessonsByVariantAndLevel(
  variant: PokerVariant,
  level?: number
): Lesson[] {
  let lessons = ALL_VARIANT_LESSONS.filter(
    (l) => (l.variant ?? 'standard') === variant
  );
  if (level !== undefined) lessons = lessons.filter((l) => l.level === level);
  return lessons;
}

/** 按变体分组的课程索引（key 固定为 PokerVariant） */
export const VARIANT_LESSON_INDEX: Record<PokerVariant, Lesson[]> = {
  standard: getLessonsByVariantAndLevel('standard'),
  'short-deck': getLessonsByVariantAndLevel('short-deck'),
  'heads-up': getLessonsByVariantAndLevel('heads-up'),
};
