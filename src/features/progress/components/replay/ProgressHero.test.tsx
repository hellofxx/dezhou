import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import ProgressHero from './ProgressHero';
import { useProgressStore } from '../../store';
import { DEFAULT_ELO, type EloRating } from '@/shared/types/elo';
import type { StatsSummary } from '../../types';

/**
 * ProgressHero 战绩牌匾（jsdom）。
 *
 * 契约：段位与 ELO 分数来自当前活动变体；gamesPlayed=0（无 ELO 数据）时
 * 分数展示占位符且不展示段位描述，四项核心指标恒取自 summary。
 */

const SUMMARY: StatsSummary = {
  totalSessions: 12,
  totalQuestions: 120,
  overallAccuracy: 0.734,
  averageTime: 5100,
  currentStreak: 4,
  longestStreak: 9,
  lastTrainingDate: Date.now(),
};

function seedElo(overall: number, gamesPlayed: number) {
  const standard: EloRating = { ...DEFAULT_ELO, overall, gamesPlayed, variant: 'standard' };
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard,
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' },
    },
  });
}

beforeEach(() => seedElo(DEFAULT_ELO.overall, 0));

afterEach(() => {
  cleanup();
  seedElo(DEFAULT_ELO.overall, 0);
});

describe('ProgressHero 战绩牌匾', () => {
  it('无 ELO 数据时分数为占位符且不展示段位描述', () => {
    const { container } = render(<ProgressHero summary={SUMMARY} />);
    const text = container.textContent ?? '';

    expect(text).toContain('战绩记录');
    expect(text).toContain('综合段位评分');
    expect(text).toContain('—');
    expect(text).toContain('基于 0 次答题的评分');
    // 空数据时 rank description 不渲染
    expect(text).not.toContain('刚开始接触德州扑克');
  });

  it('展示 summary 的四项核心指标', () => {
    const { container } = render(<ProgressHero summary={SUMMARY} />);
    const text = container.textContent ?? '';

    expect(text).toContain('总训练次数');
    expect(text).toContain('12');
    expect(text).toContain('73.4%');
    expect(text).toContain('连续天数');
    expect(text).toContain('4');
    expect(text).toContain('5.1s');
  });

  it('有 ELO 数据时展示当前分与段位名/描述', () => {
    seedElo(1400, 25);

    const { container } = render(<ProgressHero summary={SUMMARY} />);
    const text = container.textContent ?? '';

    expect(text).toContain('1400');
    expect(container.querySelector('.rp-plaque-icon svg')).not.toBeNull();
    expect(text).toContain('中级');
    expect(text).toContain('能应用 GTO 基础');
    expect(text).toContain('基于 25 次答题的评分');
  });
});
