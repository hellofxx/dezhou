import type { TrainingRecord, StreakState, StreakMilestones } from '../types';
import { MILESTONE_DAYS } from '../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';
import { toLocalDateString } from '@/shared/utils/spacedRepetition';

/** 计算当前连续训练天数 */
export function calculateCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sorted = [...dates].toSorted().toReversed();
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

  const uniqueSorted = [...new Set(dates)].toSorted();
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
      const dateStr = toLocalDateKey(d.getTime());
      calendar.set(dateStr, (calendar.get(dateStr) ?? 0) + 1);
    }
  }

  return calendar;
}

// ─── 内部工具 ──────────────────────────────────────

function toTodayStr(): string {
  return toLocalDateKey(Date.now());
}

function toRelativeDayStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toLocalDateKey(d.getTime());
}

// ─── P0-2 Streak 核心机制 ──────────────────────────────────────

// 今日 YYYY-MM-DD（本地时区）：统一委托 spacedRepetition 的单一实现（内部走 shared/toLocalDateKey），
// 消除双实现；spacedRepetition 的 toLocalDateString 支持无参调用（返回今天），故可安全 re-export
export { toLocalDateString as getTodayString } from '@/shared/utils/spacedRepetition';

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
 * 2. 历史断裂状态（streakBrokenAt 非空，旧版本产生）：24h 内 → Earn Back 恢复 +1；过期 → 重置为 1
 * 3. 首次训练（lastTrainingDate === null）→ 直接启动 Day 1：currentStreak = 1
 * 4. 如果昨天训练过 → currentStreak + 1
 * 5. 前天训练过但昨天没训练（gap=2）：免费 Earn Back 恢复（streak 断裂于今日 0 点，
 *    仍在 24h 窗口内，恢复为原天数 + 1）。自动恢复一律不扣冻结卡（PRG-008）。
 * 6. 断签 ≥ 2 天（gap ≥ 3）→ 断裂时刻（漏训首日 24 点）距今已超 24h → 重置为 1
 *
 * 设计说明：纯前端无后台任务，断裂只能在下一次训练时被发现。Earn Back 窗口以
 * “断裂发生时刻（漏训首日结束）”起算而非“发现时刻”：漏训 1 天后的次日全天均在
 * 24h 窗口内可恢复；漏训 ≥ 2 天则窗口必已过期，直接重置。回归后的首次训练即时
 * 生效（计入 lastTrainingDate），不再存在“被吞掉的训练”。
 *
 * @param state 当前 streak 状态
 * @returns 更新后的 streak 状态（不修改 milestones / lastMilestoneCelebrated，由 checkNewMilestone 处理）
 */
export function updateStreak(state: StreakState): StreakState {
  const today = toLocalDateString();
  const yesterday = getYesterdayString();

  // 1. 今天已训练，幂等返回
  if (state.lastTrainingDate === today) {
    return state;
  }

  const todayTime = Date.now();

  // 2. 历史断裂状态兼容（旧版在断签首训时写入 streakBrokenAt）
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
      longestStreak: Math.max(state.longestStreak, 1),
      streakBrokenAt: null,
      streakStartDate: today,
      lastTrainingDate: today,
      streakFreezeUsedToday: false,
    };
  }

  // 3. 首次训练 → 启动 Day 1
  if (state.lastTrainingDate === null) {
    return {
      ...state,
      currentStreak: 1,
      longestStreak: Math.max(state.longestStreak, 1),
      streakStartDate: today,
      lastTrainingDate: today,
      streakFreezeUsedToday: false,
    };
  }

  // 4. 昨天训练过 → streak + 1
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

  const gap = daysBetween(state.lastTrainingDate, today);

  // 5. 前天训练过但昨天没训练（gap=2，漏训 1 天）：
  // PRG-008 自动恢复一律不扣卡 → 统一走免费 Earn Back（streak 断裂于今日 0 点，
  // 仍处 24h 窗口内），恢复为原天数 + 1。冻结卡不因漏训自动消耗。
  if (gap === 2) {
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

  // 6. 断签 ≥ 2 天（gap ≥ 3）：Earn Back 窗口必已过期 → 重置为 1
  return {
    ...state,
    currentStreak: 1,
    longestStreak: Math.max(state.longestStreak, 1),
    streakBrokenAt: null,
    streakStartDate: today,
    lastTrainingDate: today,
    streakFreezeUsedToday: false,
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

/**
 * 手动使用冻结卡：为"今天"补一张出勤卡（主动请假）。
 *
 * PRG-008 起冻结卡只有这一条消耗路径：updateStreak 的 gap=2 分支已改为免费自动
 * 恢复（不扣卡）。手动使用的语义是
 * "今天不想/没空训练，提前花 1 张卡保住连续性"：将 lastTrainingDate 置为今天
 * （currentStreak 不 +1，避免用卡与训练等价），明日训练即按"昨日已训"续接 +1。
 *
 * 失败情形（返回 null）：今日已训练（无需保护）/ 无卡 / 今日已用过 /
 * 无可保护的 streak（从未训练或已断签 ≥ 2 天）。
 */
export function applyManualFreeze(state: StreakState): StreakState | null {
  const today = toLocalDateString();
  const yesterday = getYesterdayString();
  if (state.lastTrainingDate === today) return null;          // 今日已训练，无需保护
  if (state.streakFreezes <= 0 || state.streakFreezeUsedToday) return null;
  if (state.lastTrainingDate === null || state.currentStreak <= 0) return null; // 无 streak 可保护
  const gap = daysBetween(state.lastTrainingDate, today);
  // 仅当连续性仍可救（昨日已训或恰漏训 1 天）时可用；断签 ≥ 2 天已无可保护
  if (state.lastTrainingDate !== yesterday && gap !== 2) return null;
  return {
    ...state,
    streakFreezes: state.streakFreezes - 1,
    streakFreezeUsedToday: true,
    lastTrainingDate: today,
    streakBrokenAt: null,
  };
}

/**
 * 断裂发现检测（应用打开 / 首页挂载时调用）：
 * 昨日漏训（gap=2）时返回断裂时刻（今日 0 点 = 漏训日结束时刻）供写入
 * streakBrokenAt，驱动 UI 展示"⚡ Earn Back 窗口期"提示。
 *
 * 窗口语义与 updateStreak 严格一致：今天全天（距今日 0 点 < 24h）训练可恢复；
 * 明天（gap=3）则窗口必已过期、重置为 1。PRG-008 起自动恢复一律免费不扣卡，
 * 冻结卡数量不影响 Earn Back 提示（无论是否有卡，gap=2 均处免费恢复窗口）。
 *
 * @returns 断裂时刻时间戳；无需标记时返回 null
 */
export function computeStreakBrokenAt(state: StreakState): number | null {
  const today = toLocalDateString();
  if (state.streakBrokenAt !== null) return null;              // 已标记
  if (state.currentStreak <= 0 || state.lastTrainingDate === null) return null;
  if (state.lastTrainingDate === today) return null;           // 今日已训
  const gap = daysBetween(state.lastTrainingDate, today);
  if (gap !== 2) return null;                                  // 仅漏训 1 天的挡救窗口
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  return midnight.getTime();
}
