/**
 * P1-3.3: 每日训练题目组成逻辑
 *
 * 将"今日 SRS 复习队列"与"新题题库"按比例混合，让用户的每日训练既覆盖
 * 即将遗忘的旧知识点（间隔重复），又持续引入新内容。
 *
 * 混合比例根据用户最近正确率动态调整：
 *   - 默认 30% SRS 复习 + 70% 新题
 *   - 正确率 < 0.6 → 复习比例提升到 50%（用户在挣扎，需要多复习巩固）
 *   - 正确率 < 0.4 → 复习比例提升到 70%（用户严重薄弱，以复习为主）
 *   - 今日复习队列为空 → 全部用新题
 *
 * 返回值说明：
 *   - questions: 从 newQuestions 中切出的"新题"片段（长度 = newCount）
 *   - reviewCount: 应该从 todayReviewItems 中取多少道复习题
 *   - newCount: 新题数量（= questions.length）
 *
 * 调用方负责：
 *   1. 从 todayReviewItems 中取前 reviewCount 道题作为复习题
 *   2. 将复习题 + questions 拼接为最终的训练题目流
 *   3. 复习题与新题的顺序可由调用方决定（建议交错排列）
 */

import type { ReviewItem } from './spacedRepetition';
import { getTodayString } from './spacedRepetition';

/** 默认复习占比 */
const DEFAULT_REVIEW_RATIO = 0.3;
/** 正确率 < 0.6 时的复习占比 */
const LOW_ACCURACY_REVIEW_RATIO = 0.5;
/** 正确率 < 0.4 时的复习占比 */
const VERY_LOW_ACCURACY_REVIEW_RATIO = 0.7;

/** 正确率阈值 */
const LOW_ACCURACY_THRESHOLD = 0.6;
const VERY_LOW_ACCURACY_THRESHOLD = 0.4;

export interface DailyMixResult<T> {
  /** 从 newQuestions 中切出的新题片段（长度 = newCount） */
  questions: T[];
  /** 应从 todayReviewItems 中取的复习题数量 */
  reviewCount: number;
  /** 新题数量（= questions.length） */
  newCount: number;
}

/**
 * 根据用户正确率决定复习占比
 * @param userAccuracy 0-1
 */
export function getReviewRatio(userAccuracy: number): number {
  if (userAccuracy < VERY_LOW_ACCURACY_THRESHOLD) return VERY_LOW_ACCURACY_REVIEW_RATIO;
  if (userAccuracy < LOW_ACCURACY_THRESHOLD) return LOW_ACCURACY_REVIEW_RATIO;
  return DEFAULT_REVIEW_RATIO;
}

/**
 * 生成每日训练题目组成
 *
 * @param newQuestions 新题题库
 * @param reviewItems 全部 SRS 复习项（函数内部会过滤出今日待复习项）
 * @param totalCount 总题数
 * @param userAccuracy 用户最近正确率（0-1），正确率低则增加复习比例
 * @returns 混合后的题目列表（仅含新题片段）+ 复习题数量
 */
export function composeDailyMix<T extends { id: string }>(
  newQuestions: T[],
  reviewItems: ReviewItem[],
  totalCount: number,
  userAccuracy: number
): DailyMixResult<T> {
  // 1. 过滤出今日待复习项
  const today = getTodayString();
  const dueReviewItems = reviewItems.filter((r) => r.nextReviewDate <= today);

  // 2. 复习队列为空 → 全部用新题
  if (dueReviewItems.length === 0) {
    const newCount = Math.min(totalCount, newQuestions.length);
    return {
      questions: newQuestions.slice(0, newCount),
      reviewCount: 0,
      newCount,
    };
  }

  // 3. 根据正确率决定复习占比
  const reviewRatio = getReviewRatio(userAccuracy);

  // 4. 计算复习题数量（不超过今日待复习项总数）
  const reviewCount = Math.min(
    Math.round(totalCount * reviewRatio),
    dueReviewItems.length
  );

  // 5. 剩余位置用新题填充（不超过新题题库总数）
  const newCount = Math.min(totalCount - reviewCount, newQuestions.length);

  return {
    questions: newQuestions.slice(0, newCount),
    reviewCount,
    newCount,
  };
}
