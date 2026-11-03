/**
 * PokerCard 契约（共享扑克牌组件）：
 * - 非交互牌退出可访问性树（纯装饰），牌面由 CardSVG 承担
 * - 可交互牌暴露 role="button" + 本地化可访问名称，支持 Enter / Space 触发（Space 需拦默认滚动）
 * - 尺寸档位决定像素宽高；faceDown 时显示牌背
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PokerCard } from './Card';
import { Rank, Suit } from '@/shared/types/poker';

const ACE_HEARTS = { suit: Suit.Hearts, rank: Rank.Ace };

describe('PokerCard', () => {
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

  const face = () => container.firstElementChild as HTMLElement;

  it('回归锁：非交互牌不进入 Tab 顺序，也不暴露 role / 可访问名称', () => {
    render(<PokerCard card={ACE_HEARTS} />);

    expect(face().getAttribute('role')).toBeNull();
    // framer-motion 在存在 whileTap 时会补 tabIndex=0，纯展示牌必须显式退出 Tab 顺序
    expect(face().getAttribute('tabindex')).toBe('-1');
    expect(face().getAttribute('aria-label')).toBeNull();
    // 牌面 SVG 仍提供自身名称（红桃A）
    expect(container.querySelector('svg[role="img"]')?.getAttribute('aria-label')).toBe('红桃A');
  });

  it('可交互牌暴露 role=button 与本地化名称，点击触发回调', () => {
    const onClick = vi.fn();
    render(<PokerCard card={ACE_HEARTS} onClick={onClick} />);

    expect(face().getAttribute('role')).toBe('button');
    expect(face().getAttribute('tabindex')).toBe('0');
    expect(face().getAttribute('aria-label')).toBe('红桃A');

    act(() => {
      face().click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('键盘 Enter / Space 触发回调，其它键不触发', () => {
    const onClick = vi.fn();
    render(<PokerCard card={ACE_HEARTS} onClick={onClick} />);

    for (const key of ['Enter', ' ']) {
      act(() => {
        face().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      });
    }
    expect(onClick).toHaveBeenCalledTimes(2);

    act(() => {
      face().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('非交互牌忽略键盘事件（不会触发未注册的回调）', () => {
    render(<PokerCard card={ACE_HEARTS} />);
    expect(() =>
      act(() => {
        face().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      }),
    ).not.toThrow();
  });

  it('尺寸档位决定像素宽高', () => {
    render(<PokerCard card={ACE_HEARTS} size="sm" />);
    expect(face().style.width).toBe('42px');
    expect(face().style.height).toBe('60px');

    render(<PokerCard card={ACE_HEARTS} size="lg" />);
    expect(face().style.width).toBe('76px');
    expect(face().style.height).toBe('108px');
  });

  it('正反两面都以 backface-visibility 隐藏背面，牌背预置 180° 旋转', () => {
    render(<PokerCard card={ACE_HEARTS} faceDown />);

    const flipping = face().firstElementChild as HTMLElement;
    const faces = Array.from(flipping.children) as HTMLElement[];
    expect(faces).toHaveLength(2);
    expect(faces[0]?.style.backfaceVisibility).toBe('hidden');
    expect(faces[1]?.style.backfaceVisibility).toBe('hidden');
    // 牌背面静态预旋转（翻牌动画由 framer-motion 在 rAF 内补 transform，留给浏览器验收）
    expect(faces[1]?.style.transform).toBe('rotateY(180deg)');
  });

  it('highlighted 叠加黄铜投影滤镜', () => {
    render(<PokerCard card={ACE_HEARTS} highlighted />);
    expect(face().style.filter).toContain('drop-shadow');
  });
});
