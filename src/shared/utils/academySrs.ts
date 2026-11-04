/**
 * 两院共用的题级 SRS 复习项构造（纯函数）。
 *
 * 持久化约束：label / front / back 一律存 i18n key，禁止存任何语言的译文；
 * 复习项随 persist 长期存活，渲染层 t() 解析。
 */
import { createReviewItem } from './spacedRepetition';
import type { ReviewItem } from './spacedRepetition';

/** 学院 SRS 来源（与 ReviewItemMetadata.source 的可用值对齐）。 */
export type AcademySrsSource = 'strategy' | 'theory';

export interface BuildQuestionReviewItemsParams {
  source: AcademySrsSource;
  /** 复习项分类：两院沿用 'strategy' / 'theory'。 */
  category: string;
  /** 复习项“去复习”跳转路由。 */
  route: string;
  /** 当前条目所属题库（用于过滤未知题 id）。 */
  questions: readonly { id: string }[];
  /** 本次答错的稳定题 id 列表。 */
  wrongQuestionIds: readonly string[];
  /** 命名空间前缀，如 'theory:' / 'strategy:'。 */
  idPrefix: string;
  keyForQuestion: (questionId: string) => string;
  keyForExplanation: (questionId: string) => string;
}

/** 构造题级复习项 id（前缀隔离，避免 addReviewItem 按 id 整体 upsert 时互相吞并）。 */
export function academyReviewItemId(idPrefix: string, questionId: string): string {
  return `${idPrefix}${questionId}`;
}

export function buildQuestionReviewItems({
  source,
  category,
  route,
  questions,
  wrongQuestionIds,
  idPrefix,
  keyForQuestion,
  keyForExplanation,
}: BuildQuestionReviewItemsParams): ReviewItem[] {
  const knownIds = new Set(questions.map((question) => question.id));
  const seen = new Set<string>();
  const items: ReviewItem[] = [];

  for (const questionId of wrongQuestionIds) {
    if (!knownIds.has(questionId) || seen.has(questionId)) continue;
    seen.add(questionId);
    const front = keyForQuestion(questionId);
    items.push(
      createReviewItem(academyReviewItemId(idPrefix, questionId), front, category, {
        source,
        route,
        front,
        back: keyForExplanation(questionId),
      }),
    );
  }

  return items;
}
