import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import MobileNav from '@/layouts/MobileNav';

const componentAxeConfig = {
  rules: {
    region: { enabled: false },
    'landmark-one-main': { enabled: false },
    'page-has-heading-one': { enabled: false },
    'document-title': { enabled: false },
    'html-has-lang': { enabled: false },
    'html-lang-valid': { enabled: false },
    bypass: { enabled: false },
    'landmark-unique': { enabled: false },
  },
} as const;

describe('MobileNav a11y (WCAG 2.1 AA smoke)', () => {
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

  it('has no axe violations — each nav item exposes an accessible name', async () => {
    await act(async () => {
      root.render(
        <MemoryRouter>
          <MobileNav />
        </MemoryRouter>,
      );
    });

    const results = await axe.run(container, componentAxeConfig);
    expect(results.violations).toEqual([]);
  });

  it('renders a navigation landmark with labelled links', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <MobileNav />
        </MemoryRouter>,
      );
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
