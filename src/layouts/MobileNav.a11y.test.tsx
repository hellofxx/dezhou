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

  const renderHarness = () =>
    root.render(
      <main>
        <h1>Test</h1>
        <MemoryRouter>
          <MobileNav />
        </MemoryRouter>
      </main>,
    );

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
});
