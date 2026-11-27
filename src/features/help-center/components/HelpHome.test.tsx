import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import HelpHome from './HelpHome';

type ScrollCall = { el: Element; options?: ScrollIntoViewOptions | boolean };

describe('HelpHome 组件测试', () => {
  let container: HTMLDivElement;
  let root: Root;
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

  const typeSearch = (value: string) => {
    const input = container.querySelector<HTMLInputElement>('#help-search');
    expect(input).not.toBeNull();
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    act(() => {
      setter?.call(input, value);
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  it('渲染 Hero、真实数量承诺与 11 张模块卡片', () => {
    renderHelp();

    expect(container.textContent).toContain('玩家须知');
    expect(container.textContent).toContain('11 篇模块教程 · 6 项系统概念 · 11 条常见问答');
    expect(container.querySelectorAll('.module-card')).toHaveLength(11);
  });

  it('快速上手使用当前 canonical 路由', () => {
    renderHelp();

    const hrefs = Array.from(container.querySelectorAll<HTMLAnchorElement>('.quick-path-node'))
      .map((node) => node.getAttribute('href'));
    expect(hrefs).toEqual(['/academy/placement', '/lesson', '/quick', '/drill/puzzle', '/progress']);
  });

  it('FAQ 展开后显示答案并声明 aria-controls，收起后进入退出动画并清除引用', () => {
    renderHelp();

    const first = container.querySelector<HTMLButtonElement>('#help-faq button[aria-expanded]');
    expect(first).not.toBeNull();
    const panelId = 'faq-panel-faq.q0.question';
    expect(first?.getAttribute('aria-expanded')).toBe('false');
    expect(first?.getAttribute('aria-controls')).toBeNull();

    act(() => first?.click());
    expect(first?.getAttribute('aria-expanded')).toBe('true');
    expect(first?.getAttribute('aria-controls')).toBe(panelId);
    expect(document.getElementById(panelId)?.textContent).toContain('localStorage');

    act(() => first?.click());
    expect(first?.getAttribute('aria-expanded')).toBe('false');
    expect(first?.getAttribute('aria-controls')).toBeNull();
    expect(document.getElementById(panelId)?.getAttribute('style')).toContain('height: 0px');
  });

  it('FAQ 同时只展开一条', () => {
    renderHelp();

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>('#help-faq button[aria-expanded]'),
    );
    const first = buttons[0] as HTMLButtonElement;
    const second = buttons[1] as HTMLButtonElement;

    act(() => first.click());
    act(() => second.click());
    expect(first.getAttribute('aria-expanded')).toBe('false');
    expect(second.getAttribute('aria-expanded')).toBe('true');
  });

  it('Hero 链接滚动到对应 section，并把焦点移入目标', () => {
    renderHelp();

    const cta = container.querySelector<HTMLAnchorElement>('.help-hero-cta');
    const rules = Array.from(container.querySelectorAll<HTMLAnchorElement>('.house-rules-item'));
    expect(cta).not.toBeNull();
    expect(rules).toHaveLength(3);

    act(() => cta?.click());
    act(() => rules[1]?.click());
    act(() => rules[2]?.click());

    expect(scrollCalls.map((call) => call.el.id)).toEqual([
      'help-quickstart',
      'help-articles',
      'help-faq',
    ]);
    expect(document.activeElement?.id).toBe('help-faq');
    for (const call of scrollCalls) {
      expect(call.options).toEqual({ behavior: 'smooth', block: 'start' });
    }
  });

  it('模块卡与上手节点保持真实链接语义', () => {
    renderHelp();

    const cards = container.querySelectorAll('.module-card');
    expect(cards).toHaveLength(11);
    for (const card of cards) {
      expect(card.tagName).toBe('A');
      expect(card.getAttribute('href')?.startsWith('/help/article/')).toBe(true);
      expect(card.querySelector('.module-icon')?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('检索态下点击 Hero 锚点会退出检索并滚动聚焦到目标', () => {
    renderHelp();
    typeSearch('冻结 导出');
    expect(container.querySelector('#help-quickstart')).toBeNull();

    const cta = container.querySelector<HTMLAnchorElement>('.help-hero-cta');
    expect(cta).not.toBeNull();
    act(() => cta?.click());

    expect(container.querySelector<HTMLInputElement>('#help-search')?.value).toBe('');
    expect(container.querySelector('#help-quickstart')).not.toBeNull();
    expect(scrollCalls.map((call) => call.el.id)).toEqual(['help-quickstart']);
    expect(document.activeElement?.id).toBe('help-quickstart');
  });

  it('全文检索按多个关键词同时匹配文章正文', () => {
    renderHelp();
    expect(container.querySelector('[role="status"]')?.textContent).toBe('');
    typeSearch('冻结 导出');

    const cards = Array.from(container.querySelectorAll<HTMLAnchorElement>('.module-card'));
    expect(cards).toHaveLength(1);
    expect(cards[0]?.getAttribute('href')).toBe('/help/article/settings');
    expect(container.querySelector('#help-quickstart')).toBeNull();
    expect(container.querySelector('[role="status"]')?.textContent).toContain('找到 1 条匹配内容');
  });

  it('检索命中快速上手步骤时保留该 section 并只渲染命中步骤', () => {
    renderHelp();
    typeSearch('每日谜题');

    const section = container.querySelector('#help-quickstart');
    expect(section).not.toBeNull();
    const labels = Array.from(
      section?.querySelectorAll('.quick-path-node-label') ?? [],
    ).map((node) => node.textContent);
    expect(labels).toContain('每日谜题');
    expect(labels.every((label) => label?.includes('每日谜题'))).toBe(true);
    expect(section?.querySelector('.quick-path-node-num')?.textContent).toBe('4');
  });

  it('检索无结果时显示空态，清除后恢复全部内容', () => {
    renderHelp();
    typeSearch('not-a-real-help-keyword');

    expect(container.textContent).toContain('没有找到匹配内容');
    expect(container.querySelectorAll('.module-card')).toHaveLength(0);

    const clear = container.querySelector<HTMLButtonElement>('button[aria-label="清除搜索"]');
    act(() => clear?.click());
    expect(container.querySelectorAll('.module-card')).toHaveLength(11);
    expect(container.querySelector('#help-quickstart')).not.toBeNull();
  });

  it('Escape 清除搜索', () => {
    renderHelp();
    typeSearch('GTO');
    const input = container.querySelector<HTMLInputElement>('#help-search');
    expect(input?.value).toBe('GTO');

    act(() => input?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    expect(input?.value).toBe('');
    expect(container.querySelectorAll('.module-card')).toHaveLength(11);
  });
});
