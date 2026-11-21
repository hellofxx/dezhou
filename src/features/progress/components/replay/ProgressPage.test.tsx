import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ProgressPage from './ProgressPage';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { DIFFICULTY_THRESHOLDS } from '../../constants';
import { DEFAULT_EMOTION_STATE } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';
import type { TrainingRecord } from '../../types';

/**
 * ProgressPage 进度中心（jsdom）。
 *
 * 契约：
 * - 三分区 tablist（概览 / 回放 / 排行），aria-selected 与 `?tab=` 双向同步；
 * - 概览：四项核心指标只由 ProgressHero 呈现，难度档位按 DIFFICULTY_THRESHOLDS 判定，
 *   模块统计入口导航到 /progress/range 与 /progress/gto；
 * - 回放：最近训练卡（时间范围筛选 + 区间汇总 + 空态）与手牌复盘链接；
 * - 排行：直接渲染本模块 Leaderboard。
 *
 * 懒加载区块（AccuracyChart / WeaknessAnalysis）在 jsdom 中先落 Suspense 骨架，
 * 本测试只断言同步可见的页面骨架与导航契约。
 */

const DAY = 24 * 60 * 60 * 1000;

function buildRecord(
  id: string,
  correct: number,
  total: number,
  createdAt = Date.now(),
  module: TrainingRecord['module'] = 'range-trainer',
): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module,
      totalQuestions: total,
      correctAnswers: correct,
      accuracy: total > 0 ? correct / total : 0,
      averageTime: 4200,
      timestamp: createdAt,
      details: [],
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{`${location.pathname}${location.search}`}</div>;
}

function seedStore(records: TrainingRecord[], currentStreak = 2) {
  useProgressStore.setState({
    records,
    streak: { ...DEFAULT_STREAK_STATE, currentStreak, longestStreak: currentStreak },
    emotion: { ...DEFAULT_EMOTION_STATE },
    onboarding: { ...DEFAULT_ONBOARDING },
    unlockedAchievements: [],
    achievementUnlockDates: {},
    lastDismissalDate: toLocalDateKey(Date.now()),
    eloByVariant: {
      standard: { ...DEFAULT_ELO, variant: 'standard' },
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' },
    },
    activeVariant: 'standard',
  });
}

function renderPage(entry = '/progress') {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <ProgressPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => seedStore([]));

afterEach(() => {
  cleanup();
  seedStore([]);
});

describe('ProgressPage 进度中心', () => {
  it('默认展示概览分区：副标语 + 三项分区 tab', () => {
    const { container, getByRole } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('追踪你的训练进度与成长');
    expect(getByRole('tab', { name: '概览' }).getAttribute('aria-selected')).toBe('true');
    expect(getByRole('tab', { name: '回放' })).toBeTruthy();
    expect(getByRole('tab', { name: '排行' })).toBeTruthy();
    // 空记录时不渲染模块统计面板
    expect(text).not.toContain('各模块统计');
  });

  it('有记录时渲染汇总指标，难度档位按阈值判定', () => {
    seedStore([buildRecord('r1', 95, 100)], 3);

    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('总训练次数');
    expect(text).toContain('95.0%');
    expect(text).toContain('各模块统计');
    // 去重回归锁：四项指标卡只在 ProgressHero
    expect(container.querySelectorAll('.brass-rail')).toHaveLength(0);
    expect(container.querySelectorAll('.rank-plaque-hero')).toHaveLength(1);

    const active = container.querySelector('[aria-current="step"]');
    expect(active).toBeTruthy();
    expect(active?.textContent).toContain('高级');
    expect(DIFFICULTY_THRESHOLDS.advanced).toBeLessThan(0.95);
  });

  it('模块统计入口分别跳转 /progress/range 与 /progress/gto', () => {
    const { container, getByText } = renderPage();

    fireEvent.click(getByText('手牌范围训练详情'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress/range');

    fireEvent.click(getByText('GTO 模拟器详情'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress/gto');
  });

  it('切到回放分区：最近训练空态 + 手牌复盘链接，地址同步 ?tab=replay', () => {
    const { container, getByRole, getByText } = renderPage();

    fireEvent.click(getByRole('tab', { name: '回放' }));

    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress?tab=replay');
    expect(getByRole('tab', { name: '回放' }).getAttribute('aria-selected')).toBe('true');
    expect(container.textContent ?? '').toContain('最近训练');
    expect(container.textContent ?? '').toContain('暂无训练记录');
    // 时间范围筛选器（7 天 / 30 天 / 90 天 / 全部）
    expect(getByText('7 天')).toBeTruthy();
    expect(getByText('全部')).toBeTruthy();
    // 手牌复盘只做链接（跨模块不嵌入）
    const handLinks = Array.from(container.querySelectorAll('a[href="/hand-history"]'));
    expect(handLinks.length).toBeGreaterThan(0);
  });

  it('回放分区按时间范围筛选最近训练并给出区间汇总', () => {
    const now = Date.now();
    seedStore(
      [
        buildRecord('r1', 8, 10, now),
        buildRecord('r2', 5, 10, now - DAY, 'pot-odds'),
        buildRecord('r3', 1, 10, now - 60 * DAY, 'gto-simulator'),
      ],
      3,
    );

    const { container, getByRole, getByText } = renderPage('/progress?tab=replay');

    // 默认 30 天窗口：60 天前的 gto 记录被排除
    expect(container.textContent ?? '').toContain('赔率计算器');
    expect(container.textContent ?? '').not.toContain('GTO 模拟器');

    fireEvent.click(getByText('全部'));
    expect(container.textContent ?? '').toContain('GTO 模拟器');
    expect(getByRole('tab', { name: '全部' }).getAttribute('aria-selected')).toBe('true');
  });

  it('切到排行分区：渲染本模块榜单', () => {
    const { container, getByRole } = renderPage();

    fireEvent.click(getByRole('tab', { name: '排行' }));

    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress?tab=leaderboard');
    expect(container.textContent ?? '').toContain('排行榜');
    expect(container.textContent ?? '').toContain('Vera Kaine');
  });

  it('未知 ?tab= 回落到概览', () => {
    const { getByRole } = renderPage('/progress?tab=nope');

    expect(getByRole('tab', { name: '概览' }).getAttribute('aria-selected')).toBe('true');
  });
});
