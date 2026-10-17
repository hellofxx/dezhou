/**
 * CardSVG 守卫：牌面必须提供本地化可访问名称（花色 + 点数），
 * 装饰态则完全退出可访问性树，避免与宿主卡片的名称重复朗读。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { CardSVG } from './CardSVG';
import { Rank, Suit } from '@/shared/types/poker';

describe('CardSVG', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderSvg = (node: ReactElement) => {
    act(() => {
      root.render(node);
    });
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    return svg as SVGSVGElement;
  };

  it('exposes a localized Chinese accessible name (suit + rank)', () => {
    const svg = renderSvg(<CardSVG suit={Suit.Hearts} rank={Rank.Ace} />);

    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('红桃A');
  });

  it('renders the ten as 10 on the card face label', () => {
    const svg = renderSvg(<CardSVG suit={Suit.Spades} rank={Rank.Ten} />);

    expect(svg.getAttribute('aria-label')).toBe('黑桃10');
  });

  it('hides decorative cards from the accessibility tree', () => {
    const svg = renderSvg(<CardSVG suit={Suit.Diamonds} rank={Rank.King} decorative />);

    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.getAttribute('aria-label')).toBeNull();
    expect(svg.getAttribute('aria-hidden')).toBe('true');
  });
});
