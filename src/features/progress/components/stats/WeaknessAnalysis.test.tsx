import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import WeaknessAnalysis from './WeaknessAnalysis';
import { useProgressStore } from '../../store';
import { DEFAULT_ELO, type EloRating } from '@/shared/types/elo';

/**
 * WeaknessAnalysis 五维能力雷达图（jsdom）。
 *
 * 契约（P1-2.6）：数据源是当前活动变体的 ELO 五维分数（0-3000 量纲），
 * 不是训练记录正确率；gamesPlayed=0 时展示空态、不展示段位徽章。
 * jsdom 无布局，Recharts 的 ResponsiveContainer 不产出 SVG，故断言卡片文案与段位而非图形节点。
 */

function seedElo(overall: number, gamesPlayed: number) {
  const elo: EloRating = { ...DEFAULT_ELO, overall, gamesPlayed, lastUpdated: 1 };
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: { ...elo, variant: 'standard' },
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

describe('WeaknessAnalysis 五维能力雷达图', () => {
  it('无对局数据时展示空态，不展示段位徽章', () => {
    const { container } = render(<WeaknessAnalysis />);
    const text = container.textContent ?? '';

    expect(text).toContain('五维能力雷达图');
    expect(text).toContain('暂无 ELO 数据');
    expect(text).toContain('累计答题 0 次');
    // 空态下不渲染段位徽章（标题即段位名的 span 不应出现）
    expect(text).not.toContain('新手');
  });

  it('有对局数据时展示题量与当前段位与总分', () => {
    seedElo(1400, 25);

    const { container } = render(<WeaknessAnalysis />);
    const text = container.textContent ?? '';

    expect(text).toContain('累计答题 25 次');
    expect(text).toContain('中级');
    expect(text).toContain('1400');
    expect(text).not.toContain('暂无 ELO 数据');
  });
});
