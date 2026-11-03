/**
 * ProgressRing 契约（概念节点 / 章节完成度环，DESIGN.md §13.2.1）：
 * - role="img" + aria-label 播报百分比
 * - 状态三色：idle（无可见进度段）/ in-progress（黄铜）/ complete（成功色）
 * - value 钳制到 0-1；显式 status 覆盖 value 推导
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ProgressRing from './ProgressRing';

describe('ProgressRing', () => {
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

  const svg = () => container.querySelector('svg') as SVGSVGElement | null;
  const progressCircle = () => container.querySelectorAll('circle')[1] as SVGCircleElement | undefined;

  it('role=img 且 aria-label 播报四舍五入百分比', () => {
    render(<ProgressRing value={0.456} />);

    expect(svg()?.getAttribute('role')).toBe('img');
    expect(svg()?.getAttribute('aria-label')).toBe('46% 完成');
  });

  it('默认尺寸 40 使用 3px 描边，大尺寸使用 4px', () => {
    render(<ProgressRing value={0.5} />);
    expect(svg()?.getAttribute('width')).toBe('40');
    expect(progressCircle()?.getAttribute('stroke-width')).toBe('3');

    render(<ProgressRing value={0.5} size={56} />);
    expect(svg()?.getAttribute('width')).toBe('56');
    expect(progressCircle()?.getAttribute('stroke-width')).toBe('4');
  });

  it('value 推导状态：0 → idle（整段隐藏 + 降透明度）', () => {
    render(<ProgressRing value={0} />);

    const circle = progressCircle();
    const circumference = Number(circle?.getAttribute('stroke-dasharray'));
    expect(circumference).toBeGreaterThan(0);
    expect(Number(circle?.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference, 6);
    expect(circle?.getAttribute('opacity')).toBe('0.3');
    expect(circle?.getAttribute('stroke')).toBe('var(--poker-walnut-border)');
  });

  it('value 推导状态：0<value<1 → in-progress（黄铜），1 → complete（成功色）', () => {
    render(<ProgressRing value={0.25} />);
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--poker-brass)');
    expect(progressCircle()?.getAttribute('opacity')).toBeNull();

    render(<ProgressRing value={1} />);
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--poker-success)');
    expect(Number(progressCircle()?.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 6);
  });

  it('显式 status 覆盖 value 推导（如 value=1 但标记未开始）', () => {
    render(<ProgressRing value={1} status="idle" />);
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--poker-walnut-border)');

    render(<ProgressRing value={0} status="complete" />);
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--poker-success)');
    expect(svg()?.getAttribute('aria-label')).toBe('0% 完成');
  });

  it('超出 0-1 的 value 被钳制（不出现负进度或超周长）', () => {
    render(<ProgressRing value={-0.5} />);
    expect(svg()?.getAttribute('aria-label')).toBe('0% 完成');

    render(<ProgressRing value={2} />);
    expect(svg()?.getAttribute('aria-label')).toBe('100% 完成');
    expect(Number(progressCircle()?.getAttribute('stroke-dashoffset'))).toBeCloseTo(0, 6);
  });
});
