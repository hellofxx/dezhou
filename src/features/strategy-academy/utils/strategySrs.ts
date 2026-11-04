/**
 * 策略学院题级 SRS 入口（shared buildQuestionReviewItems 的薄包装）。
 *
 * 契约（PRD §12.4.3 / AGENTS.md）：复习项 label / front / back 一律存 i18n key，
 * 禁止存任何语言的译文；回链路由指向所属课时页。
 * 未知题 id（不在本次题库内的 id）自动跳过，不产生死链复习项。
 */
import { buildQuestionReviewItems } from '@/shared/utils/academySrs';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { quizExplanationKey, quizQuestionKey } from './contentKeys';
import type { QuizQuestion } from '../types';

/** 题级复习项 id 前缀（与课时级复习项 id=lessonId 隔离，避免 addReviewItem upsert 互相吞并）。 */
export const STRATEGY_REVIEW_ID_PREFIX = 'strategy:';

/** 课后测验错题的 SRS 复习项（每题一条；按 lessonId 回链）。 */
export function buildStrategyQuestionReviewItems(
  lessonId: string,
  questions: readonly QuizQuestion[],
  wrongQuestionIds: readonly string[],
): ReviewItem[] {
  if (wrongQuestionIds.length === 0) return [];
  return buildQuestionReviewItems({
    source: 'strategy',
    category: 'strategy',
    route: `/academy/lesson/${lessonId}`,
    questions,
    wrongQuestionIds,
    idPrefix: STRATEGY_REVIEW_ID_PREFIX,
    keyForQuestion: quizQuestionKey,
    keyForExplanation: quizExplanationKey,
  });
}
