import type { TrainingRecord, StatsSummary, DailyStats, ModuleStats } from '../types';
import { calculateCurrentStreak, calculateLongestStreak } from './streakCalc';

/** 从训练记录聚合统计数据 */
export function aggregateStats(records: TrainingRecord[]): StatsSummary {
  if (records.length === 0) {
    return {
      totalSessions: 0,
      totalQuestions: 0,
      overallAccuracy: 0,
      averageTime: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastTrainingDate: null,
    };
  }

  const totalSessions = records.length;
  const totalQuestions = records.reduce((sum, r) => sum + r.result.totalQuestions, 0);
  const totalCorrect = records.reduce((sum, r) => sum + r.result.correctAnswers, 0);
  const overallAccuracy = totalQuestions > 0 ? totalCorrect / totalQuestions : 0;
  const totalTime = records.reduce((sum, r) => sum + r.result.averageTime * r.result.totalQuestions, 0);
  const averageTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

  // 提取日期列表用于 streak 计算
  const dates = records.map((r) => toDateStr(r.createdAt));
  const uniqueDates = [...new Set(dates)];

  const lastTrainingDate = Math.max(...records.map((r) => r.createdAt));

  return {
    totalSessions,
    totalQuestions,
    overallAccuracy,
    averageTime,
    currentStreak: calculateCurrentStreak(uniqueDates),
    longestStreak: calculateLongestStreak(uniqueDates),
    lastTrainingDate,
  };
}

/** 按日聚合（用于图表） */
export function aggregateByDay(records: TrainingRecord[], days: number): DailyStats[] {
  const now = new Date();
  const result: DailyStats[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d.getTime());
    result.push({
      date: dateStr,
      sessions: 0,
      questions: 0,
      accuracy: 0,
      totalTime: 0,
    });
  }

  const dateMap = new Map(result.map((d) => [d.date, d]));

  for (const record of records) {
    const dateStr = toDateStr(record.createdAt);
    const day = dateMap.get(dateStr);
    if (!day) continue;
    day.sessions++;
    day.questions += record.result.totalQuestions;
    day.totalTime += record.result.averageTime * record.result.totalQuestions;
  }

  // 计算每日正确率
  for (const day of result) {
    if (day.questions > 0) {
      // 重新从 records 中获取该天的正确数
      const dayRecords = records.filter((r) => toDateStr(r.createdAt) === day.date);
      const correct = dayRecords.reduce((sum, r) => sum + r.result.correctAnswers, 0);
      day.accuracy = correct / day.questions;
      day.totalTime = day.totalTime / day.questions;
    }
  }

  return result;
}

/** 按模块聚合 */
export function aggregateByModule(records: TrainingRecord[]): ModuleStats[] {
  const moduleMap = new Map<string, { sessions: number; correct: number; total: number; totalTime: number; lastPlayed: number }>();

  for (const record of records) {
    const key = record.module;
    const existing = moduleMap.get(key) ?? { sessions: 0, correct: 0, total: 0, totalTime: 0, lastPlayed: 0 };
    existing.sessions++;
    existing.correct += record.result.correctAnswers;
    existing.total += record.result.totalQuestions;
    existing.totalTime += record.result.averageTime * record.result.totalQuestions;
    existing.lastPlayed = Math.max(existing.lastPlayed, record.createdAt);
    moduleMap.set(key, existing);
  }

  return Array.from(moduleMap.entries()).map(([module, data]) => ({
    module,
    sessions: data.sessions,
    accuracy: data.total > 0 ? data.correct / data.total : 0,
    averageTime: data.total > 0 ? data.totalTime / data.total : 0,
    lastPlayed: data.lastPlayed || null,
  }));
}

/** 获取最近 N 条记录 */
export function getRecentRecords(records: TrainingRecord[], count: number): TrainingRecord[] {
  return [...records]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, count);
}

/** 计算某模块的薄弱手牌（答错最多的） */
export function getWeakHands(
  records: TrainingRecord[],
  module: string,
): Array<{ hand: string; wrongCount: number; totalCount: number }> {
  const filtered = records.filter((r) => r.module === module);
  const handStats = new Map<string, { wrong: number; total: number }>();

  for (const record of filtered) {
    for (const detail of record.result.details) {
      const existing = handStats.get(detail.question) ?? { wrong: 0, total: 0 };
      existing.total++;
      if (!detail.isCorrect) existing.wrong++;
      handStats.set(detail.question, existing);
    }
  }

  return Array.from(handStats.entries())
    .filter(([, s]) => s.wrong > 0)
    .map(([hand, s]) => ({ hand, wrongCount: s.wrong, totalCount: s.total }))
    .sort((a, b) => b.wrongCount - a.wrongCount);
}

/** 时间戳转 YYYY-MM-DD */
function toDateStr(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
