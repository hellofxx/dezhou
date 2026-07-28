import { describe, expect, it } from 'vitest';
import {
  calculateCurrentStreak,
  calculateLongestStreak,
  daysBetween,
  isEarnBackActive,
  checkNewMilestone,
  getTodayString,
  getYesterdayString,
} from './streakCalc';
import type { StreakMilestones } from '../types';

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
