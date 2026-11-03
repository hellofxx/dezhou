/**
 * LoadingState 契约：三种骨架都以 role="status" + aria-live="polite" 播报加载，
 * 占位图形本身 aria-hidden（读屏不把占位块当内容），行数可配置。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ComponentSkeleton, ListSkeleton, PageSkeleton } from './LoadingState';

describe('LoadingState 骨架', () => {
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

  const render = (node: ReactElement) => {
    act(() => {
      root.render(node);
    });
  };

  const status = () => container.querySelector('[role="status"]') as HTMLElement | null;
  const hiddenSkeleton = () => container.querySelector('[aria-hidden="true"]') as HTMLElement | null;

  it('PageSkeleton 播报加载中，且占位块退出可访问性树', () => {
    render(<PageSkeleton />);

    expect(status()).toBeTruthy();
    expect(status()?.getAttribute('aria-live')).toBe('polite');
    expect(container.querySelector('.sr-only')?.textContent).toBe('加载中...');
    expect(hiddenSkeleton()).toBeTruthy();
    // 4 个统计卡占位
    expect(hiddenSkeleton()?.querySelectorAll('.grid > div')).toHaveLength(4);
  });

  it('ComponentSkeleton 渲染 3 行占位并同样具备状态播报', () => {
    render(<ComponentSkeleton />);

    expect(status()).toBeTruthy();
    expect(hiddenSkeleton()?.children).toHaveLength(3);
  });

  it('ListSkeleton 默认 5 行，rows 可配置', () => {
    render(<ListSkeleton />);
    expect(hiddenSkeleton()?.children).toHaveLength(5);

    render(<ListSkeleton rows={2} />);
    expect(hiddenSkeleton()?.children).toHaveLength(2);

    render(<ListSkeleton rows={0} />);
    expect(hiddenSkeleton()?.children).toHaveLength(0);
  });
});
