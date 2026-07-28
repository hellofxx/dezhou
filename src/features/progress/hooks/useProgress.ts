import { useMemo } from 'react';
import type { TrainingResult } from '@/shared/types/common';
import type { TrainingRecord } from '../types';
import { useProgressStore } from '../store';
import { aggregateByDay } from '../utils/statsAggregator';
import { getTrainingCalendar } from '../utils/streakCalc';

export function useProgress() {
  const records = useProgressStore((s) => s.records);
  const addRecord = useProgressStore((s) => s.addRecord);
  const settings = useProgressStore((s) => s.settings);
  const getStatsSummary = useProgressStore((s) => s.getStatsSummary);
  const getModuleStats = useProgressStore((s) => s.getModuleStats);
  const getRecentRecords = useProgressStore((s) => s.getRecentRecords);

  const summary = useMemo(() => getStatsSummary(), [getStatsSummary, records]);
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

  /** 获取每日统计 */
  const dailyStats = (days: number = 14) =>
    useMemo(() => aggregateByDay(records, days), [records, days]);

  /** 获取训练日历 */
  const calendarData = (month: number, year: number) =>
    useMemo(() => getTrainingCalendar(records, month, year), [records, month, year]);

  return {
    summary,
    moduleStats,
    recentRecords,
    recordSession,
    dailyStats,
    calendarData,
    settings,
    records,
  };
}
