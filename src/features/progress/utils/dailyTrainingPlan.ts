/**
 * 每日训练推荐算法
 * 根据用户数据生成个性化训练计划
 */

import type { ReviewItem } from './spacedRepetition';
import { getTodayReviewItems } from './spacedRepetition';
import type { TrainingRecord } from '../types';
import type { AcademyProgress } from '@/features/strategy-academy/types';
import { LEVELS } from '@/features/strategy-academy/data/courses';

export interface DailyRecommendation {
  id: string;
  type: 'academy-lesson' | 'range-quiz' | 'pot-odds-quiz' | 'gto-practice' | 'review';
  /** i18n key（渲染端 t(title, titleParams) 解析），不再直接存储展示文案 */
  title: string;
  titleParams?: Record<string, string | number>;
  /** i18n key（渲染端 t(description, descParams) 解析） */
  description: string;
  descParams?: Record<string, string | number>;
  route: string;                 // 跳转路由
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;         // "10 min"
  /** 推荐理由语义 key（渲染端 t(`dashboard.dataPlan.reason.${reason}`)） */
  reason: string;
}

// 模块路由映射
const MODULE_ROUTES: Record<string, string> = {
  'range-trainer': '/range-trainer',
  'pot-odds': '/pot-odds',
  'gto-simulator': '/gto-simulator',
};

/**
 * 计算各模块正确率
 */
function calculateModuleAccuracy(records: TrainingRecord[]): Map<string, number> {
  const moduleStats = new Map<string, { total: number; correct: number }>();

  for (const record of records) {
    const stats = moduleStats.get(record.module) || { total: 0, correct: 0 };
    stats.total += record.result.totalQuestions;
    stats.correct += record.result.correctAnswers;
    moduleStats.set(record.module, stats);
  }

  const accuracyMap = new Map<string, number>();
  for (const [module, stats] of moduleStats) {
    if (stats.total > 0) {
      accuracyMap.set(module, stats.correct / stats.total);
    }
  }

  return accuracyMap;
}

/**
 * 找到下一个未完成的课程
 */
function findNextLesson(academyProgress: AcademyProgress): { id: string; title: string; level: number } | null {
  const { completedLessons } = academyProgress;

  for (const level of LEVELS) {
    for (const lesson of level.lessons) {
      if (!completedLessons.includes(lesson.id)) {
        return { id: lesson.id, title: lesson.title, level: level.level };
      }
    }
  }

  return null;
}

/**
 * 获取最薄弱的模块
 */
function getWeakestModule(accuracyMap: Map<string, number>): string | null {
  let weakest: string | null = null;
  let lowestAccuracy = 1;

  // 只考虑可训练的模块
  const trainableModules = ['range-trainer', 'pot-odds'];

  for (const module of trainableModules) {
    const accuracy = accuracyMap.get(module);
    // 如果没有记录或正确率低
    if (accuracy === undefined) {
      return module; // 从未练习过的模块优先
    }
    if (accuracy < lowestAccuracy) {
      lowestAccuracy = accuracy;
      weakest = module;
    }
  }

  // 只有正确率低于 80% 才推荐
  return lowestAccuracy < 0.8 ? weakest : null;
}

/**
 * 根据用户数据生成今日推荐（3-5项）
 */
export function generateCrossModuleDailyPlan(
  academyProgress: AcademyProgress,
  trainingRecords: TrainingRecord[],
  reviewItems: ReviewItem[],
  streak: number
): DailyRecommendation[] {
  const recommendations: DailyRecommendation[] = [];
  const usedTypes = new Set<string>();

  // 1. 优先：今日待复习
  const todayReviews = getTodayReviewItems(reviewItems);
  if (todayReviews.length > 0) {
    const firstItems = todayReviews.slice(0, 3).map((item) => item.label).join('、');
    recommendations.push({
      id: 'review-today',
      type: 'review',
      title: 'dashboard.dataPlan.titleReview',
      titleParams: { count: todayReviews.length },
      description: todayReviews.length > 3
        ? 'dashboard.dataPlan.descReviewMore'
        : 'dashboard.dataPlan.descReview',
      descParams: todayReviews.length > 3
        ? { items: firstItems, count: todayReviews.length }
        : { items: firstItems },
      route: '/academy',
      priority: 'high',
      estimatedTime: `${Math.min(todayReviews.length * 3, 15)} min`,
      reason: 'review',
    });
    usedTypes.add('review');
  }

  // 2. 学院进度 — 推荐下一课
  const nextLesson = findNextLesson(academyProgress);
  if (nextLesson) {
    recommendations.push({
      id: `lesson-${nextLesson.id}`,
      type: 'academy-lesson',
      // title 直接传 i18n key（academy.lessonTitle.<id>），渲染端 t() 解析；
      // 课程数据层 title 字段保留兼容旧消费方。
      title: `academy.lessonTitle.${nextLesson.id}`,
      titleParams: { title: nextLesson.title },
      description: 'dashboard.dataPlan.descAcademyLesson',
      descParams: { level: nextLesson.level },
      route: `/academy/lesson/${nextLesson.id}`,
      priority: recommendations.length === 0 ? 'high' : 'medium',
      estimatedTime: '15 min',
      reason: 'nextLesson',
    });
    usedTypes.add('academy-lesson');
  }

  // 3. 薄弱环节 — 推荐正确率最低的模块
  const accuracyMap = calculateModuleAccuracy(trainingRecords);
  const weakestModule = getWeakestModule(accuracyMap);

  if (weakestModule && !usedTypes.has('range-quiz') && !usedTypes.has('pot-odds-quiz')) {
    const accuracy = accuracyMap.get(weakestModule);
    const type = weakestModule === 'range-trainer' ? 'range-quiz' : 'pot-odds-quiz';
    const title = weakestModule === 'range-trainer'
      ? 'dashboard.dataPlan.titleWeakRange'
      : 'dashboard.dataPlan.titleWeakOdds';

    recommendations.push({
      id: `weak-${weakestModule}`,
      type,
      title,
      description: accuracy !== undefined
        ? 'dashboard.dataPlan.descWeakAccuracy'
        : 'dashboard.dataPlan.descWeakNone',
      descParams: accuracy !== undefined ? { accuracy: Math.round(accuracy * 100) } : undefined,
      route: MODULE_ROUTES[weakestModule] || '/range-trainer',
      priority: 'medium',
      estimatedTime: '10 min',
      reason: 'weakSpot',
    });
    usedTypes.add(type);
  }

  // 4. 多样性 — 确保推荐覆盖不同模块
  const availableModules = [
    { module: 'range-trainer', type: 'range-quiz' as const, title: 'dashboard.dataPlan.titlePracticeRange', route: '/range-trainer', time: '10 min' },
    { module: 'pot-odds', type: 'pot-odds-quiz' as const, title: 'dashboard.dataPlan.titlePracticeOdds', route: '/pot-odds', time: '10 min' },
  ];

  for (const item of availableModules) {
    if (recommendations.length >= 4) break;
    if (!usedTypes.has(item.type)) {
      const accuracy = accuracyMap.get(item.module);
      recommendations.push({
        id: `practice-${item.module}`,
        type: item.type,
        title: item.title,
        description: accuracy !== undefined
          ? 'dashboard.dataPlan.descPracticeAccuracy'
          : 'dashboard.dataPlan.descPracticeNone',
        descParams: accuracy !== undefined ? { accuracy: Math.round(accuracy * 100) } : undefined,
        route: item.route,
        priority: 'low',
        estimatedTime: item.time,
        reason: 'dailyPractice',
      });
      usedTypes.add(item.type);
    }
  }

  // 5. 连续天数奖励 — 连续天数高时推荐挑战更高难度
  if (streak >= 7 && recommendations.length < 5) {
    recommendations.push({
      id: 'streak-challenge',
      type: 'gto-practice',
      title: 'dashboard.dataPlan.titleGtoChallenge',
      description: 'dashboard.dataPlan.descStreakChallenge',
      descParams: { streak },
      route: '/gto-simulator',
      priority: 'low',
      estimatedTime: '20 min',
      reason: 'streakReward',
    });
  }

  // 按优先级排序
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);
}

/**
 * 获取分类标签颜色（reason 为语义 key：review/nextLesson/weakSpot/streakReward/dailyPractice）
 */
export function getReasonColor(reason: string): string {
  switch (reason) {
    case 'review':
      return 'text-[var(--poker-terra-bright)] bg-[var(--poker-terra)]/15';
    case 'nextLesson':
      return 'text-[var(--poker-info)] bg-[var(--poker-info-bg)]';
    case 'weakSpot':
      return 'text-[var(--poker-danger)] bg-[var(--poker-danger-bg)]';
    case 'streakReward':
      return 'text-[var(--brass-bright)] bg-[var(--poker-warning-bg)]';
    default:
      return 'text-[var(--ivory-muted)] bg-[var(--walnut-raised)]/50';
  }
}

/**
 * 获取类型图标
 */
export function getTypeIcon(type: DailyRecommendation['type']): string {
  switch (type) {
    case 'academy-lesson':
      return '📚';
    case 'range-quiz':
      return '🎯';
    case 'pot-odds-quiz':
      return '🧮';
    case 'gto-practice':
      return '🤖';
    case 'review':
      return '🔄';
    default:
      return '📋';
  }
}

/**
 * 获取优先级颜色
 */
export function getPriorityColor(priority: DailyRecommendation['priority']): string {
  // P2-C: 使用 CSS 变量替代 Tailwind 霓虹类名，遵循反霓虹硬约束
  switch (priority) {
    case 'high':
      return 'border-l-[var(--poker-success)]';
    case 'medium':
      return 'border-l-[var(--brass)]';
    case 'low':
      return 'border-l-[var(--ivory-dim)]';
    default:
      return 'border-l-[var(--ivory-dim)]';
  }
}
