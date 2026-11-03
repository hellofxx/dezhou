import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { Player } from '../types';
import { PlayerSeats } from './PlayerSeats';

/**
 * 座位环冒烟（jsdom）。
 * 覆盖：座位名 / 位置徽标 / 筹码（回放栈优先于初始栈）/ 弃牌置灰 / 当前行动高亮 /
 * 摊牌态才亮出底牌。绝对定位与椭圆布局由 L4 视觉验收守护。
 */

MotionGlobalConfig.skipAnimations = true;

const PLAYERS: Player[] = [
  {
    id: 0,
    name: 'Alice',
    position: Position.BTN,
    seatNumber: 1,
    stack: 100,
    holeCards: [
      { rank: Rank.Ace, suit: Suit.Hearts },
      { rank: Rank.King, suit: Suit.Hearts },
    ],
  },
  { id: 1, name: 'Bob', position: Position.SB, seatNumber: 2, stack: 1000 },
  { id: 2, name: 'Carol', position: Position.BB, seatNumber: 3, stack: 12000 },
];

function seatOf(name: string): HTMLElement {
  const nameNode = screen.getByText(name);
  return nameNode.parentElement as HTMLElement;
}

function faceUpCards(container: HTMLElement): number {
  return container.querySelectorAll('svg[aria-label]').length;
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  cleanup();
});

describe('PlayerSeats', () => {
  it('渲染每个座位的名字、位置与筹码（回放栈覆盖初始栈）', () => {
    render(
      <PlayerSeats
        players={PLAYERS}
        activePlayerIndex={-1}
        foldedPlayers={new Set()}
        playerStacks={[88, 1000, 12000]}
        showCards={false}
      />,
    );

    expect(screen.getByText('Alice')).not.toBeNull();
    expect(screen.getByText('$88')).not.toBeNull();
    expect(screen.getByText('$1,000')).not.toBeNull();
    expect(screen.getByText('$12K')).not.toBeNull();
    // 位置徽标文本 + 语义 aria-label
    expect(screen.getByText('BTN')).not.toBeNull();
    expect(document.querySelector('[aria-label^="BTN ·"]')).not.toBeNull();
  });

  it('回放栈缺失时回退到玩家初始筹码', () => {
    render(
      <PlayerSeats
        players={PLAYERS}
        activePlayerIndex={-1}
        foldedPlayers={new Set()}
        playerStacks={[]}
        showCards={false}
      />,
    );

    expect(screen.getByText('$100')).not.toBeNull();
    expect(screen.getByText('$1,000')).not.toBeNull();
  });

  it('弃牌玩家置灰、当前行动玩家高亮', () => {
    render(
      <PlayerSeats
        players={PLAYERS}
        activePlayerIndex={0}
        foldedPlayers={new Set([1])}
        playerStacks={[100, 100.5, 12000]}
        showCards={false}
      />,
    );

    expect(seatOf('Bob').className).toContain('opacity-40');
    expect(seatOf('Alice').className).not.toContain('opacity-40');
    expect(seatOf('Alice').className).toContain('border-[var(--brass)]');
    expect(seatOf('Bob').className).not.toContain('shadow-[var(--shadow-brass-glow-lg)]');
  });

  it('showCards=false 时不亮底牌；showCards=true 时仅有底牌的座位亮牌', () => {
    const { container, rerender } = render(
      <PlayerSeats
        players={PLAYERS}
        activePlayerIndex={-1}
        foldedPlayers={new Set()}
        playerStacks={[100, 1000, 12000]}
        showCards={false}
      />,
    );
    expect(faceUpCards(container)).toBe(0);

    rerender(
      <PlayerSeats
        players={PLAYERS}
        activePlayerIndex={-1}
        foldedPlayers={new Set()}
        playerStacks={[100, 1000, 12000]}
        showCards
      />,
    );
    // 只有 Alice 有 holeCards（2 张）
    expect(faceUpCards(container)).toBe(2);
  });
});
