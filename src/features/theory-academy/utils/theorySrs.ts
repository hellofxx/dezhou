import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import { academyReviewItemId, buildQuestionReviewItems } from '@/shared/utils/academySrs';
import type { TheoryChapter } from '../types';
import { theoryQuizExplanationKey, theoryQuizQuestionKey } from './contentKeys';

/**
 * 理论学院章末错题 → SRS 复习项构造（纯函数，无 store 依赖）。
 *
 * 展示逻辑改用两院共享 `buildQuestionReviewItems`，本文件只保留理论侧适配：
 * 命名空间前缀、i18n key 生成函数与章节路由。两条设计约束不变：
 * 1. id 命名空间：策略学院以 lessonId 裸值作为复习项 id，而 progress.addReviewItem 是
 *    「按 id 整体 upsert」。理论若也用裸 questionId，同值 id 会互相吞并，故统一加 `theory:` 前缀。
 * 2. 持久化内容必须语言中立：label 与 metadata.front/back 一律存 **i18n key**
 *    （theory.quiz.<questionId>.question / .explanation，复用 contentKeys 单源生成函数），
 *    由渲染层（ReviewSession / SpacedRepetitionPanel）t() 解析，禁止写入任何语言的译文。
 *
 * key 双备性无需在此兜底：src/i18n/contentI18n.test.ts 全量遍历课程数据推导的 key，
 * 断言 zh 与 en 双语 JSON 均存在；src/i18n/contentAlignment.test.ts 另断言 en 非空且不含汉字。
 */

/** 理论复习项 id 命名空间前缀（与策略学院裸 lessonId 隔离） */
export const THEORY_REVIEW_ID_PREFIX = 'theory:';

/** 理论章节页路由前缀（与 src/app/routes.tsx 的 /theory/chapter/:chapterId 对齐） */
export const THEORY_CHAPTER_ROUTE_PREFIX = '/theory/chapter/';

/** 构造理论复习项 id（`theory:<questionId>`，题 id 稳定故可作 SRS 键） */
export function theoryReviewItemId(questionId: string): string {
  return academyReviewItemId(THEORY_REVIEW_ID_PREFIX, questionId);
}

/** 构造理论章节页跳转路由（复习项「复习」按钮的目标） */
export function theoryChapterRoute(chapterId: string): string {
  return `${THEORY_CHAPTER_ROUTE_PREFIX}${chapterId}`;
}

/**
 * 把章末错题 id 列表转为复习项列表。
 * 未知题 id（数据不一致时）静默跳过，避免向队列写入无对应内容的空项。
 *
 * 刻意不传 metadata.options：复习模式判定（ReviewSession）据此走「自评」（front/back）
 * 而非多选，与章末小测的作答交互解耦。
 */
export function buildTheoryReviewItems(
  chapter: TheoryChapter,
  wrongQuestionIds: readonly string[],
): ReviewItem[] {
  return buildQuestionReviewItems({
    source: 'theory',
    category: 'theory',
    route: theoryChapterRoute(chapter.id),
    questions: chapter.quiz,
    wrongQuestionIds,
    idPrefix: THEORY_REVIEW_ID_PREFIX,
    keyForQuestion: theoryQuizQuestionKey,
    keyForExplanation: theoryQuizExplanationKey,
  });
}
