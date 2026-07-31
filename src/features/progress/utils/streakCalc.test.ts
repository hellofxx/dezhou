import { describe, expect, it } from 'vitest';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  daysBetween,
  isEarnBackActive,
  checkNewMilestone,
  getTodayString,
  getYesterdayString,
  updateStreak,
  applyManualFreeze,
  computeStreakBrokenAt,
} from './streakCalc';
import type { StreakMilestones, StreakState } from '../types';

const freshMilestones = (): StreakMilestones => ({ day3: false, day7: false, day30: false, day100: false, day365: false });

describe('daysBetween', () => {
  it('同一天返回 0', () => {
    expect(daysBetween('2026-07-28', '2026-07-28')).toBe(0);
  });

  it('跨月边界：1月31日 → 2月1日 = 1天', () => {
    expect(daysBetween('2026-01-31', '2026-02-01')).toBe(1);
  });

  it('跨年边界：12月31日 → 次年1月1日 = 1天', () => {
    expect(daysBetween('2025-12-31', '2026-01-01')).toBe(1);
  });

  it('负值表示 date2 在 date1 之前', () => {
    expect(daysBetween('2026-07-30', '2026-07-28')).toBe(-2);
  });
});

describe('calculateLongestStreak', () => {
  it('空数组返回 0', () => {
    expect(calculateLongestStreak([])).toBe(0);
  });

  it('连续5天 → 5', () => {
    expect(calculateLongestStreak(['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'])).toBe(5);
  });

  it('中间有间隔 → 取最长段', () => {
    expect(calculateLongestStreak(['2026-07-01', '2026-07-02', '2026-07-05', '2026-07-06', '2026-07-07'])).toBe(3);
  });

  it('跨月连续：1月30,31 → 2月1,2 → 3', () => {
    expect(calculateLongestStreak(['2026-01-30', '2026-01-31', '2026-02-01', '2026-02-02'])).toBe(4);
  });
});

describe('calculateCurrentStreak', () => {
  it('空数组返回 0', () => {
    expect(calculateCurrentStreak([])).toBe(0);
  });

  it('包含今天 → streak ≥ 1', () => {
    expect(calculateCurrentStreak([getTodayString()])).toBe(1);
  });

  it('今天+昨天 → streak = 2', () => {
    expect(calculateCurrentStreak([getTodayString(), getYesterdayString()])).toBe(2);
  });

  it('仅前天 → streak = 0', () => {
    const d = new Date();
    d.setDate(d.getDate() - 2);
    const dayBefore = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(calculateCurrentStreak([dayBefore])).toBe(0);
  });
});

describe('isEarnBackActive', () => {
  it('null → false', () => {
    expect(isEarnBackActive(null)).toBe(false);
  });

  it('刚刚断裂 → true', () => {
    expect(isEarnBackActive(Date.now() - 1000)).toBe(true);
  });

  it('超过24h → false', () => {
    expect(isEarnBackActive(Date.now() - 25 * 60 * 60 * 1000)).toBe(false);
  });
});

describe('checkNewMilestone', () => {
  it('streak=3 且 day3 未达成 → 返回 3', () => {
    expect(checkNewMilestone(3, freshMilestones())).toBe(3);
  });

  it('streak=7 且 day3 已达成 → 返回 7', () => {
    const m = { ...freshMilestones(), day3: true };
    expect(checkNewMilestone(7, m)).toBe(7);
  });

  it('所有里程碑已达成 → null', () => {
    const all = { day3: true, day7: true, day30: true, day100: true, day365: true };
    expect(checkNewMilestone(400, all)).toBeNull();
  });
});

describe('updateStreak', () => {
  const relDayStr = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const baseState = (overrides: Partial<StreakState> = {}): StreakState => ({
    currentStreak: 0,
    longestStreak: 0,
    lastTrainingDate: null,
    streakFreezes: 2,
    streakFreezeUsedToday: false,
    milestones: freshMilestones(),
    lastMilestoneCelebrated: null,
    streakStartDate: null,
    streakBrokenAt: null,
    ...overrides,
  });

  it('首次训练 → 启动 Day 1（currentStreak=1，lastTrainingDate=今天）', () => {
    const next = updateStreak(baseState());
    expect(next.currentStreak).toBe(1);
    expect(next.lastTrainingDate).toBe(getTodayString());
    expect(next.streakStartDate).toBe(getTodayString());
    expect(next.streakBrokenAt).toBeNull();
  });

  it('今日已训练 → 幂等返回原对象', () => {
    const state = baseState({ currentStreak: 1, lastTrainingDate: getTodayString() });
    expect(updateStreak(state)).toBe(state);
  });

  it('昨日训练过 → streak + 1', () => {
    const state = baseState({ currentStreak: 3, longestStreak: 3, lastTrainingDate: getYesterdayString() });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(4);
    expect(next.longestStreak).toBe(4);
    expect(next.lastTrainingDate).toBe(getTodayString());
  });

  it('gap=2 且有冻结卡 → 自动扣 1 张续接', () => {
    const state = baseState({ currentStreak: 5, longestStreak: 5, lastTrainingDate: relDayStr(-2), streakFreezes: 2 });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(6);
    expect(next.streakFreezes).toBe(1);
    expect(next.streakFreezeUsedToday).toBe(true);
    expect(next.lastTrainingDate).toBe(getTodayString());
  });

  it('gap=2 且无冻结卡 → Earn Back 恢复为原天数 + 1', () => {
    const state = baseState({ currentStreak: 5, longestStreak: 5, lastTrainingDate: relDayStr(-2), streakFreezes: 0 });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(6);
    expect(next.lastTrainingDate).toBe(getTodayString());
    expect(next.streakBrokenAt).toBeNull();
  });

  it('断签 2 天（gap=3）→ 重置为 1，首次训练即时计入', () => {
    const state = baseState({ currentStreak: 15, longestStreak: 15, lastTrainingDate: relDayStr(-3), streakFreezes: 5 });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(1);
    expect(next.longestStreak).toBe(15);
    expect(next.lastTrainingDate).toBe(getTodayString());
    expect(next.streakStartDate).toBe(getTodayString());
    expect(next.streakFreezes).toBe(5); // 长断签不消耗冻结卡
  });

  it('断签 30 天 → 同日重复训练不能恢复原 streak（防旧版同日两训漏洞）', () => {
    const state = baseState({ currentStreak: 15, longestStreak: 15, lastTrainingDate: relDayStr(-30) });
    const first = updateStreak(state);
    expect(first.currentStreak).toBe(1);
    const second = updateStreak(first);
    expect(second).toBe(first); // 同日幂等
  });

  it('历史断裂状态（旧版 streakBrokenAt 在 24h 内）→ Earn Back 恢复 + 1', () => {
    const state = baseState({ currentStreak: 8, longestStreak: 8, lastTrainingDate: relDayStr(-5), streakBrokenAt: Date.now() - 1000 });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(9);
    expect(next.streakBrokenAt).toBeNull();
  });

  it('历史断裂状态超 24h → 重置为 1', () => {
    const state = baseState({ currentStreak: 8, longestStreak: 8, lastTrainingDate: relDayStr(-5), streakBrokenAt: Date.now() - 25 * 3600 * 1000 });
    const next = updateStreak(state);
    expect(next.currentStreak).toBe(1);
    expect(next.streakBrokenAt).toBeNull();
  });
});

describe('applyManualFreeze（手动使用冻结卡：为今天请假）', () => {
  const relDayStr = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const baseState = (overrides: Partial<StreakState> = {}): StreakState => ({
    currentStreak: 5,
    longestStreak: 5,
    lastTrainingDate: getYesterdayString(),
    streakFreezes: 2,
    streakFreezeUsedToday: false,
    milestones: freshMilestones(),
    lastMilestoneCelebrated: null,
    streakStartDate: null,
    streakBrokenAt: null,
    ...overrides,
  });

  it('昨日已训 + 有卡 → 成功：扣 1 卡、lastTrainingDate=今天、streak 不变', () => {
    const next = applyManualFreeze(baseState());
    expect(next).not.toBeNull();
    expect(next!.streakFreezes).toBe(1);
    expect(next!.streakFreezeUsedToday).toBe(true);
    expect(next!.lastTrainingDate).toBe(getTodayString());
    expect(next!.currentStreak).toBe(5); // 请假不等价于训练，不 +1
  });

  it('请假后明日训练 → 按昨日已训续接 +1（链路自洽）', () => {
    const afterFreeze = applyManualFreeze(baseState())!;
    // 模拟明日：lastTrainingDate 变成"昨天"
    const tomorrowView = { ...afterFreeze, lastTrainingDate: getYesterdayString(), streakFreezeUsedToday: false };
    const next = updateStreak(tomorrowView);
    expect(next.currentStreak).toBe(6);
  });

  it('今日已训练 → 失败（无需保护）', () => {
    expect(applyManualFreeze(baseState({ lastTrainingDate: getTodayString() }))).toBeNull();
  });

  it('无卡 / 今日已用 → 失败', () => {
    expect(applyManualFreeze(baseState({ streakFreezes: 0 }))).toBeNull();
    expect(applyManualFreeze(baseState({ streakFreezeUsedToday: true }))).toBeNull();
  });

  it('从未训练 / 断签 ≥2 天 → 失败（无可保护）', () => {
    expect(applyManualFreeze(baseState({ lastTrainingDate: null, currentStreak: 0 }))).toBeNull();
    expect(applyManualFreeze(baseState({ lastTrainingDate: relDayStr(-3) }))).toBeNull();
  });

  it('漏训 1 天（gap=2）→ 成功补救，streak 保留', () => {
    const next = applyManualFreeze(baseState({ lastTrainingDate: relDayStr(-2) }));
    expect(next).not.toBeNull();
    expect(next!.currentStreak).toBe(5);
    expect(next!.lastTrainingDate).toBe(getTodayString());
  });
});

describe('computeStreakBrokenAt（断裂发现检测）', () => {
  const relDayStr = (offset: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const baseState = (overrides: Partial<StreakState> = {}): StreakState => ({
    currentStreak: 5,
    longestStreak: 5,
    lastTrainingDate: relDayStr(-2),
    streakFreezes: 0,
    streakFreezeUsedToday: false,
    milestones: freshMilestones(),
    lastMilestoneCelebrated: null,
    streakStartDate: null,
    streakBrokenAt: null,
    ...overrides,
  });

  it('gap=2 且无卡 → 返回今日 0 点时间戳（今天全天在 24h 窗口内）', () => {
    const brokenAt = computeStreakBrokenAt(baseState());
    expect(brokenAt).not.toBeNull();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);
    expect(brokenAt).toBe(midnight.getTime());
    // 与 updateStreak 窗口语义一致：今日训练可恢复
    expect(isEarnBackActive(brokenAt!)).toBe(true);
  });

  it('有冻结卡 → 不标记（自动扣减兑底）', () => {
    expect(computeStreakBrokenAt(baseState({ streakFreezes: 2 }))).toBeNull();
  });

  it('今日已训 / 昨日已训（未断） → 不标记', () => {
    expect(computeStreakBrokenAt(baseState({ lastTrainingDate: getTodayString() }))).toBeNull();
    expect(computeStreakBrokenAt(baseState({ lastTrainingDate: getYesterdayString() }))).toBeNull();
  });

  it('断签 ≥2 天（gap≥3）/ 无 streak / 已标记 → 不标记', () => {
    expect(computeStreakBrokenAt(baseState({ lastTrainingDate: relDayStr(-3) }))).toBeNull();
    expect(computeStreakBrokenAt(baseState({ currentStreak: 0 }))).toBeNull();
    expect(computeStreakBrokenAt(baseState({ streakBrokenAt: Date.now() }))).toBeNull();
  });
});
