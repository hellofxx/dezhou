import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TheoryProgress } from './types';
import { THEORY_LEVELS } from './data/levels';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { isDebugUnlockActive } from '@/shared/stores/debugMode';
import { isLevelUnlockedByCompleted } from './utils/theoryProgress';

const initialProgress: TheoryProgress = {
  completedChapters: [],
  quizScores: {},
  currentChapter: null,
  startedAt: 0,
  flaggedQuestions: [],
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
  /** 幂等切换题目疑难标记（已标记则移除，未标记则添加） */
  toggleFlagQuestion: (questionId: string) => void;
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

      completeChapter: (chapterId, score, totalQuestions, correctAnswers) => {
        // 先同步提交状态（纯状态归约，不在 updater 内做副作用）
        set((state) => ({
          progress: {
            ...state.progress,
            completedChapters: state.progress.completedChapters.includes(chapterId)
              ? state.progress.completedChapters
              : [...state.progress.completedChapters, chapterId],
            quizScores: {
              ...state.progress.quizScores,
              [chapterId]: Math.max(state.progress.quizScores[chapterId] ?? 0, score),
            },
          },
        }));
        // 状态提交后再发事件：确保订阅方（progress addRecord / 成就检查）同步读取时
        // 看到的是含本章的最新 completedChapters，也避免 updater 被重放导致重复发事件
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
        // 解锁判定委托 utils 纯函数（单源），与「下一章」导航校验（P1F-02）口径一致
        return isLevelUnlockedByCompleted(levelId, get().progress.completedChapters);
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

      toggleFlagQuestion: (questionId) =>
        set((state) => {
          const flagged = state.progress.flaggedQuestions;
          const next = flagged.includes(questionId)
            ? flagged.filter((id) => id !== questionId)
            : [...flagged, questionId];
          return { progress: { ...state.progress, flaggedQuestions: next } };
        }),

      resetProgress: () => set({ progress: { ...initialProgress } }),
    }),
    {
      name: 'theory-academy-progress',
      version: 2,
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
        return next as TheoryStore;
      },
    }
  )
);
