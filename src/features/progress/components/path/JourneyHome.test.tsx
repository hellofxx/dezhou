import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import JourneyHome from './JourneyHome';
import { useProgressStore, DEFAULT_STREAK_STATE, DEFAULT_ONBOARDING } from '../../store';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { DEFAULT_EMOTION_STATE } from '../../types';
import type { TrainingRecord } from '../../types';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * 学习路径首页（jsdom）。
 *
 * 契约：
 * - 新手收敛：totalSessions < 5 → 首访横幅 + 单一学习路径卡，不展示训练场网格；
 * - ≥ 5 → 六模块网格，不再展示学习路径卡；
 * - 速训三个入口带 mode 参数跳转，今日已训展示完成标记；
 * - 学习旅程图：阶段卡渲染完成度、锁定态与「下一步」链接（academy 数据源 mock）；
 * - eloRankUp 事件驱动段位庆祝弹窗。
 *
 * 学院数据源在测试环境未注册，故 mock progress 侧 hook（跨模块契约不变）。
 */

const { mockStages, mockCompleted } = vi.hoisted(() => ({
  mockStages: [
    {
      id: 's1',
      level: 1,
      title: '起步阶段',
      description: '熟悉牌桌语言与基础规则',
      icon: 'A',
      unlockRequirement: '',
      prerequisiteStageIds: [] as string[],
      lessonIds: ['l1-a', 'l1-b'],
    },
    {
      id: 's2',
      level: 2,
      title: '进阶阶段',
      description: '翻前决策与位置意识',
      icon: 'B',
      unlockRequirement: '',
      prerequisiteStageIds: ['s1'] as string[],
      lessonIds: ['l2-a'],
    },
  ],
  mockCompleted: [] as string[],
}));

vi.mock('@/features/progress/hooks/useAcademyDataSource', () => ({
  useAcademyLearningStages: () => ({ stages: mockStages }),
  useAcademyProgressSnapshot: () => ({ completedLessons: mockCompleted }),
}));

const FIVE_OLD_RECORDS = Array.from({ length: 5 }, (_, i) =>
  buildRecord(`old-${i}`, Date.now() - (i + 2) * 24 * 60 * 60 * 1000, 0.6),
);

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

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <JourneyHome />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mockCompleted.length = 0;
  seedStore([]);
});

afterEach(() => {
  cleanup();
  seedStore([]);
});

describe('JourneyHome 新手收敛与训练场', () => {
  it('零记录时展示首访横幅与学习路径卡，不展示训练场网格', () => {
    const { container } = renderHome();
    const text = container.textContent ?? '';

    expect(text).toContain('欢迎来到德州扑克训练平台');
    expect(text).toContain('你的学习路径');
    expect(container.querySelectorAll('.module-card')).toHaveLength(0);
    expect(text).not.toContain('六大核心模块');
  });

  it('已完成 ≥5 次训练时展示六模块训练场网格，不再展示学习路径卡', () => {
    seedStore(FIVE_OLD_RECORDS);

    const { container } = renderHome();
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

    const { container, getByText } = renderHome();
    expect(container.textContent).toContain('✓ 今日已完成');

    fireEvent.click(getByText('赔率'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe(
      '/academy/quick-drill?mode=odds&quick=true',
    );
  });

  it('首屏顺序：Hero → 连续天数 → 快速训练 → 学习旅程 → 首访引导', () => {
    const { container } = renderHome();
    const html = container.innerHTML;
    const hero = html.indexOf('felt-arena');
    const streak = html.indexOf('streak-rail');
    const quickDrill = html.indexOf('quick-drill-card');
    const journey = html.indexOf('journey-track');
    const banner = html.indexOf('first-visit-banner');

    expect(hero).toBeGreaterThan(-1);
    expect(streak).toBeGreaterThan(hero);
    expect(quickDrill).toBeGreaterThan(streak);
    expect(journey).toBeGreaterThan(quickDrill);
    // 首访引导让位：排在核心学习位之后
    expect(banner).toBeGreaterThan(journey);

    // 内容区欢迎语保留 h2；页面组件不渲染 h1（全站唯一 h1 归壳层）
    expect(container.querySelector('.felt-arena h2')).not.toBeNull();
    expect(container.querySelector('h1')).toBeNull();
  });
});

describe('JourneyHome 学习旅程图', () => {
  it('按阶段渲染完成度、锁定态与课时 chip', () => {
    mockCompleted.push('l1-a');
    seedStore(FIVE_OLD_RECORDS);

    const { container } = renderHome();
    const text = container.textContent ?? '';

    expect(text).toContain('学习旅程');
    expect(screen.getByRole('link', { name: '全部课程' }).getAttribute('href')).toBe('/academy');
    expect(text).toContain('起步阶段');
    expect(text).toContain('进阶阶段');
    // 第一段 1/2 课已完成；第二段前置未完成 → 锁定
    expect(text).toContain('1/2 课');
    expect(text).toContain('未解锁');
    expect(container.querySelectorAll('.stage-node')).toHaveLength(2);
    expect(container.querySelector('.stage-node.current .stage-name')?.textContent).toBe('起步阶段');
    expect(container.querySelector('.stage-node.locked .stage-name')?.textContent).toBe('进阶阶段');
  });

  it('下一步条指向首个未完成课时，锁定时段内课程不可点', () => {
    mockCompleted.push('l1-a');
    seedStore(FIVE_OLD_RECORDS);

    const { container } = renderHome();
    const nextLink = screen.getByRole('link', { name: '继续学习' });
    expect(nextLink.getAttribute('href')).toBe('/academy/lesson/l1-b');

    // 已解锁阶段的 chip 是链接（未完成课时优先），锁定阶段的 chip 不是
    const unlockedChips = container.querySelectorAll('a.lesson-chip');
    expect(Array.from(unlockedChips).map((el) => el.getAttribute('href'))).toEqual([
      '/academy/lesson/l1-b',
      '/academy/lesson/l1-a',
    ]);
    expect(container.querySelectorAll('.lesson-chip.locked')).toHaveLength(1);
  });

  it('全部阶段完成时隐藏下一步条', () => {
    mockCompleted.push('l1-a', 'l1-b', 'l2-a');
    seedStore(FIVE_OLD_RECORDS);

    const { container } = renderHome();

    expect(container.textContent).not.toContain('下一步');
    expect(screen.queryByRole('link', { name: '继续学习' })).toBeNull();
  });
});

describe('JourneyHome 段位庆祝', () => {
  it('eloRankUp 非空时弹段位庆祝，点击继续训练清除事件', () => {
    seedStore(FIVE_OLD_RECORDS, {
      eloRankUp: {
        from: { name: 'rookie', minScore: 0, maxScore: 500, color: '#000', description: 'rookie', icon: '🌱' },
        to: { name: 'entry', minScore: 500, maxScore: 800, color: '#000', description: 'entry', icon: '🎯' },
      },
    });

    const { baseElement, getByText } = renderHome();
    expect(baseElement.textContent).toContain('段位升级！');

    fireEvent.click(getByText('继续训练'));
    expect(useProgressStore.getState().eloRankUp).toBeNull();
  });
});
