/**
 * P1E-05（专批 B）：QuickDrill 复习题 SRS 回写（纯函数）。
 *
 * 背景：快速训练混入的 `review-*` 复习题此前"只出题不闭环"——答完后对应
 * ReviewItem 的 nextReviewDate 不推进，SRS 实质失效。本模块基于 progress
 * 既有公开 API（processReview 纯函数 + updateReviewItem action）建立回写闭环：
 * QuickDrill 完成时按逐题作答明细计算推进后的 ReviewItem 列表，逐项回写。
 *
 * quality 映射（对齐 TDD「SRS 间隔重复」既有口径）：
 *   答对 + 用时 < 5 秒 → 5；答对 → 4；答错 → 1
 * 间隔推进由 processReview（SM-2 简化版，1→3→7→14→30，答错重置 1 天）负责。
 */
import type { ReviewItem } from '@/features/progress/utils/spacedRepetition';
import { processReview } from '@/features/progress/utils/spacedRepetition';
import type { PracticeAnswerDetail } from '../types';

/** 复习题 PracticeQuestion.id 前缀（见 quickDrillMix.reviewItemToPracticeQuestion） */
export const REVIEW_QUESTION_PREFIX = 'review-';

/** 快答阈值（秒）：答对且低于该用时视为"完美记忆"（quality 5） */
export const FAST_ANSWER_SECONDS = 5;

/** 是否为复习题的作答记录 */
export function isReviewQuestionId(questionId: string): boolean {
  return questionId.startsWith(REVIEW_QUESTION_PREFIX);
}

/** SM-2 quality 映射：对+快 → 5 / 对 → 4 / 错 → 1 */
export function reviewQualityFor(isCorrect: boolean, timeTaken: number): number {
  if (!isCorrect) return 1;
  return timeTaken < FAST_ANSWER_SECONDS ? 5 : 4;
}

/**
 * 依据作答明细计算需要回写的 ReviewItem（processReview 推进后的新副本）。
 *
 * - 非 review-* 题目忽略
 * - 找不到对应 ReviewItem（如已被清理）时静默跳过
 * - 同一复习项多次作答时按出现顺序依次推进（正常混合流程每项至多一次）
 */
export function computeReviewWriteBacks(
  reviewItems: ReviewItem[],
  answers: PracticeAnswerDetail[],
): ReviewItem[] {
  const updated: ReviewItem[] = [];
  const byId = new Map(reviewItems.map((r) => [r.id, r] as const));
  for (const ans of answers) {
    if (!isReviewQuestionId(ans.questionId)) continue;
    const itemId = ans.questionId.slice(REVIEW_QUESTION_PREFIX.length);
    const item = byId.get(itemId);
    if (!item) continue;
    const next = processReview(item, reviewQualityFor(ans.isCorrect, ans.timeTaken));
    byId.set(itemId, next); // 同项多次作答时基于最新状态推进
    updated.push(next);
  }
  return updated;
}
