/**
 * 策略学院目录摘要总索引（AUTO-GENERATED 文件见同目录 standard / short-deck / heads-up）。
 * 仅含 Level/课程目录元数据；正文、小测、示例与练习在 lessons/variants/* 完整数据中。
 */
import type { LessonSummary, LevelSummary } from '../../../types';
import { STANDARD_LEVEL_SUMMARIES } from './standard';
import { SHORT_DECK_LEVEL_SUMMARIES } from './short-deck';
import { HEADS_UP_LEVEL_SUMMARIES } from './heads-up';

export { STANDARD_LEVEL_SUMMARIES } from './standard';
export { SHORT_DECK_LEVEL_SUMMARIES } from './short-deck';
export { HEADS_UP_LEVEL_SUMMARIES } from './heads-up';

/** 全部变体的课程摘要（按 id 去重；共享 L1/L2 保留标准侧条目） */
export const ALL_VARIANT_LESSON_SUMMARIES: LessonSummary[] = (() => {
  const unique = new Map<string, LessonSummary>();
  for (const levels of [
    STANDARD_LEVEL_SUMMARIES,
    SHORT_DECK_LEVEL_SUMMARIES,
    HEADS_UP_LEVEL_SUMMARIES,
  ] as LevelSummary[][]) {
    for (const level of levels) {
      for (const lesson of level.lessons) {
        if (!unique.has(lesson.id)) unique.set(lesson.id, lesson);
      }
    }
  }
  return [...unique.values()];
})();
