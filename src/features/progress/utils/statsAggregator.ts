import type { TrainingRecord, StatsSummary, DailyStats, ModuleStats } from '../types';
import { calculateCurrentStreak, calculateLongestStreak } from './streakCalc';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

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

  // P2-C: theory 模块 averageTime 恒为 0（章末小测不记录耗时），
  // 排除 theory 记录计算平均耗时，避免拉低整体值
  const timedRecords = records.filter((r) => r.module !== 'theory-academy');
  const totalTime = timedRecords.reduce((sum, r) => sum + r.result.averageTime * r.result.totalQuestions, 0);
  const timedQuestions = timedRecords.reduce((sum, r) => sum + r.result.totalQuestions, 0);
  const averageTime = timedQuestions > 0 ? totalTime / timedQuestions : 0;

  // 提取日期列表用于 streak 计算
  const dates = records.map((r) => toLocalDateKey(r.createdAt));
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
    const dateStr = toLocalDateKey(d.getTime());
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
    const dateStr = toLocalDateKey(record.createdAt);
    const day = dateMap.get(dateStr);
    if (!day) continue;
    // P2-C: theory 模块 averageTime=0，不参与日耗时统计
    if (record.module !== 'theory-academy') {
      day.totalTime += record.result.averageTime * record.result.totalQuestions;
    }
    day.sessions++;
    day.questions += record.result.totalQuestions;
  }

  // 计算每日正确率
  for (const day of result) {
    if (day.questions > 0) {
      // 重新从 records 中获取该天的正确数
      const dayRecords = records.filter((r) => toLocalDateKey(r.createdAt) === day.date);
      const correct = dayRecords.reduce((sum, r) => sum + r.result.correctAnswers, 0);
      day.accuracy = correct / day.questions;
      // P2-C 修复：平均耗时分母只计非 theory 记录的题数——theory averageTime 恒为 0
      // 已被排除在 totalTime 分子之外，若分母混入其题数会稀释平均耗时（与 aggregateStats 口径对齐）
      const timedQuestions = dayRecords
        .filter((r) => r.module !== 'theory-academy')
        .reduce((sum, r) => sum + r.result.totalQuestions, 0);
      day.totalTime = timedQuestions > 0 ? day.totalTime / timedQuestions : 0;
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
    // P2-C: theory 模块 averageTime=0，不参与耗时统计
    if (record.module !== 'theory-academy') {
      existing.totalTime += record.result.averageTime * record.result.totalQuestions;
    }
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
    .toSorted((a, b) => b.createdAt - a.createdAt)
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
    .toSorted((a, b) => b.wrongCount - a.wrongCount);
}
