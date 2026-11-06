/**
 * ProgressRing 契约（概念节点 / 章节完成度环，DESIGN.md §13.2.1）：
 * - role="img" + aria-label 播报百分比（可经 ariaLabel 覆盖）
 * - 状态三色：idle（无可见进度段）/ in-progress（黄铜）/ complete（成功色）
 * - value 钳制到 0-1；显式 status 覆盖 value 推导
 * - valueMax=100 支持百分比量程；center 提供环心槽位
 * - academy 变体：胡桃轨 + 黄铜填充，不因 idle 变灰
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
  const trackCircle = () => container.querySelectorAll('circle')[0] as SVGCircleElement | undefined;

  it('role=img 且 aria-label 播报四舍五入百分比', () => {
    render(<ProgressRing value={0.456} />);

    expect(svg()?.getAttribute('role')).toBe('img');
    expect(svg()?.getAttribute('aria-label')).toBe('46% 完成');
  });

  it('默认尺寸 40 使用 3px 描边，56 用 4px，76（两院 hero 环）用 6px', () => {
    render(<ProgressRing value={0.5} />);
    expect(svg()?.getAttribute('width')).toBe('40');
    expect(progressCircle()?.getAttribute('stroke-width')).toBe('3');

    render(<ProgressRing value={0.5} size={56} />);
    expect(svg()?.getAttribute('width')).toBe('56');
    expect(progressCircle()?.getAttribute('stroke-width')).toBe('4');

    render(<ProgressRing value={0.5} size={76} />);
    expect(svg()?.getAttribute('width')).toBe('76');
    expect(progressCircle()?.getAttribute('stroke-width')).toBe('6');
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

  it('valueMax=100 时按百分比换算比例与播报文案', () => {
    render(<ProgressRing value={25} valueMax={100} />);

    const circle = progressCircle();
    const circumference = Number(circle?.getAttribute('stroke-dasharray'));
    expect(svg()?.getAttribute('aria-label')).toBe('25% 完成');
    expect(Number(circle?.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.75, 6);
    // 25/100 属 in-progress（黄铜），不会被当成 >=1 的完成态
    expect(circle?.getAttribute('stroke')).toBe('var(--poker-brass)');

    render(<ProgressRing value={100} valueMax={100} />);
    expect(svg()?.getAttribute('aria-label')).toBe('100% 完成');
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--poker-success)');
  });

  it('ariaLabel 覆盖默认 progress.ring.aria 文案', () => {
    render(<ProgressRing value={40} valueMax={100} ariaLabel="40%" />);

    expect(svg()?.getAttribute('aria-label')).toBe('40%');
    expect(svg()?.getAttribute('role')).toBe('img');
  });

  it('center 渲染在环心覆盖层，svg 仍持有 role/aria 与尺寸', () => {
    render(
      <ProgressRing
        value={60}
        valueMax={100}
        size={76}
        ariaLabel="60%"
        center={<span data-probe>60%</span>}
      />,
    );

    const overlay = container.querySelector('[data-probe]')?.parentElement;
    expect(overlay?.className).toContain('absolute');
    expect(overlay?.className).toContain('items-center');
    expect(svg()?.getAttribute('aria-label')).toBe('60%');
    expect(svg()?.getAttribute('width')).toBe('76');

    // 有 center 时尺寸落在包裹容器上，className 也作用于容器
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.className).toContain('relative');
    expect(wrapper.style.width).toBe('76px');
  });

  it('academy 变体：胡桃轨 + 黄铜填充，idle 不变灰且按比例绘制', () => {
    render(<ProgressRing value={0} valueMax={100} variant="academy" />);

    expect(trackCircle()?.getAttribute('stroke')).toBe('var(--walnut-raised)');
    expect(trackCircle()?.getAttribute('opacity')).toBeNull();
    expect(progressCircle()?.getAttribute('stroke')).toBe('var(--brass-bright)');
    expect(progressCircle()?.getAttribute('opacity')).toBeNull();

    // 显式 idle 也不隐藏、不变灰（两院 hero 环视觉）
    render(<ProgressRing value={40} valueMax={100} variant="academy" status="idle" />);
    const circle = progressCircle();
    const circumference = Number(circle?.getAttribute('stroke-dasharray'));
    expect(circle?.getAttribute('stroke')).toBe('var(--brass-bright)');
    expect(circle?.getAttribute('opacity')).toBeNull();
    expect(Number(circle?.getAttribute('stroke-dashoffset'))).toBeCloseTo(circumference * 0.6, 6);
  });
});
