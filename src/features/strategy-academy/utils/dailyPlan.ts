import type { DailyPlan } from '../types';
import type { EloDimension, EloRating } from '@/shared/types/elo';
import { getAllLessonSummaries } from './academyMeta';
import { getLessonMeta } from '../data/lessonMeta';

/** ELO 五维（弱点判定的遍历源，顺序即同分 tie-break 顺序） */
const ELO_DIMENSIONS: readonly EloDimension[] = ['preflop', 'postflop', 'math', 'handReading', 'mental'];

/**
 * 生成每日训练计划（学院焦点版）
 *
 * P4 修复（4.3-P1-1）：明确职责区分
 * 本函数返回单一焦点计划（一个 focusArea + 一门新课程 + 复习 + 练习），
 * 用于 AcademyHome 的 DailyPlanCard。
 *
 * 与 progress/utils/dailyTrainingPlan.ts 的 generateCrossModuleDailyPlan 区别：
 *   - 本函数：学院内焦点计划，DailyPlan 类型，推荐 1 门新课 + 复习 + 练习
 *   - 另一函数：跨模块推荐列表，DailyRecommendation[] 类型，覆盖 range/odds/gto 多模块
 * 两者服务于不同 UI 场景，非重复实现（命名已区分，禁止混用）。
 *
 * P0 口径：焦点维度 = 标准变体 ELO 五维中最低的一维（focusArea: EloDimension），
 * 新课/练习按 lessonMeta 的 eloDimension 命中该维度（未登记课时回退 postflop）。
 */
export function generateDailyPlan(
  completedLessons: string[],
  elo: EloRating,
  reviewQueue: string[]
): DailyPlan {
  // 1. 找出最薄弱的 ELO 维度（同分按 ELO_DIMENSIONS 顺序取前者）
  const weakestArea = findWeakestDimension(elo);

  // 2. 选择需要复习的课程（最多2个）
  const reviewLessons = reviewQueue.slice(0, 2);

  // 3. 推荐与弱点维度匹配的下一门新课程（无匹配时退回顺序推荐）
  const newLesson = getNextRecommendedLesson(completedLessons, weakestArea);

  // 4. 基于弱点推荐定向练习（有 practice 的课程）
  const practiceSpots = getPracticeSpotsForWeakArea(weakestArea, completedLessons);

  // 5. 估算用时
  const estimatedTime = calculateEstimatedTime(reviewLessons.length, !!newLesson, practiceSpots.length);

  return {
    reviewLessons,
    newLesson,
    practiceSpots,
    estimatedTime,
    focusArea: weakestArea,
    generatedAt: Date.now(),
  };
}

/** 找出 ELO 五维中分数最低的维度（全部为默认值时取首维，行为稳定可测） */
function findWeakestDimension(elo: EloRating): EloDimension {
  let weakest: EloDimension = ELO_DIMENSIONS[0]!;
  let lowestScore = Infinity;

  for (const dimension of ELO_DIMENSIONS) {
    const score = elo[dimension];
    if (typeof score === 'number' && score < lowestScore) {
      lowestScore = score;
      weakest = dimension;
    }
  }

  return weakest;
}

/** 根据弱点维度推荐下一门未完成的新课程 */
function getNextRecommendedLesson(
  completedLessons: string[],
  weakestArea: EloDimension | null
): string | null {
  const allLessons = getAllLessonSummaries();

  // 优先推荐命中弱点维度的未完成课程（维度以 lessonMeta 为准）
  if (weakestArea) {
    for (const lesson of allLessons) {
      if (completedLessons.includes(lesson.id)) continue;
      if (getLessonMeta(lesson.id).eloDimension === weakestArea) {
        return lesson.id;
      }
    }
  }

  // 否则推荐下一个按顺序未完成的课程
  for (const lesson of allLessons) {
    if (!completedLessons.includes(lesson.id)) {
      return lesson.id;
    }
  }

  return null;
}

/** 获取与弱点维度相关且有 practice 的已学课程ID */
function getPracticeSpotsForWeakArea(
  weakestArea: EloDimension | null,
  completedLessons: string[]
): string[] {
  const allLessons = getAllLessonSummaries();
  const spots: string[] = [];

  // 优先从命中弱点维度的已完成课程中选有 practice 的
  if (weakestArea) {
    for (const lesson of allLessons) {
      if (spots.length >= 3) break;
      if (!lesson.hasPractice || !completedLessons.includes(lesson.id)) continue;
      if (getLessonMeta(lesson.id).eloDimension === weakestArea) {
        spots.push(lesson.id);
      }
    }
  }

  // 不够则从所有已完成课程中补充
  if (spots.length < 2) {
    for (const lesson of allLessons) {
      if (
        lesson.hasPractice &&
        completedLessons.includes(lesson.id) &&
        !spots.includes(lesson.id)
      ) {
        spots.push(lesson.id);
        if (spots.length >= 3) break;
      }
    }
  }

  return spots;
}

/** 估算每日训练用时 */
function calculateEstimatedTime(
  reviewCount: number,
  hasNewLesson: boolean,
  practiceCount: number
): string {
  let minutes = 0;
  minutes += reviewCount * 5;    // 每个复习课程约5分钟
  minutes += hasNewLesson ? 10 : 0; // 新课程约10分钟
  minutes += practiceCount * 3;  // 每组练习约3分钟

  if (minutes <= 10) return '5-10';
  if (minutes <= 20) return '15-20';
  if (minutes <= 30) return '20-30';
  return '30+';
}

/** 判断今天是否已生成计划（同一天内不重复生成） */
export function isDailyPlanFresh(generatedAt: number | undefined): boolean {
  if (!generatedAt) return false;
  const today = new Date().toDateString();
  const generated = new Date(generatedAt).toDateString();
  return today === generated;
}
