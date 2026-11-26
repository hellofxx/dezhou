import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import FaqAccordion from './FaqAccordion';
import { FAQ_ITEMS } from '../data/helpContent';

describe('FaqAccordion 组件测试', () => {
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

  const renderItems = (items: readonly (typeof FAQ_ITEMS)[number][] = FAQ_ITEMS) => {
    act(() => root.render(<FaqAccordion items={items} />));
  };

  it('默认渲染 11 条 FAQ，折叠态也保持 aria-controls', () => {
    renderItems();
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]'));
    expect(buttons).toHaveLength(11);
    expect(buttons[0]?.getAttribute('aria-controls')).toBe('faq-panel-faq.q0.question');
    expect(buttons[0]?.getAttribute('aria-expanded')).toBe('false');
  });

  it('筛选后编号保持原清单顺序', () => {
    renderItems([FAQ_ITEMS[8] as (typeof FAQ_ITEMS)[number]]);
    expect(container.querySelectorAll('button[aria-expanded]')).toHaveLength(1);
    expect(container.querySelector('.faq-item-num')?.textContent).toBe('09');
    expect(container.textContent).toContain('每日谜题会联网或生成全球排名吗？');
  });

  it('筛选移出已展开项后不会把展开状态转移到新条目', () => {
    renderItems();
    const first = container.querySelector<HTMLButtonElement>('button[aria-expanded]');
    act(() => first?.click());
    expect(first?.getAttribute('aria-expanded')).toBe('true');

    renderItems([FAQ_ITEMS[9] as (typeof FAQ_ITEMS)[number]]);
    const remaining = container.querySelector<HTMLButtonElement>('button[aria-expanded]');
    expect(remaining?.getAttribute('aria-expanded')).toBe('false');
  });
});
