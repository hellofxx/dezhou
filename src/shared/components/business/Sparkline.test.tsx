/**
 * Sparkline 契约（7 日正确率迷你折线，DESIGN.md §13.2.2）：
 * - 单点 / 空数据不可绘制，返回 null（不产出退化图形）
 * - 纯装饰：aria-hidden + focusable=false，不参与可访问性树
 * - 数值钳制到 0-100，纵坐标按高度反算（100% 在顶部）
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import Sparkline from './Sparkline';

describe('Sparkline', () => {
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
  const points = () => {
    const polyline = container.querySelector('polyline');
    return (polyline?.getAttribute('points') ?? '').split(' ').filter(Boolean);
  };

  it('少于 2 个数据点不绘制', () => {
    render(<Sparkline data={[]} />);
    expect(svg()).toBeNull();

    render(<Sparkline data={[80]} />);
    expect(svg()).toBeNull();
  });

  it('默认尺寸 56×8，坐标点数与数据点一一对应', () => {
    render(<Sparkline data={[0, 50, 100]} />);

    expect(svg()?.getAttribute('width')).toBe('56');
    expect(svg()?.getAttribute('height')).toBe('8');
    expect(svg()?.getAttribute('viewBox')).toBe('0 0 56 8');
    expect(points()).toEqual(['0.00,8.00', '28.00,4.00', '56.00,0.00']);
  });

  it('纯装饰：aria-hidden 且不可聚焦', () => {
    render(<Sparkline data={[10, 20]} />);
    expect(svg()?.getAttribute('aria-hidden')).toBe('true');
    expect(svg()?.getAttribute('focusable')).toBe('false');
  });

  it('超出 0-100 的数据被钳制（不画出图外）', () => {
    render(<Sparkline data={[-40, 150]} height={10} width={20} />);
    expect(points()).toEqual(['0.00,10.00', '20.00,0.00']);
  });

  it('自定义尺寸影响坐标换算，渐变填充引用同一渐变 id', () => {
    render(<Sparkline data={[0, 100]} width={100} height={50} />);

    expect(svg()?.getAttribute('viewBox')).toBe('0 0 100 50');
    expect(points()).toEqual(['0.00,50.00', '100.00,0.00']);

    const gradientId = container.querySelector('linearGradient')?.getAttribute('id');
    expect(gradientId).toBeTruthy();
    const fill = container.querySelector('path')?.getAttribute('fill');
    expect(fill).toBe(`url(#${gradientId})`);
  });
});
