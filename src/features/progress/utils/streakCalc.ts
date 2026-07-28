import type { TrainingRecord, StreakState, StreakMilestones } from '../types';
import { MILESTONE_DAYS } from '../types';

/** 计算当前连续训练天数 */
export function calculateCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].sort().reverse();
  const today = toTodayStr();
  const yesterday = toRelativeDayStr(-1);

  // 如果今天和昨天都没训练，streak 为 0
  if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

  let streak = 0;
  const uniqueDates = [...new Set(sorted)];

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = toRelativeDayStr(-i);
    // 如果第一天是昨天而不是今天，允许偏移一天
    const expectedAlt = toRelativeDayStr(-i - (uniqueDates[0] === yesterday ? 1 : 0));
    if (uniqueDates[i] === expected || uniqueDates[i] === expectedAlt) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

/** 计算最长连续天数 */
export function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const uniqueSorted = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;

  for (let i = 1; i < uniqueSorted.length; i++) {
    const prev = new Date(uniqueSorted[i - 1]!);
    const curr = new Date(uniqueSorted[i]!);
    const diffDays = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

/** 获取训练日历数据（用于打卡日历展示） */
export function getTrainingCalendar(
  records: TrainingRecord[],
  month: number,
  year: number,
): Map<string, number> {
  const calendar = new Map<string, number>();

  for (const record of records) {
    const d = new Date(record.createdAt);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      calendar.set(dateStr, (calendar.get(dateStr) ?? 0) + 1);
    }
  }

  return calendar;
}

// ─── 内部工具 ──────────────────────────────────────

function toTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function toRelativeDayStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── P0-2 Streak 核心机制 ──────────────────────────────────────

/** 获取今日 YYYY-MM-DD 字符串（本地时区） */
export function getTodayString(): string {
  return toTodayStr();
}

/** 获取昨日 YYYY-MM-DD 字符串（本地时区） */
export function getYesterdayString(): string {
  return toRelativeDayStr(-1);
}

/**
 * 计算两个 YYYY-MM-DD 日期相差的天数（date2 - date1，正数表示 date2 在后）
 * 使用本地时区构造 Date，避免 UTC 偏移导致跨日误差
 */
export function daysBetween(date1: string, date2: string): number {
  const [y1, m1, d1] = date1.split('-').map(Number);
  const [y2, m2, d2] = date2.split('-').map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return NaN;
  const a = new Date(y1, (m1 as number) - 1, d1 as number);
  const b = new Date(y2, (m2 as number) - 1, d2 as number);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/** Earn Back 窗口期长度（毫秒） */
export const EARN_BACK_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * 判断是否处于 Earn Back 窗口期
 * 条件：streakBrokenAt 存在且距今不超过 24 小时
 */
export function isEarnBackActive(streakBrokenAt: number | null, now: number = Date.now()): boolean {
  if (streakBrokenAt === null) return false;
  return now - streakBrokenAt < EARN_BACK_WINDOW_MS;
}

/**
 * 更新 Streak 状态（核心逻辑）
 *
 * 规则：
 * 1. 如果今天已训练（lastTrainingDate === today），不重复计算，返回原状态
 * 2. 如果处于 Earn Back 窗口期（streakBrokenAt 在 24h 内）→ 恢复 streak：currentStreak + 1，清除 streakBrokenAt
 * 3. 如果 Earn Back 窗口已过期 → 重置 streak = 1，清除 streakBrokenAt，重置 streakStartDate
 * 4. 如果昨天训练过 → currentStreak + 1
 * 5. 如果前天训练过但昨天没训练 → 有冻结卡且今日未用过 → 自动使用冻结卡，streak + 1
 * 6. 其他情况（更久之前 / 首次训练）→ 进入断裂状态：保留 currentStreak 旧值，记录 streakBrokenAt
 *    （不立即重置，给用户 24h Earn Back 窗口；若窗口过期再训练则重置为 1）
 *
 * 设计说明：spec 中"重置为 1，记录 streakBrokenAt"在语义上存在矛盾（已重置则无需 Earn Back）。
 * 本实现采用"保留旧 currentStreak + 设置 streakBrokenAt"，使 Earn Back 恢复有意义。
 *
 * @param state 当前 streak 状态
 * @returns 更新后的 streak 状态（不修改 milestones / lastMilestoneCelebrated，由 checkNewMilestone 处理）
 */
export function updateStreak(state: StreakState): StreakState {
  const today = getTodayString();
  const yesterday = getYesterdayString();

  // 1. 今天已训练，幂等返回
  if (state.lastTrainingDate === today) {
    return state;
  }

  const todayTime = Date.now();

  // 2. 处于 Earn Back 窗口期或窗口已过期
  if (state.streakBrokenAt !== null) {
    if (isEarnBackActive(state.streakBrokenAt, todayTime)) {
      // Earn Back 恢复：旧 streak + 1
      const newStreak = state.currentStreak + 1;
      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        streakBrokenAt: null,
        lastTrainingDate: today,
        streakFreezeUsedToday: false,
      };
    }
    // 窗口已过期，重置 streak
    return {
      ...state,
      currentStreak: 1,
      longestStreak: state.longestStreak,
      streakBrokenAt: null,
      streakStartDate: today,
      lastTrainingDate: today,
      streakFreezeUsedToday: false,
    };
  }

  // 3. 昨天训练过 → streak + 1
  if (state.lastTrainingDate === yesterday) {
    const newStreak = state.currentStreak + 1;
    return {
      ...state,
      currentStreak: newStreak,
      longestStreak: Math.max(state.longestStreak, newStreak),
      lastTrainingDate: today,
      streakFreezeUsedToday: false,
    };
  }

  // 4. 前天训练过但昨天没训练 → 冻结卡保护
  if (state.lastTrainingDate !== null) {
    const gap = daysBetween(state.lastTrainingDate, today);
    if (gap === 2 && state.streakFreezes > 0 && !state.streakFreezeUsedToday) {
      const newStreak = state.currentStreak + 1;
      return {
        ...state,
        currentStreak: newStreak,
        longestStreak: Math.max(state.longestStreak, newStreak),
        streakFreezes: state.streakFreezes - 1,
        streakFreezeUsedToday: true,
        lastTrainingDate: today,
      };
    }
  }

  // 5. 进入断裂状态：保留旧 currentStreak，设置 streakBrokenAt，不更新 lastTrainingDate
  //    （下次训练时若窗口未过期则 Earn Back 恢复，否则重置为 1）
  return {
    ...state,
    streakBrokenAt: todayTime,
  };
}

/**
 * 检查并返回新达成的里程碑
 *
 * @param currentStreak 当前连续天数
 * @param milestones 已记录的里程碑达成状态
 * @returns 新达成的里程碑天数（3/7/30/100/365），若有多个未达成且当前 streak 已超越，返回最大的那个；无则返回 null
 */
export function checkNewMilestone(
  currentStreak: number,
  milestones: StreakMilestones,
): number | null {
  let newMilestone: number | null = null;
  for (const day of MILESTONE_DAYS) {
    const key = `day${day}` as keyof StreakMilestones;
    if (!milestones[key] && currentStreak >= day) {
      newMilestone = day;
    }
  }
  return newMilestone;
}
