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

/**
 * 进度初始形状
 * （v4：attempts / checkpoints / bookmarks / notes 默认值；v5：legacyUnlockedLevels；placement 缺省）
 */
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
  legacyUnlockedLevels: [],
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

/**
 * v5 宽限迁移的历史快照：单挑（heads-up）对齐标准核心章数**之前**的 22 个核心章 id。
 *
 * 这是一张冻结的“当时的数据”清单，只用于迁移时判断存量用户当时解锁到哪一级；
 * 之后新增的章（T4 2 章、T5 3 章、T6/T7/T8 各 2 章、T9 4 章）**不在**本表内，
 * 也不得随数据演进回填——否则宽限判定会退化成“永远成立”。
 * 不参与任何实时解锁 / 完成度 / 掌握度口径（那些一律读 manifest 摘要的 core 章）。
 */
export const LEGACY_HEADS_UP_CORE_CHAPTERS: Readonly<Record<string, readonly string[]>> = {
  t1hu: ['t1hu-probability', 't1hu-outs', 't1hu-variance'],
  t2hu: ['t2hu-odds', 't2hu-ev', 't2hu-risk'],
  t3hu: ['t3hu-sb-strategy', 't3hu-bb-defense', 't3hu-position-reversal'],
  t4hu: ['t4hu-range-width', 't4hu-polarization', 't4hu-blocking'],
  t5hu: ['t5hu-gto-he', 't5hu-frequency'],
  t6hu: ['t6hu-sizing-optimal', 't6hu-barrel'],
  t7hu: ['t7hu-patterns', 't7hu-exploit'],
  t8hu: ['t8hu-pressure', 't8hu-reads'],
  t9hu: ['t9hu-mastery', 't9hu-pro-study'],
};

/**
 * v4→v5 迁移种子：按历史快照推导「存量用户当时已解锁」的 Level 宽限名单。
 *
 * 规则：对 T4–T9 逐个判断，若前一 Level 的**旧**核心章全部完成，则把当前 Level id 加入名单。
 * 只写 legacyUnlockedLevels（放宽门禁），**绝不写 completedChapters**：
 * 新章仍需用户真正读完才计入完成度，宽限只保证不倒退。
 * 逐级独立判定（不用链式传递），因此“读到 T6 但 T5 新章未读”等中间态也能正确保留。
 */
export function seedLegacyHeadsUpUnlockedLevels(
  completedChapters: readonly string[],
): string[] {
  const completed = new Set(completedChapters);
  const unlocked: string[] = [];
  for (let level = 4; level <= 9; level++) {
    const previous = LEGACY_HEADS_UP_CORE_CHAPTERS[`t${level - 1}hu`] ?? [];
    if (previous.length === 0) continue;
    if (previous.every((chapterId) => completed.has(chapterId))) {
      unlocked.push(`t${level}hu`);
    }
  }
  return unlocked;
}
