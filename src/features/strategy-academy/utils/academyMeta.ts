import type { PokerVariant } from '@/shared/types/elo';
import {
  ALL_VARIANT_LESSON_SUMMARIES,
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from '../data/lessons/manifest';
import type { LevelSummary, LessonSummary } from '../types';

/**
 * 策略学院目录层查询（不含课程正文/小测/练习）。
 * 首页、store、成就检查、轨道/图谱、每日计划只依赖本模块；
 * 课程页 / 认证 / 速训需要完整数据时走 data/lessons/loaders 的按变体动态加载。
 */

const LEVELS_BY_VARIANT: Record<PokerVariant, LevelSummary[]> = {
  standard: STANDARD_LEVEL_SUMMARIES,
  'short-deck': SHORT_DECK_LEVEL_SUMMARIES,
  'heads-up': HEADS_UP_LEVEL_SUMMARIES,
};

const LEVEL_BY_ID = new Map(STANDARD_LEVEL_SUMMARIES.map((level) => [level.id ?? String(level.level), level]));
const LESSON_BY_ID = new Map(ALL_VARIANT_LESSON_SUMMARIES.map((lesson) => [lesson.id, lesson]));
const LEVEL_BY_LESSON_ID = new Map<string, LevelSummary>();
const LESSONS_BY_VARIANT = new Map<PokerVariant, LessonSummary[]>();

for (const level of STANDARD_LEVEL_SUMMARIES) {
  for (const lesson of level.lessons) LEVEL_BY_LESSON_ID.set(lesson.id, level);
}
for (const [variant, levels] of Object.entries(LEVELS_BY_VARIANT) as [
  PokerVariant,
  LevelSummary[],
][]) {
  const unique = new Map<string, LessonSummary>();
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (!unique.has(lesson.id)) unique.set(lesson.id, lesson);
      if (!LEVEL_BY_LESSON_ID.has(lesson.id)) LEVEL_BY_LESSON_ID.set(lesson.id, level);
    }
  }
  LESSONS_BY_VARIANT.set(variant, [...unique.values()]);
}

/** 标准 Level 序列（与旧 LEVELS 同口径，含 l4a / l4b） */
export const LEVEL_SUMMARIES: LevelSummary[] = STANDARD_LEVEL_SUMMARIES;

export function getLevelSummaries(): LevelSummary[] {
  return STANDARD_LEVEL_SUMMARIES;
}

export function getLevelSummariesByVariant(variant: PokerVariant): LevelSummary[] {
  return LEVELS_BY_VARIANT[variant];
}

/** 某变体的课程摘要（按 id 去重；变体 L4 在 l4a/l4b 两个条目下重复，此处只保留一份） */
export function getVariantLessonSummaries(variant: PokerVariant): LessonSummary[] {
  return LESSONS_BY_VARIANT.get(variant) ?? [];
}

/** 标准变体课程摘要（含本土课） */
export function getAllLessonSummaries(): LessonSummary[] {
  return LESSONS_BY_VARIANT.get('standard') ?? [];
}

export function findLevelSummaryById(levelId: string): LevelSummary | undefined {
  return LEVEL_BY_ID.get(levelId);
}

export function findLessonSummaryById(lessonId: string): LessonSummary | undefined {
  return LESSON_BY_ID.get(lessonId);
}

export function findLevelSummaryByLessonId(lessonId: string): LevelSummary | undefined {
  return LEVEL_BY_LESSON_ID.get(lessonId);
}

/** 同 level 数字可对应多个条目（L4 = l4a + l4b），返回标准序列中的全部条目 */
export function getLevelSummariesByNumber(level: number): LevelSummary[] {
  return STANDARD_LEVEL_SUMMARIES.filter((entry) => entry.level === level);
}

export function getLevelNumbers(): number[] {
  return [...new Set(STANDARD_LEVEL_SUMMARIES.map((entry) => entry.level))];
}

/** 总课程数（标准序列；变体课程另计） */
export function getTotalLessonCount(): number {
  return getAllLessonSummaries().length;
}

/** 某 level 数字的认证题池大小（合并 l4a/l4b 的全部课程 quiz） */
export function getQuizCountForLevel(level: number): number {
  return getLevelSummariesByNumber(level)
    .flatMap((entry) => entry.lessons)
    .reduce((sum, lesson) => sum + (lesson.quizCount ?? 0), 0);
}

/** 课程 id → 变体（变体课程前缀 l<n>sd- / l<n>hu-；本土课与 drill 归 standard） */
export function inferVariantFromLessonId(lessonId: string): PokerVariant {
  if (/^l\d+sd-/.test(lessonId)) return 'short-deck';
  if (/^l\d+hu-/.test(lessonId)) return 'heads-up';
  return 'standard';
}

/** 同变体序列内的下一课（目录层，替代旧 getAllLessons 全量推导） */
export function getNextLessonSummary(lessonId: string): LessonSummary | undefined {
  const sequence = getVariantLessonSummaries(inferVariantFromLessonId(lessonId));
  const index = sequence.findIndex((lesson) => lesson.id === lessonId);
  return index >= 0 ? sequence[index + 1] : undefined;
}

/** 课程在所属变体序列中的进度位置（目录层，供课程页进度条） */
export function getLessonProgressSummary(lessonId: string): {
  percent: number;
  current: number;
  total: number;
} {
  const sequence = getVariantLessonSummaries(inferVariantFromLessonId(lessonId));
  const index = sequence.findIndex((lesson) => lesson.id === lessonId);
  return {
    percent: sequence.length > 0 ? ((index + 1) / sequence.length) * 100 : 0,
    current: index + 1,
    total: sequence.length,
  };
}

/**
 * Level 条目解锁判定（摘要层单源）：
 * L1 需完成基础入门；声明 prerequisiteLevelIds 时全部前置 Level 完成；
 * 否则依赖标准序列中前一个条目全部完成。
 */
export function isLevelEntryUnlockedByCompleted(
  entry: LevelSummary,
  basicsCompleted: boolean,
  completedLessons: readonly string[],
): boolean {
  if (entry.level <= 1) return basicsCompleted;
  const completed = new Set(completedLessons);
  if (entry.prerequisiteLevelIds && entry.prerequisiteLevelIds.length > 0) {
    return entry.prerequisiteLevelIds.every((prerequisiteId) => {
      const prerequisite = LEVEL_BY_ID.get(prerequisiteId);
      return prerequisite ? prerequisite.lessons.every((lesson) => completed.has(lesson.id)) : false;
    });
  }
  const index = STANDARD_LEVEL_SUMMARIES.findIndex(
    (item) => (item.id ?? String(item.level)) === (entry.id ?? String(entry.level)),
  );
  if (index <= 0) return basicsCompleted;
  const previous = STANDARD_LEVEL_SUMMARIES[index - 1];
  return previous ? previous.lessons.every((lesson) => completed.has(lesson.id)) : false;
}
