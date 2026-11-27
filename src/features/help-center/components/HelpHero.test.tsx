import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import HelpHero, { type HelpHeroAnchor } from './HelpHero';

const RULE_ANCHORS: ReadonlyArray<{ index: number; num: string; anchor: HelpHeroAnchor }> = [
  { index: 0, num: '01', anchor: 'quickstart' },
  { index: 1, num: '02', anchor: 'articles' },
  { index: 2, num: '03', anchor: 'faq' },
];

describe('HelpHero 组件测试', () => {
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

  const renderHero = () => {
    const onRuleClick = vi.fn<(anchor: HelpHeroAnchor) => void>();
    act(() => {
      root.render(<HelpHero onRuleClick={onRuleClick} />);
    });
    return onRuleClick;
  };

  const ruleLinks = () =>
    Array.from(container.querySelectorAll<HTMLAnchorElement>('.house-rules-item'));

  it('视觉标题保留 h2，组件内不渲染 h1', () => {
    renderHero();
    expect(container.querySelector('h2.help-hero-title')?.textContent?.trim().length).toBeGreaterThan(0);
    expect(container.querySelector('h1')).toBeNull();
  });

  it('渲染 3 条编号规则与 zh 文案', () => {
    renderHero();
    const links = ruleLinks();
    expect(links).toHaveLength(3);
    expect(links.map((link) => link.querySelector('.house-rules-num')?.textContent)).toEqual(['01', '02', '03']);
    expect(links.map((link) => link.querySelector('.house-rules-text-title')?.textContent)).toEqual([
      '快速上手',
      '模块教程',
      '常见问答',
    ]);
  });

  it('快捷导航使用真实锚点链接并具备可访问名称', () => {
    renderHero();
    const card = container.querySelector('.house-rules-card');
    expect(card?.getAttribute('role')).toBe('group');
    expect(card?.getAttribute('aria-label')).toBe('台卡快捷导航');
    expect(container.querySelectorAll('button')).toHaveLength(0);

    const links = Array.from(container.querySelectorAll<HTMLAnchorElement>('.help-hero a'));
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#help-quickstart',
      '#help-quickstart',
      '#help-articles',
      '#help-faq',
    ]);
    for (const link of links) expect(link.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('数量承诺由真实清单插值生成', () => {
    renderHero();
    expect(container.querySelector('.help-hero-meta')?.textContent).toBe(
      '11 篇模块教程 · 6 项系统概念 · 11 条常见问答',
    );
    expect(ruleLinks()[1]?.querySelector('.house-rules-text-body')?.textContent).toBe('11 篇模块与系统教程');
  });

  it.each(RULE_ANCHORS)('点击规则 $num 回传 $anchor 锚点', ({ index, anchor }) => {
    const onRuleClick = renderHero();
    const target = ruleLinks()[index] as HTMLAnchorElement;
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => target.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(true);
    expect(onRuleClick).toHaveBeenCalledTimes(1);
    expect(onRuleClick).toHaveBeenCalledWith(anchor);
  });

  it('修饰键点击交还浏览器原生行为', () => {
    const onRuleClick = renderHero();
    const cta = container.querySelector<HTMLAnchorElement>('.help-hero-cta');
    expect(cta).not.toBeNull();

    const event = new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true });
    act(() => cta?.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(false);
    expect(onRuleClick).not.toHaveBeenCalled();
  });

  it('点击主 CTA 回传 quickstart', () => {
    const onRuleClick = renderHero();
    const cta = container.querySelector<HTMLAnchorElement>('.help-hero-cta');
    expect(cta?.textContent).toContain('从快速上手开始');

    act(() => cta?.click());
    expect(onRuleClick).toHaveBeenCalledWith('quickstart');
  });
});
