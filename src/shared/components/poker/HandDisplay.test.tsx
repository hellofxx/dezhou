/**
 * HandDisplay 契约：
 * - 牌数 = cards.length；空数组不崩
 * - spread 决定重叠间距；尺寸档位透传给 PokerCard
 * - faceDown 时每张牌呈现牌背（第二面预旋转 180°）
 *
 * 注：CardBack 的渐变 id 按 size 生成，同屏多牌会出现重复 DOM id（既有缺陷，本批不修）。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { HandDisplay } from './HandDisplay';
import { Rank, Suit } from '@/shared/types/poker';

const HOLE_CARDS = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Spades, rank: Rank.King },
];

describe('HandDisplay', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const rootEl = () => container.firstElementChild as HTMLElement;
  const cardRoots = () => Array.from(rootEl().children) as HTMLElement[];

  it('渲染 cards.length 张牌；空数组不崩且不渲染子节点', () => {
    render(<HandDisplay cards={HOLE_CARDS} />);
    expect(cardRoots()).toHaveLength(2);

    render(<HandDisplay cards={[]} />);
    expect(cardRoots()).toHaveLength(0);
  });

  it('spread 控制间距：默认 -8，可覆盖（jsdom 不支持 gap 样式，直接断言元素 props）', () => {
    const withDefault = HandDisplay({ cards: HOLE_CARDS }) as React.ReactElement<{
      style: { gap: number };
    }>;
    expect(withDefault.props.style.gap).toBe(-8);

    const withSpread = HandDisplay({ cards: HOLE_CARDS, spread: 4 }) as React.ReactElement<{
      style: { gap: number };
    }>;
    expect(withSpread.props.style.gap).toBe(4);
  });

  it('size 档位透传到每张牌（sm = 42×60）', () => {
    render(<HandDisplay cards={HOLE_CARDS} size="sm" />);
    for (const card of cardRoots()) {
      expect(card.style.width).toBe('42px');
      expect(card.style.height).toBe('60px');
    }
  });

  it('faceDown 时每张牌都有预旋转的第二面（牌背）', () => {
    render(<HandDisplay cards={HOLE_CARDS} faceDown />);
    for (const card of cardRoots()) {
      const backFace = Array.from(card.querySelectorAll<HTMLElement>('div')).find(
        (el) => el.style.transform === 'rotateY(180deg)' && el.style.backfaceVisibility === 'hidden',
      );
      expect(backFace, '缺少牌背预旋转面').not.toBeUndefined();
    }
  });

  it('className 透传到容器', () => {
    render(<HandDisplay cards={HOLE_CARDS} className="probe-class" />);
    expect(rootEl().className).toContain('probe-class');
  });
});