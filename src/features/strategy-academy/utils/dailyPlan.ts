import type { DailyPlan, AbilityAssessment } from '../types';
import { getAllLessons } from './courseProgress';

const ABILITY_KEYS: (keyof Omit<AbilityAssessment, 'lastUpdated'>)[] = [
  'rangeKnowledge',
  'oddsCalculation',
  'gtoUnderstanding',
  'positionalPlay',
  'emotionalControl',
];

// 能力维度 → 相关课程 ID 映射
// P4 修复（4.2-P2-1）：修正所有引用不存在 lesson ID 的问题，对齐 courses.ts 实际 ID
const ABILITY_LESSON_MAP: Record<string, string[]> = {
  rangeKnowledge: ['l1-hand-selection', 'l2-raise-sizing', 'l2-3bet-basics', 'l2-4bet-strategy', 'l2-bb-defense'],
  oddsCalculation: ['l3-draws', 'l3-bet-sizing', 'l3-multistreet'],
  gtoUnderstanding: ['l3-cbet', 'l3-bluffing', 'l3-checkraise', 'l4-range-thinking'],
  positionalPlay: ['l1-position', 'l3-float-probe', 'l2-squeeze'],
  emotionalControl: ['l5-tilt', 'l1-bankroll'],
};

/**
 * 生成每日训练计划（学院焦点版）
 *
 * P4 修复（4.3-P1-1）：明确职责区分
 * 本函数返回单一焦点计划（一个 focusArea + 一门新课程 + 复习 + 练习），
 * 用于 AcademyHome 的 DailyPlanCard。
 *
 * 与 progress/utils/dailyTrainingPlan.ts 的 generateDailyPlan 区别：
 *   - 本函数：学院内焦点计划，DailyPlan 类型，推荐 1 门新课 + 复习 + 练习
 *   - 另一函数：跨模块推荐列表，DailyRecommendation[] 类型，覆盖 range/odds/gto 多模块
 * 两者服务于不同 UI 场景，非重复实现。
 */
export function generateDailyPlan(
  completedLessons: string[],
  abilityAssessment: AbilityAssessment,
  reviewQueue: string[]
): DailyPlan {
  // 1. 找出最薄弱的能力维度
  const weakestArea = findWeakestArea(abilityAssessment);

  // 2. 选择需要复习的课程（最多2个）
  const reviewLessons = reviewQueue.slice(0, 2);

  // 3. 推荐下一门新课程
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

/** 找出五维评分中最低的维度 */
function findWeakestArea(assessment: AbilityAssessment): keyof AbilityAssessment | null {
  let weakest: keyof Omit<AbilityAssessment, 'lastUpdated'> | null = null;
  let lowestScore = Infinity;

  for (const key of ABILITY_KEYS) {
    const score = assessment[key];
    if (typeof score === 'number' && score < lowestScore) {
      lowestScore = score;
      weakest = key;
    }
  }

  return weakest;
}

/** 根据弱点推荐下一门未完成的新课程 */
function getNextRecommendedLesson(
  completedLessons: string[],
  weakestArea: keyof AbilityAssessment | null
): string | null {
  const allLessons = getAllLessons();

  // 优先推荐与弱点相关的未完成课程
  if (weakestArea && weakestArea !== 'lastUpdated') {
    const relatedIds = ABILITY_LESSON_MAP[weakestArea] ?? [];
    for (const id of relatedIds) {
      if (!completedLessons.includes(id)) {
        // 确认该课程存在
        const exists = allLessons.some((l) => l.id === id);
        if (exists) return id;
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

/** 获取与弱点相关且有 practice 的课程ID */
function getPracticeSpotsForWeakArea(
  weakestArea: keyof AbilityAssessment | null,
  completedLessons: string[]
): string[] {
  const allLessons = getAllLessons();
  const spots: string[] = [];

  // 获取相关课程 ID
  const relatedIds = weakestArea && weakestArea !== 'lastUpdated'
    ? (ABILITY_LESSON_MAP[weakestArea] ?? [])
    : [];

  // 优先从弱点相关的已完成课程中选有 practice 的
  for (const lesson of allLessons) {
    if (lesson.practice && lesson.practice.questions.length > 0) {
      if (relatedIds.includes(lesson.id) && completedLessons.includes(lesson.id)) {
        spots.push(lesson.id);
      }
    }
    if (spots.length >= 3) break;
  }

  // 不够则从所有已完成课程中补充
  if (spots.length < 2) {
    for (const lesson of allLessons) {
      if (
        lesson.practice &&
        lesson.practice.questions.length > 0 &&
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

  if (minutes <= 10) return '5-10 分钟';
  if (minutes <= 20) return '15-20 分钟';
  if (minutes <= 30) return '20-30 分钟';
  return '30+ 分钟';
}

/** 判断今天是否已生成计划（同一天内不重复生成） */
export function isDailyPlanFresh(generatedAt: number | undefined): boolean {
  if (!generatedAt) return false;
  const today = new Date().toDateString();
  const generated = new Date(generatedAt).toDateString();
  return today === generated;
}

/** 获取能力维度中文名 */
export function getAbilityLabel(key: keyof AbilityAssessment | null): string {
  const labels: Record<string, string> = {
    rangeKnowledge: '范围知识',
    oddsCalculation: '赔率计算',
    gtoUnderstanding: 'GTO 理解',
    positionalPlay: '位置打法',
    emotionalControl: '情绪控制',
  };
  return key ? (labels[key] ?? '综合能力') : '综合能力';
}
