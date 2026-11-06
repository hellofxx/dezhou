/**
 * ProgressBar（shared/business）守卫：进度语义 + 0/100 边界 + 值钳制 + 尺寸档。
 * 消费方：strategy-academy CourseView / LessonUnit、theory-academy ChapterView。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ProgressBar } from './ProgressBar';

describe('ProgressBar', () => {
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

  const renderBar = (value: number, label = '课程进度', size: 'sm' | 'md' = 'md') => {
    act(() => {
      root.render(<ProgressBar value={value} label={label} size={size} />);
    });
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    return bar as HTMLElement;
  };

  const fillTransform = () => {
    const fill = container.querySelector('[role="progressbar"] > div');
    expect(fill).toBeTruthy();
    return (fill as HTMLElement).style.transform;
  };

  it('exposes progressbar semantics with the label as accessible name', () => {
    const bar = renderBar(42);

    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('课程进度');
    expect(fillTransform()).toBe('translateX(-58%)');
  });

  it('handles the 0 boundary', () => {
    expect(renderBar(0).getAttribute('aria-valuenow')).toBe('0');
    expect(fillTransform()).toBe('translateX(-100%)');
  });

  it('handles the 100 boundary', () => {
    expect(renderBar(100).getAttribute('aria-valuenow')).toBe('100');
    expect(fillTransform()).toBe('translateX(-0%)');
  });

  it('clamps aria and visual ratio for out of range values', () => {
    expect(renderBar(140).getAttribute('aria-valuenow')).toBe('100');
    expect(fillTransform()).toBe('translateX(-0%)');

    expect(renderBar(-20).getAttribute('aria-valuenow')).toBe('0');
    expect(fillTransform()).toBe('translateX(-100%)');
  });

  it('maps size to the progress track height', () => {
    expect(renderBar(50, '课程进度', 'sm').classList.contains('h-1.5')).toBe(true);
    expect(renderBar(50, '课程进度', 'md').classList.contains('h-2.5')).toBe(true);
  });
});
