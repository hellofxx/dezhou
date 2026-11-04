/**
 * Level Checkpoint 错题 → 题级 SRS 复习项（shared `buildQuestionReviewItems` 薄封装）。
 *
 * 与课后测验错题的差异（PRD §5.16.13）：
 * - 检查点题目混自本级多门课，复习项必须回链到**题目来源课**（`/academy/lesson/<sourceLessonId>`）；
 * - 复习项 id 用 `checkpoint:l<level>:<questionId>` 命名空间，避免与课后测验的
 *   `strategy:<questionId>` 复习项按 id 整体 upsert 时互相吞并；
 * - label / front / back 一律存 i18n key（渲染层解析），不存任何语言的译文。
 */
import { buildQuestionReviewItems } from '@/shared/utils/academySrs';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { quizExplanationKey, quizQuestionKey } from './contentKeys';
import { groupWrongByLesson, type CheckpointQuestion } from './checkpoint';

/** 检查点复习项 id 前缀（Level 维度隔离） */
export const CHECKPOINT_REVIEW_ID_PREFIX = 'checkpoint:';

export function checkpointReviewIdPrefix(level: number): string {
  return `${CHECKPOINT_REVIEW_ID_PREFIX}l${level}:`;
}

/** 检查点错题的 SRS 复习项（按来源课分组，每题一条，回链到来源课） */
export function buildCheckpointReviewItems(
  level: number,
  questions: readonly CheckpointQuestion[],
  correctFlags: readonly boolean[],
): ReviewItem[] {
  const idPrefix = checkpointReviewIdPrefix(level);
  return groupWrongByLesson(questions, correctFlags).flatMap((group) =>
    buildQuestionReviewItems({
      source: 'strategy',
      category: 'strategy',
      route: `/academy/lesson/${group.lessonId}`,
      questions: questions
        .filter((item) => item.lessonId === group.lessonId)
        .map((item) => item.question),
      wrongQuestionIds: group.questionIds,
      idPrefix,
      keyForQuestion: quizQuestionKey,
      keyForExplanation: quizExplanationKey,
    }),
  );
}
