/**
 * Progress（shared/ui）数值语义守卫：Radix Root 必须拿到 value，
 * 否则只输出 role=progressbar 而无 aria-valuenow / aria-valuetext。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Progress } from './progress';

describe('Progress', () => {
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

  it('exposes role=progressbar with aria-valuenow', () => {
    act(() => {
      root.render(<Progress value={40} />);
    });

    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    expect(bar?.getAttribute('aria-valuenow')).toBe('40');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
  });

  it('writes the label prop into aria-label', () => {
    act(() => {
      root.render(<Progress value={75} label="课程进度" />);
    });

    const bar = container.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute('aria-label')).toBe('课程进度');
  });
});
