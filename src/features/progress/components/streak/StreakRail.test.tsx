import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import StreakRail from './StreakRail';
import { useProgressStore, DEFAULT_STREAK_STATE } from '../../store';
import { DEFAULT_EMOTION_STATE } from '../../types';
import type { TrainingRecord } from '../../types';

/**
 * StreakRail 周轨道条（jsdom）。
 *
 * 契约：
 * - 连续天数 / 冻结卡 / 今日正确率三组指标来自 progress store（不是各组件私算）；
 * - 「今日正确率」只在 emotion.dailyQuestionsDate 是今天时展示，昨日残留数据显示 `--`；
 * - 7 日圆点按当前周（周一→周日）标记 today / done / missed；
 * - 7 日正确率微图（Sparkline）无数据时不渲染。
 *
 * 时间固定为 2026-05-13（周三），消除「今天是周几」导致的断言漂移。
 */

function buildRecord(id: string, createdAt: number): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: 10,
      correctAnswers: 8,
      accuracy: 0.8,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

function seedStore(overrides: {
  records?: TrainingRecord[];
  dailyTotal?: number;
  dailyCorrect?: number;
  dailyQuestionsDate?: string | null;
  streakFreezes?: number;
}) {
  useProgressStore.setState({
    records: overrides.records ?? [],
    streak: {
      ...DEFAULT_STREAK_STATE,
      currentStreak: 5,
      longestStreak: 9,
      streakFreezes: overrides.streakFreezes ?? 3,
      lastTrainingDate: '2026-05-13',
    },
    emotion: {
      ...DEFAULT_EMOTION_STATE,
      dailyTotal: overrides.dailyTotal ?? 0,
      dailyCorrect: overrides.dailyCorrect ?? 0,
      dailyQuestionsDate: overrides.dailyQuestionsDate ?? null,
    },
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(2026, 4, 13, 10, 0, 0));
  seedStore({});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  seedStore({});
});

describe('StreakRail 周轨道条', () => {
  it('展示连续天数、冻结卡与今日正确率', () => {
    seedStore({ dailyTotal: 10, dailyCorrect: 7, dailyQuestionsDate: '2026-05-13' });

    const { container } = render(<StreakRail />);
    const text = container.textContent ?? '';

    expect(text).toContain('连续天数');
    expect(text).toContain('5');
    expect(text).toContain('冻结卡');
    expect(text).toContain('x3');
    expect(text).toContain('今日正确率');
    expect(text).toContain('70%');
  });

  it('昨日残留的每日计数不被当作今日正确率（展示 --）', () => {
    seedStore({ dailyTotal: 10, dailyCorrect: 9, dailyQuestionsDate: '2026-05-12' });

    const { container } = render(<StreakRail />);
    const text = container.textContent ?? '';

    expect(text).toContain('--');
    expect(text).not.toContain('90%');
  });

  it('7 日圆点按当前周标记今天 / 已训练 / 休息', () => {
    // 周二（2026-05-12）有训练记录，周三为今天
    seedStore({ records: [buildRecord('tue', new Date(2026, 4, 12, 20, 0, 0).getTime())] });

    const { container } = render(<StreakRail />);
    const dots = Array.from(container.querySelectorAll('.streak-dot'));

    expect(dots).toHaveLength(7);
    const todayDots = dots.filter((d) => d.classList.contains('today'));
    expect(todayDots).toHaveLength(1);
    expect(todayDots[0]!.textContent).toContain('今天');

    const doneDots = dots.filter((d) => d.classList.contains('done'));
    expect(doneDots).toHaveLength(1);
    expect(doneDots[0]!.textContent).toContain('✓');
    // 周一无记录 → 休息
    expect(dots[0]!.classList.contains('missed')).toBe(true);
    expect(dots[0]!.textContent).toContain('休');
  });

  it('近 7 天有正确率数据时渲染微图，无记录时不渲染', () => {
    const empty = render(<StreakRail />);
    expect(empty.container.querySelector('svg.sparkline')).toBeNull();
    cleanup();

    seedStore({ records: [buildRecord('tue', new Date(2026, 4, 12, 20, 0, 0).getTime())] });
    const withData = render(<StreakRail />);
    expect(withData.container.querySelector('svg.sparkline')).not.toBeNull();
  });

  it('挂载时检测 streak 断裂并写入 streakBrokenAt（漏训 1 天窗口）', () => {
    useProgressStore.setState({
      streak: {
        ...DEFAULT_STREAK_STATE,
        currentStreak: 4,
        // 昨日漏训（gap = 2），今日仍在免费恢复窗口
        lastTrainingDate: '2026-05-11',
        streakBrokenAt: null,
      },
    });

    render(<StreakRail />);

    const brokenAt = useProgressStore.getState().streak.streakBrokenAt;
    expect(brokenAt).toBe(new Date(2026, 4, 13, 0, 0, 0).getTime());
    // 微图数据源不受影响：无记录仍不渲染
  });

  it('今日已训练（gap=1）时不标记断裂', () => {
    useProgressStore.setState({
      streak: { ...DEFAULT_STREAK_STATE, currentStreak: 4, lastTrainingDate: '2026-05-12' },
    });

    render(<StreakRail />);

    expect(useProgressStore.getState().streak.streakBrokenAt).toBeNull();
  });

  it('冻结卡为 0 时角标显示 x0', () => {
    seedStore({ streakFreezes: 0 });

    const { container } = render(<StreakRail />);

    expect(container.textContent).toContain('x0');
  });
});
