import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import ProgressPage from './ProgressPage';
import { useProgressStore, DEFAULT_STREAK_STATE } from '../../store';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { DIFFICULTY_THRESHOLDS } from '../../constants';
import type { TrainingRecord } from '../../types';

/**
 * ProgressPage 进度统计页（jsdom）。
 *
 * 契约：
 * - 四项核心指标只由 ProgressHero 呈现（不再有重复的指标卡网格），最近训练表格由
 *   progress store 记录派生（空态给引导文案）；
 * - 模块维度明细只由 ModuleStatsPanel 呈现（含「各模块统计」小标题）；
 * - 难度档位按 DIFFICULTY_THRESHOLDS 判定（与 DifficultyIndicator 单源，避免自相矛盾）；
 * - 两个模块统计入口导航到 /progress/range 与 /progress/gto。
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
  return <div data-probe>{location.pathname}</div>;
}

function seedStore(records: TrainingRecord[], currentStreak = 2) {
  useProgressStore.setState({
    records,
    streak: { ...DEFAULT_STREAK_STATE, currentStreak, longestStreak: currentStreak },
    eloByVariant: {
      standard: { ...DEFAULT_ELO, variant: 'standard' },
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' },
    },
    activeVariant: 'standard',
  });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/progress']}>
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

describe('ProgressPage 进度统计页', () => {
  it('空记录时展示副标语与最近训练空态', () => {
    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('追踪你的训练进度与成长');
    expect(text).toContain('总训练次数');
    expect(text).toContain('最近训练记录');
    expect(text).toContain('暂无训练记录，开始你的第一次训练吧！');
    // 无模块数据时不渲染模块统计面板
    expect(text).not.toContain('各模块统计');
  });

  it('有记录时渲染汇总指标与最近训练表格', () => {
    const now = Date.now();
    seedStore(
      [
        buildRecord('r1', 8, 10, now),
        buildRecord('r2', 5, 10, now - DAY, 'pot-odds'),
      ],
      3,
    );

    const { container } = renderPage();
    const text = container.textContent ?? '';

    expect(text).toContain('总训练次数');
    expect(text).toContain('2');
    // 综合正确率 (8+5)/20 = 65.0%
    expect(text).toContain('65.0%');
    // 最近训练表格列头
    expect(text).toContain('模块');
    expect(text).toContain('模式');
    expect(text).toContain('用时');
    expect(text).toContain('正确率');
    // 模块名走 i18n（useModuleLabel）
    expect(text).toContain('手牌范围训练');
    expect(text).toContain('赔率计算器');
    expect(text).toContain('连续天数');
    expect(text).toContain('3');
    // 模块明细收敛到 ModuleStatsPanel
    expect(text).toContain('各模块统计');
    // 去重回归锁：四项指标卡（brass-rail 卡片）已从页面移除，指标只在 ProgressHero
    expect(container.querySelectorAll('.brass-rail')).toHaveLength(0);
    expect(container.querySelectorAll('.rank-plaque-hero')).toHaveLength(1);
  });

  it('难度档位按 overallAccuracy 阈值判定', () => {
    seedStore([buildRecord('r1', 95, 100)], 1);

    const { container } = renderPage();
    const active = container.querySelector('[aria-current="step"]');

    expect(active).toBeTruthy();
    // 95% > advanced(85%) → 高级
    expect(active?.textContent).toContain('高级');
    expect(DIFFICULTY_THRESHOLDS.advanced).toBeLessThan(0.95);
  });

  it('模块统计入口分别跳转 /progress/range 与 /progress/gto', () => {
    const { container, getByText } = renderPage();

    fireEvent.click(getByText('手牌范围训练详情'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress/range');

    // 返回列表再点第二个入口（同一次渲染内的按钮仍可点击）
    fireEvent.click(getByText('GTO 模拟器详情'));
    expect(container.querySelector('[data-probe]')?.textContent).toBe('/progress/gto');
  });
});
