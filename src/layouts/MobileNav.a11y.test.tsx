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
      li.querySelector('a')?.getAttribute('aria-label'),
    );

  const itemLink = (label: string) =>
    container.querySelector(`nav a[aria-label="${label}"]`) as HTMLAnchorElement | null;

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

  it('底栏为 5 项：路径 / 课程 / 训练 / 速训 / 进度，设置与帮助不占底栏', () => {
    act(() => {
      renderHarness();
    });

    expect(bottomItems()).toEqual(['学习路径', '课程', '训练', '速训', '进度中心']);
    // 设置走顶栏齿轮、帮助走顶栏图标 / 侧栏，均不再占底栏一格
    expect(container.querySelector('a[aria-label="设置"]')).toBeNull();
    expect(container.querySelector('a[aria-label="帮助中心"]')).toBeNull();
    // 训练入口是直链（不再是 Sheet 触发器）
    expect(container.querySelector('nav button')).toBeNull();
  });

  it('当前路径命中时对应底栏项高亮', async () => {
    await act(async () => {
      renderHarness('/drill');
    });
    expect(itemLink('训练')?.className).toContain('text-[var(--brass-bright)]');
    expect(itemLink('速训')?.className).toContain('text-[var(--ivory-dim)]');

    act(() => root.unmount());
    root = createRoot(container);
    await act(async () => {
      renderHarness('/quick?mode=odds');
    });
    expect(itemLink('速训')?.className).toContain('text-[var(--brass-bright)]');
    expect(itemLink('训练')?.className).toContain('text-[var(--ivory-dim)]');
  });

  it('课程 01 组（课时 / 实战地图 / 理论地图）均保持「课程」高亮', async () => {
    for (const path of ['/lesson/l1-b', '/academy', '/academy/tracks', '/theory', '/theory/chapter/t1']) {
      act(() => root.unmount());
      root = createRoot(container);
      await act(async () => {
        renderHarness(path);
      });
      expect(itemLink('课程')?.className, `${path} 应点亮课程格`).toContain(
        'text-[var(--brass-bright)]',
      );
      expect(itemLink('训练')?.className).toContain('text-[var(--ivory-dim)]');
    }
  });
});
