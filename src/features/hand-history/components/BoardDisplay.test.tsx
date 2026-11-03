import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { Rank, Suit } from '@/shared/types/poker';
import type { Card } from '@/shared/types/poker';
import { BoardDisplay } from './BoardDisplay';

/**
 * 公共牌展示冒烟（jsdom）。
 * 覆盖：已发出牌正面 / 未发出牌背面、剩余空槽数量、异常数据（>5 张）不产生负长度 RangeError。
 * 未覆盖（L4）：翻牌 3D 动效与真实尺寸。
 */

MotionGlobalConfig.skipAnimations = true;

const BOARD: Card[] = [
  { rank: Rank.Ace, suit: Suit.Spades },
  { rank: Rank.King, suit: Suit.Hearts },
  { rank: Rank.Two, suit: Suit.Clubs },
  { rank: Rank.Seven, suit: Suit.Diamonds },
  { rank: Rank.Nine, suit: Suit.Hearts },
];

/** PokerCard 恒渲染正反两面，带 aria-label 的 SVG 数量 = 渲染出的牌张数 */
function labeledCardCount(container: HTMLElement): number {
  return container.querySelectorAll('svg[aria-label]').length;
}

function emptySlotCount(container: HTMLElement): number {
  return container.querySelectorAll('div.border-dashed').length;
}

beforeEach(() => {
  void i18n.changeLanguage('zh');
});

afterEach(() => {
  cleanup();
});

describe('BoardDisplay', () => {
  it('按牌面顺序渲染 5 张牌且无空槽（正/背面仅视觉差异，由 L4 验收）', () => {
    const { container } = render(<BoardDisplay cards={BOARD.slice(0, 3)} totalBoard={BOARD} />);

    // PokerCard 恒渲染正反两面的 SVG，因此「已发出的牌」只能按 aria-label 数量核对
    expect(labeledCardCount(container)).toBe(5);
    expect(emptySlotCount(container)).toBe(0);
    const labels = Array.from(container.querySelectorAll('svg[aria-label]')).map(
      (el) => el.getAttribute('aria-label') ?? '',
    );
    expect(labels[0]).toContain(i18n.t('common.card.suit.spades'));
    expect(labels[4]).toContain(i18n.t('common.card.suit.hearts'));
  });

  it('未发牌时渲染 5 个虚位空槽', () => {
    const { container } = render(<BoardDisplay cards={[]} totalBoard={[]} />);

    expect(emptySlotCount(container)).toBe(5);
    expect(labeledCardCount(container)).toBe(0);
  });

  it('牌面数量按时递减空槽（3 张牌 → 2 个空槽）', () => {
    const { container } = render(<BoardDisplay cards={BOARD.slice(0, 3)} totalBoard={BOARD.slice(0, 3)} />);

    expect(labeledCardCount(container)).toBe(3);
    expect(emptySlotCount(container)).toBe(2);
  });

  it('异常数据（>5 张公共牌）不崩溃且不渲染空槽', () => {
    const seven: Card[] = [
      ...BOARD,
      { rank: Rank.Eight, suit: Suit.Clubs },
      { rank: Rank.Three, suit: Suit.Diamonds },
    ];
    const { container } = render(<BoardDisplay cards={seven} totalBoard={seven} />);

    expect(labeledCardCount(container)).toBe(7);
    expect(emptySlotCount(container)).toBe(0);
  });
});
