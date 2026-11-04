import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  TheoryChapterAttempt,
  TheoryCheckpointAttempt,
  TheoryCheckpointResult,
  TheoryPlacementResult,
  TheoryProgress,
} from './types';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { isDebugUnlockActive } from '@/shared/stores/debugMode';
import {
  findLevelSummaryById,
  getCoreChaptersOfLevel,
  getLevelSummariesByVariant,
  isLevelUnlockedByCompleted,
} from './utils/theoryMeta';
import { EMPTY_ATTEMPT, MAX_CHAPTER_NOTE_LENGTH, initialProgress, seedChapterAttempts } from './store.defaults';
import type { PokerVariant } from '@/shared/types/elo';

/** 章节笔记字符上限（单一事实源在 store.defaults，经 store 对外导出） */
export { MAX_CHAPTER_NOTE_LENGTH } from './store.defaults';

interface TheoryStore {
  progress: TheoryProgress;
  startChapter: (chapterId: string) => void;
  /**
   * 记录一次章末小测提交（取代旧 completeChapter 的单一完成语义）：
   * 总是更新 chapterAttempts 与 quizScores 最高分；仅首次（attempts 由 0 变 1）写 completedChapters /
   * firstScore-firstCorrect-firstTotal 并 emit 训练事件，重考不 emit、不改首次成绩。
   */
  recordChapterAttempt: (
    chapterId: string,
    score: number,
    totalQuestions: number,
    correctAnswers: number,
  ) => void;
  isChapterCompleted: (chapterId: string) => boolean;
  /** 按 Level ID（'t1'-'t9'）判断解锁：T1 默认解锁，Tn 需前一 Level 核心章完成或被定位测评免修 */
  isTheoryLevelUnlocked: (levelId: string) => boolean;
  /** Level 进度（只统计核心章：增补章完成不计入分子分母） */
  getLevelProgress: (levelId: string) => number;
  /** 变体总进度（只统计核心章：增补章完成不计入分子分母） */
  getTotalProgress: () => number;
  /** 幂等切换题目疑难标记（已标记则移除，未标记则添加） */
  toggleFlagQuestion: (questionId: string) => void;
  /** P2 变体支持：切换当前学习变体上下文（同步更新 variantMetadata.lastViewedAt） */
  switchVariant: (variant: PokerVariant) => void;
  /** 定位测评结果落库：creditLevels 取历史与本次并集（单调不减，重测不降级） */
  recordPlacement: (result: TheoryPlacementResult) => void;
  /** Level checkpoint 提交落库：只记成绩与抽题 id，不解锁下一级 */
  recordCheckpointAttempt: (levelId: string, result: TheoryCheckpointResult) => void;
  /** 收藏章节幂等切换 */
  toggleBookmark: (chapterId: string) => void;
  /** 保存章节笔记（trim + 2000 字截断；空文本由 UI 自行判空，不做删除语义） */
  saveChapterNote: (chapterId: string, text: string) => void;
  resetProgress: () => void;
}

export const useTheoryStore = create<TheoryStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,

      startChapter: (chapterId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentChapter: chapterId,
            startedAt: state.progress.startedAt || Date.now(),
          },
        })),

      recordChapterAttempt: (chapterId, score, totalQuestions, correctAnswers) => {
        // attempts === 0 即首次：先读一次快照决定是否发事件（副作用不进 updater）
        const isFirstAttempt =
          (get().progress.chapterAttempts?.[chapterId]?.attempts ?? 0) === 0;
        set((state) => {
          const attempts = state.progress.chapterAttempts ?? {};
          const previous = attempts[chapterId] ?? EMPTY_ATTEMPT;
          const isFirst = previous.attempts === 0;
          const nextRecord: TheoryChapterAttempt = {
            attempts: previous.attempts + 1,
            // 首次成绩锁定掌握度 / ELO 口径，重考不得覆盖
            firstScore: isFirst ? score : previous.firstScore,
            firstCorrect: isFirst ? correctAnswers : previous.firstCorrect,
            firstTotal: isFirst ? totalQuestions : previous.firstTotal,
            bestScore: Math.max(previous.bestScore, score),
            lastScore: score,
            lastAt: Date.now(),
          };
          return {
            progress: {
              ...state.progress,
              chapterAttempts: { ...attempts, [chapterId]: nextRecord },
              completedChapters: state.progress.completedChapters.includes(chapterId)
                ? state.progress.completedChapters
                : [...state.progress.completedChapters, chapterId],
              // 兼容旧字段：quizScores 始终为历史最高分（首页 / 掌握度回退口径）
              quizScores: {
                ...state.progress.quizScores,
                [chapterId]: Math.max(state.progress.quizScores[chapterId] ?? 0, score),
              },
            },
          };
        });
        if (!isFirstAttempt) return;
        // 首次完成才发事件（状态已提交，订阅方读到含本章的最新进度）；增补章同样 emit，
        // 但核心进度统计会忽略它（见 getLevelProgress）。
        trainingEvents.emit({
          id: `theory-quiz-${chapterId}-${Date.now()}`,
          module: 'theory-academy',
          mode: 'quiz',
          result: {
            sessionId: `theory-quiz-${chapterId}`,
            module: 'theory-academy',
            totalQuestions,
            correctAnswers,
            accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
            averageTime: 0,
            timestamp: Date.now(),
            details: [],
          },
          createdAt: Date.now(),
        });
      },

      isChapterCompleted: (chapterId) => get().progress.completedChapters.includes(chapterId),

      isTheoryLevelUnlocked: (levelId) => {
        if (isDebugUnlockActive()) return true; // 调试解锁：解除全部理论 Level 门禁
        // 解锁判定委托 utils 纯函数（单源）；定位测评免修 Level 经 creditLevels 透传
        const { completedChapters, placement } = get().progress;
        return isLevelUnlockedByCompleted(levelId, completedChapters, placement?.creditLevels);
      },

      getLevelProgress: (levelId) => {
        const level = findLevelSummaryById(levelId);
        if (!level) return 0;
        // 只统计 core 章：增补章（6-max 补强）不进入分子分母
        const core = getCoreChaptersOfLevel(level);
        if (core.length === 0) return 0;
        const { completedChapters } = get().progress;
        const done = core.filter((c) => completedChapters.includes(c.id)).length;
        return Math.round((done / core.length) * 100);
      },

      /** 按当前 activeVariant 的核心章总数计算总进度（增补章与他变体章节不计入）。 */
      getTotalProgress: () => {
        const { activeVariant, completedChapters } = get().progress;
        const levels = getLevelSummariesByVariant(activeVariant);
        const coreChapterIds = new Set(
          levels.flatMap((l) => getCoreChaptersOfLevel(l).map((c) => c.id)),
        );
        const total = coreChapterIds.size;
        if (total === 0) return 0;
        const done = completedChapters.filter((id) => coreChapterIds.has(id)).length;
        return Math.round((done / total) * 100);
      },

      toggleFlagQuestion: (questionId) =>
        set((state) => {
          const flagged = state.progress.flaggedQuestions;
          const next = flagged.includes(questionId)
            ? flagged.filter((id) => id !== questionId)
            : [...flagged, questionId];
          return { progress: { ...state.progress, flaggedQuestions: next } };
        }),

      switchVariant: (variant) =>
        set((state) => {
          const metadata = state.progress.variantMetadata ?? initialProgress.variantMetadata!;
          return {
            progress: {
              ...state.progress,
              activeVariant: variant,
              variantMetadata: {
                ...metadata,
                [variant]: { ...(metadata[variant] ?? { preferredOrder: 0 }), lastViewedAt: Date.now() },
              },
            },
          };
        }),

      recordPlacement: (result) =>
        set((state) => {
          const previous = state.progress.placement;
          // 单调并集：重测只增不减，已获得的免修 Level 不会因本次低分被收回
          const creditLevels = [
            ...new Set([...(previous?.creditLevels ?? []), ...result.creditLevels]),
          ];
          return { progress: { ...state.progress, placement: { ...result, creditLevels } } };
        }),

      recordCheckpointAttempt: (levelId, result) =>
        set((state) => {
          const checkpoints = state.progress.checkpoints ?? {};
          const previous = checkpoints[levelId];
          const next: TheoryCheckpointAttempt = {
            attempts: (previous?.attempts ?? 0) + 1,
            bestScore: Math.max(previous?.bestScore ?? 0, result.score),
            lastScore: result.score,
            lastAt: Date.now(),
            questionIds: [...result.questionIds],
          };
          return { progress: { ...state.progress, checkpoints: { ...checkpoints, [levelId]: next } } };
        }),

      toggleBookmark: (chapterId) =>
        set((state) => {
          const bookmarks = state.progress.bookmarkedChapters ?? [];
          const next = bookmarks.includes(chapterId)
            ? bookmarks.filter((id) => id !== chapterId)
            : [...bookmarks, chapterId];
          return { progress: { ...state.progress, bookmarkedChapters: next } };
        }),

      saveChapterNote: (chapterId, text) =>
        set((state) => ({
          progress: {
            ...state.progress,
            chapterNotes: {
              ...(state.progress.chapterNotes ?? {}),
              [chapterId]: {
                text: text.trim().slice(0, MAX_CHAPTER_NOTE_LENGTH),
                updatedAt: Date.now(),
              },
            },
          },
        })),

      resetProgress: () => set({ progress: { ...initialProgress } }),
    }),
    {
      name: 'theory-academy-progress',
      version: 4,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const next = (persistedState ?? {}) as Partial<TheoryStore>;
        // v0 → v1：防御性合并进度默认值（新 store 首版，兜底旧异常数据）
        if (fromVersion < 1) {
          next.progress = { ...initialProgress, ...next.progress };
        }
        // v1 → v2：新增 flaggedQuestions 字段默认值（幂等合并，v0 数据走完上一分支后同样受益）
        if (fromVersion < 2) {
          next.progress = { ...initialProgress, ...(next.progress ?? {}) };
        }
        // v2 → v3：新增 activeVariant / variantMetadata 变体上下文字段（幂等合并，默认 standard）
        if (fromVersion < 3) {
          next.progress = { ...initialProgress, ...(next.progress ?? {}) };
        }
        // v3 → v4：attempts / checkpoints / placement / bookmarks / notes（quizScores 种子化 attempts）
        if (fromVersion < 4) {
          const previous: Partial<TheoryProgress> = next.progress ?? {};
          next.progress = {
            ...initialProgress,
            ...previous,
            chapterAttempts: {
              ...seedChapterAttempts(previous.quizScores ?? {}),
              ...(previous.chapterAttempts ?? {}),
            },
            checkpoints: previous.checkpoints ?? {},
            bookmarkedChapters: previous.bookmarkedChapters ?? [],
            chapterNotes: previous.chapterNotes ?? {},
          };
        }
        return next as TheoryStore;
      },
    }
  )
);
