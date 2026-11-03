import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { VariantEloOverview } from './VariantEloOverview';
import { useProgressStore } from '../../store';
import { DEFAULT_ELO, type EloRating, type PokerVariant } from '@/shared/types/elo';

/**
 * VariantEloOverview 多变体 ELO 概览（jsdom）。
 *
 * 契约：三变体全部渲染各自 overall 与段位；点击卡片切换 activeVariant（aria-pressed 反馈）。
 */

function eloWith(overall: number, gamesPlayed: number): EloRating {
  return { ...DEFAULT_ELO, overall, gamesPlayed, lastUpdated: 1 };
}

function seedElo() {
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: { ...eloWith(900, 12), variant: 'standard' },
      'short-deck': { ...eloWith(1500, 3), variant: 'short-deck' },
      'heads-up': { ...eloWith(300, 0), variant: 'heads-up' },
    },
  });
}

beforeEach(seedElo);

afterEach(() => {
  cleanup();
  useProgressStore.setState({ activeVariant: 'standard' });
});

describe('VariantEloOverview 多变体 ELO 概览', () => {
  it('渲染三个变体名称、各自 ELO 分数与段位', () => {
    const { container } = render(<VariantEloOverview />);
    const text = container.textContent ?? '';

    expect(text).toContain('变体 ELO 概览');
    expect(text).toContain('标准德州');
    expect(text).toContain('短牌德州');
    expect(text).toContain('单挑');

    expect(text).toContain('900');
    expect(text).toContain('1500');
    expect(text).toContain('300');
  });

  it('仅对已开局过的变体展示题量', () => {
    const { container } = render(<VariantEloOverview />);
    const text = container.textContent ?? '';

    expect(text).toContain('12 题');
    expect(text).toContain('3 题');
    // heads-up 的 gamesPlayed 为 0，不展示题量
    expect(text).not.toContain('0 题');
  });

  it('点击变体卡片切换 activeVariant 并更新 aria-pressed', () => {
    const { container } = render(<VariantEloOverview />);

    const buttons = Array.from(container.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);
    const headsUp = buttons.find((b) => b.textContent?.includes('单挑'));
    expect(headsUp).toBeTruthy();
    expect(headsUp!.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(headsUp!);

    expect(useProgressStore.getState().activeVariant).toBe<PokerVariant>('heads-up');
    expect(headsUp!.getAttribute('aria-pressed')).toBe('true');
  });
});
