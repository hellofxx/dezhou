import type { TFunction } from 'i18next';
import type { TheoryQuizQuestion } from '../types';

/**
 * 渲染层理论课程内容 i18n key 解析（单源）。
 *
 * 背景：章节正文/章末小测/学习目标（data/levels/**）为硬编码中文，全量迁移数据层成本极高。
 * 本工具提供「渲染层 key 覆盖」：消费组件经 `t(key, { defaultValue: <数据层中文> })` 渲染，
 * 英文环境命中 i18n key，中文环境回退数据层原文（行为零变化）。
 *
 * key 命名遵循 `<module>.<context>.<field>`：
 * - 正文段落（section 无稳定 id）：`theory.content.<chapterId>.<content 数组索引>`
 * - 章末小测（有稳定 id）：`theory.quiz.<id>.*`
 * - 学习目标：`theory.chapterObjectives.<chapterId>.<索引>`
 *   （前缀用 chapterObjectives 而非 objectives，因 `theory.objectives` 已被 UI 标签占用）
 *
 * 排序治理配合：quiz 的 resolve 函数先 t() 解析（option 用原始索引派生 key），
 * 再由调用方走既有排序出口（orderTheoryQuizQuestion）重排 ——
 * 种子只依赖 id，zh/en 顺序一致，correctIndex 同步重映射。
 */

// ===== 正文段落 =====

export function theoryContentKey(chapterId: string, sectionIndex: number): string {
  return `theory.content.${chapterId}.${sectionIndex}`;
}

/** 解析正文段落文本：key 命中取译文，否则回退数据层原文 */
export function resolveTheorySectionText(
  t: TFunction,
  section: { content: string },
  key: string,
): string {
  return t(key, { defaultValue: section.content });
}

// ===== 章末小测（TheoryQuizQuestion 有稳定 id）=====

export function theoryQuizQuestionKey(questionId: string): string {
  return `theory.quiz.${questionId}.question`;
}

export function theoryQuizOptionKey(questionId: string, optionIndex: number): string {
  return `theory.quiz.${questionId}.options.${optionIndex}`;
}

export function theoryQuizExplanationKey(questionId: string): string {
  return `theory.quiz.${questionId}.explanation`;
}

/** 解析章末小测题（option 用原始索引派生 key；调用方随后走 orderTheoryQuizQuestion） */
export function resolveTheoryQuizQuestion(
  t: TFunction,
  q: TheoryQuizQuestion,
): TheoryQuizQuestion {
  return {
    ...q,
    question: t(theoryQuizQuestionKey(q.id), { defaultValue: q.question }),
    options: q.options.map((opt, i) => t(theoryQuizOptionKey(q.id, i), { defaultValue: opt })),
    explanation: t(theoryQuizExplanationKey(q.id), { defaultValue: q.explanation }),
  };
}

// ===== 学习目标（objectives）=====

export function theoryObjectiveKey(chapterId: string, index: number): string {
  return `theory.chapterObjectives.${chapterId}.${index}`;
}

/** 解析学习目标数组（按索引派生 key，defaultValue 兜底） */
export function resolveTheoryObjectives(
  t: TFunction,
  chapterId: string,
  objectives: readonly string[],
): string[] {
  return objectives.map((obj, i) => t(theoryObjectiveKey(chapterId, i), { defaultValue: obj }));
}
