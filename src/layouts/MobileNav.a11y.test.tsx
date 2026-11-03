import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import MobileNav from '@/layouts/MobileNav';
import { configureA11yDocument, expectNoA11yViolations } from '@/test-utils/a11y';

// 组件级 harness 约定见 src/test-utils/a11y.ts：渲染进 <main><h1>…</h1>，
// 使 region / landmark-one-main / page-has-heading-one 真实生效；
// 仅 bypass（skip link 属整页概念）可带理由豁免。
describe('MobileNav a11y (WCAG 2.1 AA smoke)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    configureA11yDocument();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderHarness = (path = '/') =>
    root.render(
      <main>
        <h1>Test</h1>
        <MemoryRouter initialEntries={[path]}>
          <MobileNav />
        </MemoryRouter>
      </main>,
    );

  const bottomItems = () =>
    Array.from(container.querySelectorAll('nav ul > li')).map((li) =>
      li.querySelector('a, button')?.getAttribute('aria-label'),
    );

  const trainingButton = () => container.querySelector('nav button');

  const openSheet = async () => {
    await act(async () => {
      (trainingButton() as HTMLButtonElement | null)?.click();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  };

  it('has no axe violations — each nav item exposes an accessible name', async () => {
    await act(async () => {
      renderHarness();
    });

    await expectNoA11yViolations(container, {
      disableRules: [
        {
          id: 'bypass',
          reason: 'skip link 是整页跳转概念，组件级 harness 不含页头，规则不适用',
        },
      ],
    });
  });

  it('renders a navigation landmark with labelled links', () => {
    act(() => {
      renderHarness();
    });

    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    const links = Array.from(container.querySelectorAll('a'));
    expect(links.length).toBeGreaterThan(0);
    links.forEach((link) => {
      expect(link.getAttribute('aria-label')).toBeTruthy();
    });
  });

  it('底栏为 6 项：首页 / 训练 / 学院 / 理论 / 题库 / 进度，设置已移出', () => {
    act(() => {
      renderHarness();
    });

    expect(bottomItems()).toEqual([
      '仪表盘',
      '训练',
      '策略学院',
      '理论学院',
      '扑克谜题',
      '进度统计',
    ]);
    // 设置不再占底栏一格（由顶栏齿轮承接）
    expect(container.querySelector('a[aria-label="设置"]')).toBeNull();
  });

  it('「训练」是 dialog 触发器，点击打开训练快捷 Sheet', async () => {
    await act(async () => {
      renderHarness();
    });

    const button = trainingButton();
    expect(button?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button?.getAttribute('aria-label')).toBe('训练');
    expect(button?.getAttribute('aria-expanded')).toBe('false');

    await openSheet();

    expect(button?.getAttribute('aria-expanded')).toBe('true');
    const dialog = document.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog?.textContent).toContain('训练入口');
    expect(dialog?.textContent).toContain('手牌范围训练');
  });

  it('当前路径属于训练入口时「训练」按钮高亮', async () => {
    await act(async () => {
      renderHarness('/pot-odds/quiz');
    });
    expect(trainingButton()?.className).toContain('text-[var(--brass-bright)]');

    act(() => root.unmount());
    root = createRoot(container);
    await act(async () => {
      renderHarness('/help');
    });
    expect(trainingButton()?.className).toContain('text-[var(--ivory-dim)]');
  });
});
