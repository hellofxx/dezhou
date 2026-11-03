/**
 * HelpHome 组件冒烟测试（jsdom）：
 * 验证 Hero eyebrow 渲染、模块卡片数 = 9、FAQ 展开 / 收起交互、Hero 锚点滚动目标，
 * 以及 Design QA 修复项（Link 语义 / §5.18 右侧箭头 / data-accent 变体）不回归。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HelpHome from './HelpHome';

type ScrollCall = { el: Element; options?: ScrollIntoViewOptions | boolean };

describe('HelpHome 冒烟测试', () => {
  let container: HTMLDivElement;
  let root: Root;
  // jsdom 未实现 scrollIntoView，注入记录桩以断言 Hero 锚点的滚动目标与参数
  let scrollCalls: ScrollCall[];
  let originalScrollIntoView: Element['scrollIntoView'] | undefined;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    scrollCalls = [];
    originalScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (
      this: Element,
      options?: boolean | ScrollIntoViewOptions,
    ) {
      scrollCalls.push({ el: this, options });
    };
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    if (typeof originalScrollIntoView === 'function') {
      Element.prototype.scrollIntoView = originalScrollIntoView;
    } else {
      Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
    }
  });

  const renderHelp = () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <HelpHome />
        </MemoryRouter>,
      );
    });
  };

  it('渲染 Hero eyebrow 与 9 张模块卡片', () => {
    renderHelp();

    // Hero eyebrow 渲染（HOUSE RULES 玩家须知）
    expect(container.textContent).toContain('玩家须知');

    // 9 张模块卡片（module-card 类由 ModuleEntryCard 持有）
    const cards = container.querySelectorAll('.module-card');
    expect(cards.length).toBe(9);
  });

  it('FAQ 折叠交互：点击展开显示答案', () => {
    renderHelp();

    // 找到 FAQ 按钮（HELP-05：限定在 #help-faq 容器内查询 aria-expanded，
    // 避免误匹配其它可能使用该属性的交互元素）
    const faqSection = container.querySelector('#help-faq');
    expect(faqSection).not.toBeNull();
    const faqButtons = faqSection!.querySelectorAll('button[aria-expanded]');
    expect(faqButtons.length).toBeGreaterThanOrEqual(8);

    const firstBtn = faqButtons[0] as HTMLButtonElement;
    expect(firstBtn.getAttribute('aria-expanded')).toBe('false');

    // 点击展开
    act(() => {
      firstBtn.click();
    });

    expect(firstBtn.getAttribute('aria-expanded')).toBe('true');
    // 展开态才建立 button ↔ panel 的 aria-controls 关联
    expect(firstBtn.getAttribute('aria-controls')).toBe('faq-panel-0');
  });

  it('FAQ 折叠交互：再次点击收起，且同时只展开一条', () => {
    renderHelp();

    const faqButtons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('#help-faq button[aria-expanded]'),
    );
    const first = faqButtons[0] as HTMLButtonElement;
    const second = faqButtons[1] as HTMLButtonElement;

    // 展开 → 收起
    act(() => first.click());
    expect(first.getAttribute('aria-expanded')).toBe('true');
    act(() => first.click());
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(first.getAttribute('aria-controls')).toBeNull();

    // 单开语义：展开另一条会把前一条收起
    act(() => first.click());
    act(() => second.click());
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('Hero 主 CTA 与三条规则各自滚动到对应 section', () => {
    renderHelp();

    const cta = container.querySelector('.help-hero-cta') as HTMLButtonElement;
    const rules = Array.from(container.querySelectorAll<HTMLButtonElement>('.house-rules-item'));
    const [rule01, rule02, rule03] = rules as [HTMLButtonElement, HTMLButtonElement, HTMLButtonElement];

    act(() => cta.click());
    act(() => rule02.click());
    act(() => rule03.click());
    act(() => rule01.click());

    // 目标 section 与 HelpHero 的锚点映射逐一对应（顺序即点击顺序）
    expect(scrollCalls.map((call) => call.el.id)).toEqual([
      'help-quickstart',
      'help-articles',
      'help-faq',
      'help-quickstart',
    ]);
    // 未开启减弱动态偏好时走平滑滚动，且对齐到 section 顶部
    for (const call of scrollCalls) {
      expect(call.options).toEqual({ behavior: 'smooth', block: 'start' });
    }
  });

  it('模块卡为 a[href] 而非 button（Link 语义：中键/新标签可用）', () => {
    renderHelp();

    const cards = container.querySelectorAll('.module-card');
    expect(cards).toHaveLength(9);
    for (const card of cards) {
      expect(card.tagName).toBe('A');
      expect(card.getAttribute('href')?.startsWith('/help/article/')).toBe(true);
    }
  });

  it('上手路径节点为 a[href]', () => {
    renderHelp();

    const nodes = container.querySelectorAll('.quick-path-node');
    expect(nodes).toHaveLength(5);
    for (const node of nodes) expect(node.tagName).toBe('A');
  });

  it('模块图标走 data-accent 变体而非内联 style（底色事实源在 CSS）', () => {
    renderHelp();

    const icons = container.querySelectorAll('.module-icon');
    expect(icons).toHaveLength(9);
    for (const icon of icons) {
      expect(icon.getAttribute('style'), '.module-icon 不应残留内联 style').toBeNull();
      expect(icon.getAttribute('data-accent')).toBeTruthy();
    }
  });

  it('模块卡携带 §5.18 规定的右侧箭头', () => {
    renderHelp();

    for (const card of container.querySelectorAll('.module-card')) {
      expect(card.querySelector('svg.lucide-arrow-right'), '模块卡缺少右侧箭头').not.toBeNull();
    }
  });

  it('Hero CTA 仍是 button（锚点滚动而非路由跳转）', () => {
    renderHelp();

    expect(container.querySelector('.help-hero-cta')?.tagName).toBe('BUTTON');
  });
});
