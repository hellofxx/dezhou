import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import FeltArena from './FeltArena';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_ELO, type EloRating } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '../../types';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * FeltArena 牌桌 Hero（jsdom）。
 *
 * 契约：
 * - ELO 段位徽章点击跳 /progress；
 * - 「今日牌局 · Day N」取 streak.currentStreak（0 时兜底 Day 1）；
 * - 今日进度 = 今日已答题 / 每日目标（onboarding.dailyGoalMinutes 5/20，其余 10）；
 *   XMOD-010：当日已记训练日但无真实答题时保底为 1，未活跃时为 0；
 * - 每日目标卡 completed 只取今日数据。
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

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(opts: {
  records?: TrainingRecord[];
  elo?: Partial<EloRating>;
  dailyGoalMinutes?: 5 | 10 | 20;
  currentStreak?: number;
  lastTrainingDate?: string | null;
  emotion?: Partial<typeof DEFAULT_EMOTION_STATE>;
}) {
  const standard: EloRating = { ...DEFAULT_ELO, ...opts.elo, variant: 'standard' };
  useProgressStore.setState({
    records: opts.records ?? [],
    streak: {
      ...DEFAULT_STREAK_STATE,
      currentStreak: opts.currentStreak ?? 0,
      lastTrainingDate: opts.lastTrainingDate ?? null,
    },
    onboarding: { ...DEFAULT_ONBOARDING, dailyGoalMinutes: opts.dailyGoalMinutes ?? 10 },
    emotion: { ...DEFAULT_EMOTION_STATE, ...opts.emotion },
    eloByVariant: {
      standard,
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' },
    },
    activeVariant: 'standard',
  });
}

function renderArena() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <FeltArena />
      <LocationProbe />
    </MemoryRouter>,
  );
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

describe('FeltArena 牌桌 Hero', () => {
  it('展示段位徽章与欢迎语，点击徽章跳 /progress', () => {
    seedStore({ elo: { overall: 1400, gamesPlayed: 12 }, currentStreak: 3 });

    const { container, getByLabelText } = renderArena();
    const text = container.textContent ?? '';

    expect(text).toContain('欢迎回到牌桌');
    expect(text).toContain('知其道者 · 不惑于局');
    expect(text).toContain('今日牌局 · Day 3');

    fireEvent.click(getByLabelText(/1400 ELO/));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress');
  });

  it('连续天数为 0 时今日牌局兜底为 Day 1', () => {
    const { container } = renderArena();

    expect(container.textContent).toContain('今日牌局 · Day 1');
  });

  it('展示总手数 / 综合正确率 / 今日进度三项指标', () => {
    seedStore({
      records: [buildRecord('r1', new Date(2026, 4, 13, 9, 0, 0).getTime())],
      lastTrainingDate: toLocalDateKey(Date.now()),
      emotion: { dailyQuestionsDate: toLocalDateKey(Date.now()), dailyTotal: 3, dailyCorrect: 2 },
    });

    const { container } = renderArena();
    const text = container.textContent ?? '';

    expect(text).toContain('训练总手');
    expect(text).toContain('综合正确率');
    expect(text).toContain('80.0%');
    // 今日进度 3 / 10（默认目标 10）
    expect(text).toContain('3 / 10');
    expect(text).toContain('+1 本周');
  });

  it('当日已记训练日但无答题时今日进度保底为 1', () => {
    seedStore({ lastTrainingDate: toLocalDateKey(Date.now()) });

    const { container } = renderArena();

    expect(container.textContent).toContain('1 / 10');
  });

  it('当日未活跃时今日进度为 0，昨日计数不计入目标卡', () => {
    seedStore({
      lastTrainingDate: null,
      emotion: { dailyQuestionsDate: '2020-01-01', dailyTotal: 9, dailyCorrect: 9 },
    });

    const { container } = renderArena();

    expect(container.textContent).toContain('0 / 10');
    expect(container.textContent).toContain('0/10 项任务');
  });

  it('每日目标取 onboarding 设定（5 分钟目标 → 5 题）', () => {
    seedStore({
      dailyGoalMinutes: 5,
      lastTrainingDate: toLocalDateKey(Date.now()),
      emotion: { dailyQuestionsDate: toLocalDateKey(Date.now()), dailyTotal: 2, dailyCorrect: 2 },
    });

    const { container } = renderArena();

    expect(container.textContent).toContain('2 / 5');
  });
});
