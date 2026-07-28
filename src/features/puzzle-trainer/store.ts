/**
 * Puzzle-trainer 状态管理（独立 store，不触碰 progress store 的 elo 字段）。
 *
 * 存储：
 *  - rushBest: Puzzle Rush 最高分
 *  - dailyBest: Daily 谜题最佳正确率
 *  - themeBest: 主题训练最佳记录（按主题分组）
 *  - dailyCompleted: 每日完成状态（dateKey -> true）
 *  - quickDrillBest: P1-4.1 快速训练最佳记录（与 PuzzleBestRecord 解耦）
 *  - history: 历史会话记录（最多保留 50 条，用于趋势）
 *
 * 持久化到 localStorage，与 progress store 解耦。
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PuzzleBestRecord, PuzzleMode, PuzzleTheme, DailyCompletionMap, QuickDrillBestRecord } from './types';
import type { PuzzleResult } from './types';

interface PuzzleStore {
  /** Puzzle Rush 历史最佳分数 */
  rushBest: PuzzleBestRecord | null;
  /** Daily 谜题历史最佳正确率记录 */
  dailyBest: PuzzleBestRecord | null;
  /** 主题训练历史最佳记录（按主题 key） */
  themeBest: Partial<Record<PuzzleTheme, PuzzleBestRecord>>;
  /** 每日谜题完成状态：dateKey -> true */
  dailyCompleted: DailyCompletionMap;
  /** P1-4.1: 快速训练历史最佳记录 */
  quickDrillBest: QuickDrillBestRecord | null;
  /** 历史会话记录（最多保留 50 条，用于趋势） */
  history: PuzzleResult[];

  /** 提交一次会话结果，自动更新对应最佳记录 */
  submitResult: (result: PuzzleResult) => { isNewRecord: boolean; previousBest: PuzzleBestRecord | null };
  /** 标记今日 daily 已完成 */
  markDailyCompleted: (dateKey: string) => void;
  /** 检查今日 daily 是否已完成 */
  isDailyCompleted: (dateKey: string) => boolean;
  /** P1-4.1: 提交快速训练结果，返回是否破纪录 */
  submitQuickDrillResult: (input: {
    score: number;
    accuracy: number;
    timeTaken: number;
  }) => { isNewRecord: boolean; previousBest: QuickDrillBestRecord | null };
  /** 清空所有记录（用于测试/重置） */
  reset: () => void;
}

function buildBest(result: PuzzleResult): PuzzleBestRecord {
  return {
    mode: result.mode,
    theme: result.theme,
    bestScore: result.score,
    bestAccuracy: result.accuracy,
    bestTime: result.duration,
    achievedAt: result.timestamp,
  };
}

function compareScore(prev: PuzzleBestRecord | null, next: PuzzleBestRecord): boolean {
  if (!prev) return true;
  // Puzzle Rush: 比较分数
  if (next.mode === 'rush') return next.bestScore > prev.bestScore;
  // Daily/Theme: 比较正确率，平手则比时间（更短更优）
  if (Math.abs(next.bestAccuracy - prev.bestAccuracy) < 0.001) {
    return next.bestTime < prev.bestTime;
  }
  return next.bestAccuracy > prev.bestAccuracy;
}

export const usePuzzleStore = create<PuzzleStore>()(
  persist(
    (set, get) => ({
      rushBest: null,
      dailyBest: null,
      themeBest: {},
      dailyCompleted: {},
      quickDrillBest: null,
      history: [],

      submitResult: (result) => {
        const state = get();
        let isNewRecord = false;
        let previousBest: PuzzleBestRecord | null = null;
        const newBest = buildBest(result);

        if (result.mode === 'rush') {
          previousBest = state.rushBest;
          if (compareScore(state.rushBest, newBest)) {
            isNewRecord = true;
            set({ rushBest: newBest });
          }
        } else if (result.mode === 'daily') {
          previousBest = state.dailyBest;
          if (compareScore(state.dailyBest, newBest)) {
            isNewRecord = true;
            set({ dailyBest: newBest });
          }
        } else if (result.mode === 'theme' && result.theme) {
          previousBest = state.themeBest[result.theme] ?? null;
          if (compareScore(previousBest, newBest)) {
            isNewRecord = true;
            set({
              themeBest: { ...state.themeBest, [result.theme]: newBest },
            });
          }
        }

        // 历史保留最近 50 条
        const newHistory = [result, ...state.history].slice(0, 50);
        set({ history: newHistory });

        return { isNewRecord, previousBest };
      },

      markDailyCompleted: (dateKey) => {
        if (get().dailyCompleted[dateKey]) return; // 已标记，幂等
        set((state) => ({
          dailyCompleted: { ...state.dailyCompleted, [dateKey]: true },
        }));
      },

      isDailyCompleted: (dateKey) => Boolean(get().dailyCompleted[dateKey]),

      submitQuickDrillResult: ({ score, accuracy, timeTaken }) => {
        const previousBest = get().quickDrillBest;
        // P1-4.1: 快速训练以综合分数（accuracy * 100 + 时间奖励）比较
        const isNewRecord = !previousBest || score > previousBest.bestScore;
        if (isNewRecord) {
          set({
            quickDrillBest: {
              bestScore: score,
              bestAccuracy: accuracy,
              bestTime: timeTaken,
              achievedAt: Date.now(),
            },
          });
        }
        return { isNewRecord, previousBest };
      },

      reset: () => {
        set({
          rushBest: null,
          dailyBest: null,
          themeBest: {},
          dailyCompleted: {},
          quickDrillBest: null,
          history: [],
        });
      },
    }),
    {
      name: 'puzzle-trainer-store',
      version: 2,
      migrate: (persistedState: unknown, fromVersion: number) => {
        // v1 → v2：注入 quickDrillBest 默认值（null）
        const next = (persistedState ?? {}) as Partial<PuzzleStore>;
        if (fromVersion < 2) {
          if (next.quickDrillBest === undefined) {
            next.quickDrillBest = null;
          }
        }
        return next as PuzzleStore;
      },
    }
  )
);

/** 根据 mode + theme 获取对应的 Best Record */
export function getBestRecord(
  store: PuzzleStore,
  mode: PuzzleMode,
  theme?: PuzzleTheme
): PuzzleBestRecord | null {
  if (mode === 'rush') return store.rushBest;
  if (mode === 'daily') return store.dailyBest;
  if (mode === 'theme' && theme) return store.themeBest[theme] ?? null;
  return null;
}
