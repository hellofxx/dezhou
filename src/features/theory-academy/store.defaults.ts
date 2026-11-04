import type { TheoryChapterAttempt, TheoryProgress } from './types';

/**
 * theory-academy 持久化默认值与迁移种子（store 内部模块）。
 * 与 store.ts 的 action 逻辑分离：本文件只放纯数据 / 纯函数，便于迁移测试直接对照。
 */

/** 章节笔记字符上限（store 与笔记面板共用同一常量；超出截断） */
export const MAX_CHAPTER_NOTE_LENGTH = 2000;

/** 首次写入前的尝试记录兜底（避免 noUncheckedIndexedAccess 下的非空断言） */
export const EMPTY_ATTEMPT: TheoryChapterAttempt = {
  attempts: 0,
  firstScore: 0,
  firstCorrect: 0,
  firstTotal: 0,
  bestScore: 0,
  lastScore: 0,
  lastAt: 0,
};

/** 进度初始形状（v4：attempts / checkpoints / bookmarks / notes 默认值；placement 缺省） */
export const initialProgress: TheoryProgress = {
  completedChapters: [],
  quizScores: {},
  currentChapter: null,
  startedAt: 0,
  flaggedQuestions: [],
  activeVariant: 'standard',
  chapterAttempts: {},
  checkpoints: {},
  bookmarkedChapters: [],
  chapterNotes: {},
  variantMetadata: {
    standard: { lastViewedAt: Date.now(), preferredOrder: 0 },
    'short-deck': { lastViewedAt: 0, preferredOrder: 1 },
    'heads-up': { lastViewedAt: 0, preferredOrder: 2 },
  },
};

/**
 * v3→v4 迁移种子：把既有 quizScores（历史最高分）转为 attempts=1 的尝试记录，
 * 使老用户已完成章不被判为「首次」而重复 emit 事件；首次正确数无法还原，按契约定为 0。
 */
export function seedChapterAttempts(
  quizScores: Record<string, number>,
): Record<string, TheoryChapterAttempt> {
  const seeded: Record<string, TheoryChapterAttempt> = {};
  for (const [chapterId, score] of Object.entries(quizScores)) {
    seeded[chapterId] = {
      attempts: 1,
      firstScore: score,
      firstCorrect: 0,
      firstTotal: 0,
      bestScore: score,
      lastScore: score,
      lastAt: 0,
    };
  }
  return seeded;
}
