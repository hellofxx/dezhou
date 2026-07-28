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
  title: string;
  description: string;
  route: string;                 // 跳转路由
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;         // "10 min"
  reason: string;                // 推荐理由
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
export function generateDailyPlan(
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
    recommendations.push({
      id: 'review-today',
      type: 'review',
      title: `复习 ${todayReviews.length} 个知识点`,
      description: todayReviews.slice(0, 3).map((item) => item.label).join('、') +
        (todayReviews.length > 3 ? ` 等${todayReviews.length}项` : ''),
      route: '/academy',
      priority: 'high',
      estimatedTime: `${Math.min(todayReviews.length * 3, 15)} min`,
      reason: '待复习',
    });
    usedTypes.add('review');
  }

  // 2. 学院进度 — 推荐下一课
  const nextLesson = findNextLesson(academyProgress);
  if (nextLesson) {
    recommendations.push({
      id: `lesson-${nextLesson.id}`,
      type: 'academy-lesson',
      title: nextLesson.title,
      description: `第 ${nextLesson.level} 级课程`,
      route: `/academy/lesson/${nextLesson.id}`,
      priority: recommendations.length === 0 ? 'high' : 'medium',
      estimatedTime: '15 min',
      reason: '下一课',
    });
    usedTypes.add('academy-lesson');
  }

  // 3. 薄弱环节 — 推荐正确率最低的模块
  const accuracyMap = calculateModuleAccuracy(trainingRecords);
  const weakestModule = getWeakestModule(accuracyMap);

  if (weakestModule && !usedTypes.has('range-quiz') && !usedTypes.has('pot-odds-quiz')) {
    const accuracy = accuracyMap.get(weakestModule);
    const type = weakestModule === 'range-trainer' ? 'range-quiz' : 'pot-odds-quiz';
    const title = weakestModule === 'range-trainer' ? '手牌范围练习' : '赔率计算练习';

    recommendations.push({
      id: `weak-${weakestModule}`,
      type,
      title,
      description: accuracy !== undefined
        ? `当前正确率 ${(accuracy * 100).toFixed(0)}%，需要加强`
        : '尚未练习过，建议尝试',
      route: MODULE_ROUTES[weakestModule] || '/range-trainer',
      priority: 'medium',
      estimatedTime: '10 min',
      reason: '薄弱环节',
    });
    usedTypes.add(type);
  }

  // 4. 多样性 — 确保推荐覆盖不同模块
  const availableModules = [
    { module: 'range-trainer', type: 'range-quiz' as const, title: '手牌范围训练', route: '/range-trainer', time: '10 min' },
    { module: 'pot-odds', type: 'pot-odds-quiz' as const, title: '赔率计算训练', route: '/pot-odds', time: '10 min' },
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
          ? `当前正确率 ${(accuracy * 100).toFixed(0)}%`
          : '保持手感',
        route: item.route,
        priority: 'low',
        estimatedTime: item.time,
        reason: '日常练习',
      });
      usedTypes.add(item.type);
    }
  }

  // 5. 连续天数奖励 — 连续天数高时推荐挑战更高难度
  if (streak >= 7 && recommendations.length < 5) {
    recommendations.push({
      id: 'streak-challenge',
      type: 'gto-practice',
      title: '高难度 GTO 挑战',
      description: `连续训练 ${streak} 天！挑战更高难度`,
      route: '/gto-simulator',
      priority: 'low',
      estimatedTime: '20 min',
      reason: '连续奖励',
    });
  }

  // 按优先级排序
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return recommendations
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    .slice(0, 5);
}

/**
 * 获取分类标签颜色
 */
export function getReasonColor(reason: string): string {
  switch (reason) {
    case '待复习':
      return 'text-orange-400 bg-orange-400/10';
    case '下一课':
      return 'text-blue-400 bg-blue-400/10';
    case '薄弱环节':
      return 'text-red-400 bg-red-400/10';
    case '连续奖励':
      return 'text-yellow-400 bg-yellow-400/10';
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
  switch (priority) {
    case 'high':
      return 'border-l-green-500';
    case 'medium':
      return 'border-l-yellow-500';
    case 'low':
      return 'border-l-gray-500';
    default:
      return 'border-l-gray-500';
  }
}
