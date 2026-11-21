import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import FeltArena from './FeltArena';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_ELO, type EloRating } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * FeltArena 牌桌 Hero（jsdom，对照基准图 pc-home-r01）。
 *
 * 契约：
 * - 中央展示路径标语与铭文；
 * - 左右象牙铭牌展示 ELO（点击跳 /progress）与连续训练天数；
 * - 底部状态注展示段位、距下一段 ELO 与今日已答题数（非今日数据不计入）。
 */

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(opts: {
  elo?: Partial<EloRating>;
  currentStreak?: number;
  emotion?: Partial<typeof DEFAULT_EMOTION_STATE>;
}) {
  const standard: EloRating = { ...DEFAULT_ELO, ...opts.elo, variant: 'standard' };
  useProgressStore.setState({
    streak: { ...DEFAULT_STREAK_STATE, currentStreak: opts.currentStreak ?? 0 },
    onboarding: { ...DEFAULT_ONBOARDING },
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
  it('展示路径标语、铭文与 ELO 铭牌，点击铭牌跳 /progress', () => {
    seedStore({ elo: { overall: 1400, gamesPlayed: 12 }, currentStreak: 3 });

    const { container, getByLabelText } = renderArena();
    const text = container.textContent ?? '';

    expect(text).toContain('从入门到精通，一条清晰的牌桌之路');
    expect(text).toContain('知其道者 · 不惑于局');
    expect(text).toContain('1400');
    expect(text).toContain('连续训练');

    fireEvent.click(getByLabelText(/1400 ELO/));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress');
  });

  it('连续训练天数为 0 时铭牌仍展示 0', () => {
    const { container } = renderArena();

    expect(container.textContent).toContain('连续训练');
    expect(container.textContent).toContain('天');
  });

  it('状态注展示段位、距下一段 ELO 与今日已答题数', () => {
    seedStore({
      elo: { overall: 700, gamesPlayed: 5 },
      emotion: { dailyQuestionsDate: toLocalDateKey(Date.now()), dailyTotal: 3, dailyCorrect: 2 },
    });

    const { container } = renderArena();
    const text = container.textContent ?? '';

    expect(text).toContain('当前段位');
    expect(text).toContain('还需 100 ELO');
    expect(text).toContain('今日已答 3 题');
  });

  it('非今日答题数据不计入状态注', () => {
    seedStore({
      emotion: { dailyQuestionsDate: '2020-01-01', dailyTotal: 9, dailyCorrect: 9 },
    });

    const { container } = renderArena();

    expect(container.textContent).toContain('今日已答 0 题');
  });
});
