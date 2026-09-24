import { useMemo } from 'react';
import type { TrainingResult } from '@/shared/types/common';
import type { TrainingRecord } from '../types';
import { useProgressStore } from '../store';

export function useProgress() {
  const records = useProgressStore((s) => s.records);
  const addRecord = useProgressStore((s) => s.addRecord);
  const settings = useProgressStore((s) => s.settings);
  const streak = useProgressStore((s) => s.streak);
  const getStatsSummary = useProgressStore((s) => s.getStatsSummary);
  const getModuleStats = useProgressStore((s) => s.getModuleStats);
  const getRecentRecords = useProgressStore((s) => s.getRecentRecords);

  // Streak 全站唯一事实源是 store.streak（含冻结卡/Earn Back 语义）；
  // aggregateStats 从 records 派生的 streak 不感知冻结卡续接，两套数字会漂移，
  // 故在汇总层统一覆盖，避免各消费方（StatsOverview/StreakTracker/分享卡）各自取数
  const summary = useMemo(() => {
    const base = getStatsSummary();
    return {
      ...base,
      currentStreak: streak.currentStreak,
      longestStreak: Math.max(base.longestStreak, streak.longestStreak),
    };
  }, [getStatsSummary, records, streak.currentStreak, streak.longestStreak]);
  const moduleStats = useMemo(() => getModuleStats(), [getModuleStats, records]);
  const recentRecords = useMemo(() => getRecentRecords(10), [getRecentRecords, records]);

  /** 记录一次训练 */
  const recordSession = (
    result: TrainingResult,
    module: 'range-trainer' | 'pot-odds' | 'gto-simulator',
    mode: string = 'quiz',
  ) => {
    const record: TrainingRecord = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      module,
      mode,
      result,
      createdAt: Date.now(),
    };
    addRecord(record);
  };

  return {
    summary,
    moduleStats,
    recentRecords,
    recordSession,
    settings,
    records,
  };
}
