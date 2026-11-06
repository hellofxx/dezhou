/**
 * DailyGoalCard 契约（今日学习目标卡，DESIGN.md §13.2.4）：
 * - 百分比 = completed / total，钳制到 0-100；total=0 时安全退化为 0（不产生 NaN 宽度）
 * - 可选副文本（分钟数 / 目标描述）仅在提供时渲染
 * - progressbar 语义供读屏播报
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import DailyGoalCard from './DailyGoalCard';

describe('DailyGoalCard', () => {
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

  const bar = () => container.querySelector('[role="progressbar"]') as HTMLElement | null;
  const fillWidth = () => (container.querySelector('[role="progressbar"] > div') as HTMLElement).style.width;

  it('渲染目标计数文案与百分比进度', () => {
    render(<DailyGoalCard completed={2} total={4} />);

    expect(container.textContent).toContain('今日目标');
    expect(container.textContent).toContain('2/4 项任务');
    expect(bar()?.getAttribute('aria-valuenow')).toBe('50');
    expect(fillWidth()).toBe('50%');
  });

  it('total=0 时进度退化为 0，宽度不出现 NaN', () => {
    render(<DailyGoalCard completed={0} total={0} />);
    expect(bar()?.getAttribute('aria-valuenow')).toBe('0');
    expect(fillWidth()).toBe('0%');
  });

  it('超额完成与负进度都被钳制到 0-100', () => {
    render(<DailyGoalCard completed={9} total={4} />);
    expect(fillWidth()).toBe('100%');

    render(<DailyGoalCard completed={-3} total={4} />);
    expect(fillWidth()).toBe('0%');
  });

  it('分钟数与目标描述按需渲染', () => {
    render(<DailyGoalCard completed={1} total={3} />);
    expect(container.textContent).not.toContain('今日已学习');

    render(<DailyGoalCard completed={1} total={3} minutes={12} goalLabel="掌握 CO 位置 3-bet 范围" />);
    expect(container.textContent).toContain('今日已学习 12 分钟');
    expect(container.textContent).toContain('掌握 CO 位置 3-bet 范围');
  });

  it('minutes=0 仍视为已提供（显式零值不应被隐藏）', () => {
    render(<DailyGoalCard completed={0} total={1} minutes={0} />);
    expect(container.textContent).toContain('今日已学习 0 分钟');
  });
});
