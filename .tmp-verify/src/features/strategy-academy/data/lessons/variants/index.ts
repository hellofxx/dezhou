import type { Lesson } from '../../../types';
import type { PokerVariant } from '@/shared/types/elo';
import { standardLevels } from './standard';
import { SHORT_DECK_STRATEGY_COURSES } from './short-deck';
import { HEADS_UP_STRATEGY_COURSES } from './heads-up';

/**
 * 所有变体的 Lesson 集合（三变体平级：standard / short-deck / heads-up）。
 *
 * - standard：由标准变体 Level 的 lessons 浅拷贝派生（缺省 variant 视为 'standard'，
 *   与 shared/types/elo DEFAULT_VARIANT 语义一致；不改动原始数据，
 *   子对象引用不变，units 引用相等契约不受影响）。
 * - short-deck / heads-up：独立课程，显式声明 variant（覆盖 L3-L8）。
 *
 * 共享基础层契约：L1/L2 是「变体无关」的通用地基（规则、位置、加注大小、起手牌），
 * 由标准变体承担；short-deck / heads-up 变体经 {@link getLessonsByVariantAndLevel}
 * 在 L1/L2 自动回退引用共享基础层，避免内容重复，同时保证变体学习路径贯通 L1-L8。
 * 变体差异（牌型重排 / Ante 结构 / 位置动态）从 L3 起由变体专属课程覆盖。
 */
export const ALL_VARIANT_LESSONS: Lesson[] = [
  ...standardLevels.flatMap((level) =>
    level.lessons.map((lesson) => ({
      ...lesson,
      variant: (lesson.variant ?? 'standard') as PokerVariant,
    }))
  ),
  ...SHORT_DECK_STRATEGY_COURSES,
  ...HEADS_UP_STRATEGY_COURSES,
];

/** 共享基础层：标准变体的 L1/L2 课程（变体无关的通用地基） */
const SHARED_BASE_LESSONS: Lesson[] = standardLevels.flatMap((level) =>
  level.level === 1 || level.level === 2 ? level.lessons : []
);

/** 获取某变体的专属课程（standard 含全部；变体含 L3-L8） */
function getVariantOwnLessons(variant: PokerVariant): Lesson[] {
  return ALL_VARIANT_LESSONS.filter((l) => (l.variant ?? 'standard') === variant);
}

/**
 * 根据变体和 Level 过滤课程。
 * - standard：返回标准全部课程。
 * - short-deck / heads-up：返回变体专属课程（L3-L8）；当查询 L1/L2 时
 *   回退到共享基础层（标准 L1/L2），保证变体学习路径完整贯通。
 */
export function getLessonsByVariantAndLevel(
  variant: PokerVariant,
  level?: number
): Lesson[] {
  const own = getVariantOwnLessons(variant);
  if (variant === 'standard') {
    return level !== undefined ? own.filter((l) => l.level === level) : own;
  }
  // 变体：L1/L2 回退共享基础层，L3+ 用变体专属
  const ownFiltered = level !== undefined ? own.filter((l) => l.level === level) : own;
  if (level === 1 || level === 2) {
    const shared = SHARED_BASE_LESSONS.filter((l) => l.level === level);
    return [...shared, ...ownFiltered];
  }
  return ownFiltered;
}

/** 按变体分组的课程索引（key 固定为 PokerVariant；变体含共享基础层 + 专属课程） */
export const VARIANT_LESSON_INDEX: Record<PokerVariant, Lesson[]> = {
  standard: getLessonsByVariantAndLevel('standard'),
  'short-deck': getLessonsByVariantAndLevel('short-deck'),
  'heads-up': getLessonsByVariantAndLevel('heads-up'),
};
