/**
 * ProgressBar（shared/business）守卫：进度语义 + 0/100 边界 + 填充宽度钳制。
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

  const renderBar = (value: number, label = '课程进度') => {
    act(() => {
      root.render(<ProgressBar value={value} label={label} />);
    });
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeTruthy();
    return bar as HTMLElement;
  };

  const fillWidth = () => {
    const fill = container.querySelector('[role="progressbar"] > div');
    expect(fill).toBeTruthy();
    return (fill as HTMLElement).style.width;
  };

  it('exposes progressbar semantics with the label as accessible name', () => {
    const bar = renderBar(42);

    expect(bar.getAttribute('aria-valuenow')).toBe('42');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('课程进度');
  });

  it('handles the 0 boundary', () => {
    expect(renderBar(0).getAttribute('aria-valuenow')).toBe('0');
    expect(fillWidth()).toBe('0%');
  });

  it('handles the 100 boundary', () => {
    expect(renderBar(100).getAttribute('aria-valuenow')).toBe('100');
    expect(fillWidth()).toBe('100%');
  });

  it('clamps the fill width out of range values', () => {
    renderBar(140);
    expect(fillWidth()).toBe('100%');
    renderBar(-20);
    expect(fillWidth()).toBe('0%');
  });
});
