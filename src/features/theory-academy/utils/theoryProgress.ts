import { THEORY_LEVELS } from '../data/levels';
import { ALL_VARIANT_THEORY_LEVELS } from '../data/levels/variants';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import { getNextChapterSummary } from './theoryMeta';

/**
 * 章节完整数据查询（含正文与小测）。
 * 仅章节页 / 疑难清单这类确需内容的入口使用；首页与 store 请走 theoryMeta 摘要层，
 * 避免把全量章节正文带进首屏 chunk。
 */

const CHAPTER_BY_ID = new Map<string, TheoryChapter>();
const LEVEL_BY_CHAPTER_ID = new Map<string, TheoryLevelInfo>();

for (const level of ALL_VARIANT_THEORY_LEVELS) {
  for (const chapter of level.chapters) {
    CHAPTER_BY_ID.set(chapter.id, chapter);
    LEVEL_BY_CHAPTER_ID.set(chapter.id, level);
  }
}

/** 获取所有章节的扁平化列表（按 Level 与 order 排列，仅标准系列） */
export function getAllChapters(): TheoryChapter[] {
  return THEORY_LEVELS.flatMap((level) => level.chapters);
}

/** 根据 ID 查找章节（支持所有变体） */
export function findChapterById(chapterId: string): TheoryChapter | undefined {
  return CHAPTER_BY_ID.get(chapterId);
}

/** 根据章节 ID 查找所属 Level（支持所有变体） */
export function findLevelByChapterId(chapterId: string): TheoryLevelInfo | undefined {
  return LEVEL_BY_CHAPTER_ID.get(chapterId);
}

/**
 * 获取下一章：在同一变体序列内顺延（目录层定位，再取完整章节）。
 * 不会跨变体顺延；找不到章节时返回 undefined。
 */
export function getNextChapter(currentChapterId: string): TheoryChapter | undefined {
  const next = getNextChapterSummary(currentChapterId);
  return next ? CHAPTER_BY_ID.get(next.id) : undefined;
}

export {
  getChapterDifficulty,
  getTotalChapterCount,
  isLevelFullyCompleted,
  isLevelUnlockedByCompleted,
} from './theoryMeta';
