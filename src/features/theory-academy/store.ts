import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TheoryProgress } from './types';
import { THEORY_LEVELS } from './data/levels';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { isDebugUnlockActive } from '@/shared/stores/debugMode';

const initialProgress: TheoryProgress = {
  completedChapters: [],
  quizScores: {},
  currentChapter: null,
  startedAt: 0,
};

interface TheoryStore {
  progress: TheoryProgress;
  startChapter: (chapterId: string) => void;
  /**
   * 完成章节（章末小测提交时调用，幂等：重复完成不重复计数）。
   * quizScores 记录历史最高分；完成时 emit 训练事件供 progress 中枢消费。
   */
  completeChapter: (chapterId: string, score: number, totalQuestions: number, correctAnswers: number) => void;
  isChapterCompleted: (chapterId: string) => boolean;
  /** 按 Level ID（'t1'-'t9'）判断解锁：T1 默认解锁，Tn 需 T(n-1) 全部章节完成 */
  isTheoryLevelUnlocked: (levelId: string) => boolean;
  getLevelProgress: (levelId: string) => number;
  getTotalProgress: () => number;
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

      completeChapter: (chapterId, score, totalQuestions, correctAnswers) =>
        set((state) => {
          const alreadyCompleted = state.progress.completedChapters.includes(chapterId);
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
          return {
            progress: {
              ...state.progress,
              completedChapters: alreadyCompleted
                ? state.progress.completedChapters
                : [...state.progress.completedChapters, chapterId],
              quizScores: {
                ...state.progress.quizScores,
                [chapterId]: Math.max(state.progress.quizScores[chapterId] ?? 0, score),
              },
            },
          };
        }),

      isChapterCompleted: (chapterId) => get().progress.completedChapters.includes(chapterId),

      isTheoryLevelUnlocked: (levelId) => {
        if (isDebugUnlockActive()) return true; // 调试解锁：解除全部理论 Level 门禁
        const idx = THEORY_LEVELS.findIndex((l) => l.id === levelId);
        if (idx < 0) return false;
        if (idx === 0) return true;
        const prev = THEORY_LEVELS[idx - 1];
        if (!prev) return false;
        const { completedChapters } = get().progress;
        return prev.chapters.every((c) => completedChapters.includes(c.id));
      },

      getLevelProgress: (levelId) => {
        const level = THEORY_LEVELS.find((l) => l.id === levelId);
        if (!level || level.chapters.length === 0) return 0;
        const { completedChapters } = get().progress;
        const done = level.chapters.filter((c) => completedChapters.includes(c.id)).length;
        return Math.round((done / level.chapters.length) * 100);
      },

      getTotalProgress: () => {
        const total = THEORY_LEVELS.reduce((sum, l) => sum + l.chapters.length, 0);
        if (total === 0) return 0;
        return Math.round((get().progress.completedChapters.length / total) * 100);
      },

      resetProgress: () => set({ progress: { ...initialProgress } }),
    }),
    {
      name: 'theory-academy-progress',
      version: 1,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const next = (persistedState ?? {}) as Partial<TheoryStore>;
        // v0 → v1：防御性合并进度默认值（新 store 首版，兜底旧异常数据）
        if (fromVersion < 1) {
          next.progress = { ...initialProgress, ...next.progress };
        }
        return next as TheoryStore;
      },
    }
  )
);
