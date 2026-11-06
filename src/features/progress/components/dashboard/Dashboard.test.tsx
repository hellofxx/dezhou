import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import Dashboard from './Dashboard';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '../../types';
import { ACHIEVEMENTS } from '../../data/achievements';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * Dashboard 首页（jsdom）。
 *
 * 契约：
 * - totalSessions < 5 走新手收敛（首访横幅 + 单一学习路径卡），不展示训练场网格；
 * - ≥ 5 时展示六模块网格，不再展示学习路径卡；
 * - 3 分钟快速训练三个入口带 mode 参数跳转；
 * - 最近训练列表受时间范围筛选器控制，空态给引导；
 * - 成就入口展示解锁进度并打开成就墙；eloRankUp 事件驱动段位庆祝弹窗。
 */

const DAY = 24 * 60 * 60 * 1000;

function buildRecord(
  id: string,
  createdAt: number,
  accuracy: number,
  module: TrainingRecord['module'] = 'range-trainer',
): TrainingRecord {
  const total = 10;
  const correct = Math.round(accuracy * total);
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
      accuracy,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

function LocationProbe() {
  const location = useLocation();
  return <div data-probe>{`${location.pathname}${location.search}`}</div>;
}

function seedStore(records: TrainingRecord[], overrides: Record<string, unknown> = {}) {
  useProgressStore.setState({
    records,
    streak: { ...DEFAULT_STREAK_STATE },
    emotion: { ...DEFAULT_EMOTION_STATE },
    onboarding: { ...DEFAULT_ONBOARDING },
    eloRankUp: null,
    unlockedAchievements: [],
    achievementUnlockDates: {},
    dismissedRecommendations: [],
    reviewItems: [],
    lastDismissalDate: toLocalDateKey(Date.now()),
    activeVariant: 'standard',
    eloByVariant: {
      standard: { ...DEFAULT_ELO, variant: 'standard' },
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' },
    },
    ...overrides,
  });
}

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Dashboard />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const FIVE_OLD_RECORDS = Array.from({ length: 5 }, (_, i) =>
  buildRecord(`old-${i}`, Date.now() - (i + 2) * DAY, 0.6),
);

beforeEach(() => seedStore([]));

afterEach(() => {
  cleanup();
  seedStore([]);
});

describe('Dashboard 新手收敛与训练场', () => {
  it('零记录时展示首访横幅与学习路径卡，不展示训练场网格', () => {
    const { container } = renderDashboard();
    const text = container.textContent ?? '';

    expect(text).toContain('欢迎来到德州扑克训练平台');
    expect(text).toContain('你的学习路径');
    expect(container.querySelectorAll('.module-card')).toHaveLength(0);
    expect(text).not.toContain('六大核心模块');
  });

  it('已完成 ≥5 次训练时展示六模块训练场网格，不再展示学习路径卡', () => {
    seedStore(FIVE_OLD_RECORDS);

    const { container } = renderDashboard();
    const text = container.textContent ?? '';

    expect(container.querySelectorAll('.module-card')).toHaveLength(6);
    expect(text).toContain('训练场');
    expect(text).toContain('六大核心模块');
    expect(text).not.toContain('你的学习路径');
    expect(text).not.toContain('欢迎来到德州扑克训练平台');
  });

  it('三个快速训练入口带 mode 参数跳转，且今日已训展示完成标记', () => {
    seedStore(FIVE_OLD_RECORDS, {
      streak: { ...DEFAULT_STREAK_STATE, lastTrainingDate: toLocalDateKey(Date.now()) },
    });

    const { container, getByText } = renderDashboard();
    expect(container.textContent).toContain('✓ 今日已完成');

    fireEvent.click(getByText('赔率'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe(
      '/academy/quick-drill?mode=odds&quick=true',
    );
  });

  it('首屏顺序：Hero → 连续天数 → 快速训练 → 首访引导', () => {
    const { container } = renderDashboard();
    const html = container.innerHTML;
    const hero = html.indexOf('felt-arena');
    const streak = html.indexOf('streak-rail');
    const quickDrill = html.indexOf('quick-drill-card');
    const banner = html.indexOf('first-visit-banner');

    expect(hero).toBeGreaterThan(-1);
    expect(streak).toBeGreaterThan(hero);
    // 首访引导让位：排在快速训练之后，不再插在 Hero 与连续天数之间
    expect(quickDrill).toBeGreaterThan(streak);
    expect(banner).toBeGreaterThan(quickDrill);

    // 内容区欢迎语保留 h2；页面组件不渲染 h1（全站唯一 h1 归壳层）
    expect(container.querySelector('.felt-arena h2')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
  });
});

describe('Dashboard 最近训练时间范围筛选', () => {
  /** 「最近训练」面板文本（含筛选汇总指标），用于排除首屏其他同数值文案的干扰 */
  function recentPanelText(container: HTMLElement): string {
    const panel = Array.from(container.querySelectorAll<HTMLElement>('.panel')).find((el) =>
      (el.textContent ?? '').includes('训练次数'),
    );
    return panel?.textContent ?? '';
  }

  it('默认按近 30 天过滤，切到「全部」后纳入更早记录', () => {
    const recent = buildRecord('recent', Date.now() - 60 * 1000, 0.4);
    // 40 天前的记录：默认 30 天窗口外，仅「全部 / 近90天」可见
    const ancient = buildRecord('ancient', Date.now() - 40 * DAY, 0.9);
    const withinWindow = [2, 3, 4, 5, 6].map((d) =>
      buildRecord(`w${d}`, Date.now() - d * DAY, 0.6),
    );
    seedStore([recent, ...withinWindow.slice(0, 4), ancient, withinWindow[4]!]);

    const { container, getByText } = renderDashboard();

    // 6 次（40 天前那条被 30 天窗口排除）
    expect(recentPanelText(container)).toContain('训练次数6');

    fireEvent.click(getByText('全部'));

    expect(recentPanelText(container)).toContain('训练次数7');
  });

  it('列表按时间倒序，最新的记录排在第一行（回归锁）', () => {
    const newest = buildRecord('newest', Date.now() - 60 * 1000, 0.4);
    const older = buildRecord('older', Date.now() - 10 * DAY, 0.6);
    seedStore([older, newest]);

    const { container } = renderDashboard();
    const panel = recentPanelText(container);

    // 写入顺序为旧→新，展示必须新→旧
    expect(panel.indexOf('40.0%')).toBeGreaterThan(-1);
    expect(panel.indexOf('40.0%')).toBeLessThan(panel.indexOf('60.0%'));
    expect(panel).toContain('今天');
  });

  it('无记录时最近训练给空态引导', () => {
    const { container } = renderDashboard();

    expect(container.textContent).toContain('暂无训练记录');
    expect(container.textContent).toContain('完成任意训练后，这里会展示你的历史成绩。');
  });
});

describe('Dashboard 成就入口与段位庆祝', () => {
  it('展示成就解锁进度并打开成就墙', () => {
    seedStore(FIVE_OLD_RECORDS, {
      unlockedAchievements: [ACHIEVEMENTS[0]!.id],
      achievementUnlockDates: { [ACHIEVEMENTS[0]!.id]: Date.now() },
    });

    const { container, getByLabelText, baseElement } = renderDashboard();

    expect(container.textContent).toContain('新成就解锁');
    fireEvent.click(getByLabelText('成就'));
    expect(baseElement.textContent).toContain('成就墙');
  });

  it('eloRankUp 非空时弹段位庆祝，点击继续训练清除事件', () => {
    seedStore(FIVE_OLD_RECORDS, {
      eloRankUp: {
        from: { name: 'rookie', minScore: 0, maxScore: 500, color: '#000', description: 'rookie', icon: '🌱' },
        to: { name: 'entry', minScore: 500, maxScore: 800, color: '#000', description: 'entry', icon: '🎯' },
      },
    });

    const { baseElement, getByText } = renderDashboard();
    expect(baseElement.textContent).toContain('段位升级！');

    fireEvent.click(getByText('继续训练'));
    expect(useProgressStore.getState().eloRankUp).toBeNull();
  });
});
