import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
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

  it('默认渲染 h2，并带统一 section label 样式', () => {
    act(() => {
      root.render(<SectionLabel>课程进度</SectionLabel>);
    });

    const heading = container.querySelector('h2');
    expect(heading?.textContent).toBe('课程进度');
    expect(heading?.classList.contains('text-[var(--brass-text)]')).toBe(true);
    expect(heading?.classList.contains('tracking-[0.22em]')).toBe(true);
  });

  it('支持 as 语义与 id', () => {
    act(() => {
      root.render(
        <SectionLabel as="h3" id="group-a">
          分组
        </SectionLabel>
      );
    });

    const heading = container.querySelector('h3#group-a');
    expect(heading?.textContent).toBe('分组');
  });

  it('渲染可选图标与计数，且不产生 h1', () => {
    act(() => {
      root.render(
        <SectionLabel icon={<span data-testid="icon">◆</span>} count={3}>
          书签
        </SectionLabel>
      );
    });

    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('[data-testid="icon"]')).toBeTruthy();
    expect(container.textContent).toBe('◆书签3');
  });
});
