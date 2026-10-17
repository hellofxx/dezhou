// useRovingGridNav 回归测试（jsdom）：整张网格仅一个 Tab 停靠点 + 方向键/Home/End 移动 + Enter/Space 选择。
// 遵循既有组件测试基式（react-dom/client + act，不引入 testing-library）。

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useRovingGridNav } from './useRovingGridNav';

interface ProbeProps {
  values: string[];
  columns?: number;
  disabled?: boolean;
  onSelect?: (value: string) => void;
}

function Probe({ values, columns, disabled, onSelect }: ProbeProps) {
  const { getItemProps } = useRovingGridNav({ values, columns, disabled, onSelect });
  return (
    <div>
      {values.map((value) => (
        <div key={value} data-testid={`item-${value}`} {...getItemProps(value)}>
          {value}
        </div>
      ))}
    </div>
  );
}

const VALUES = ['a', 'b', 'c', 'd', 'e', 'f'];

describe('useRovingGridNav', () => {
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

  const render = (props: ProbeProps) =>
    act(() => {
      root.render(<Probe {...props} />);
    });

  const item = (value: string) => container.querySelector<HTMLElement>(`[data-testid="item-${value}"]`)!;

  const fireKey = (value: string, key: string) =>
    act(() => {
      item(value).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    });

  const tabStops = () => container.querySelectorAll('[tabindex="0"]');

  it('整张网格只有一个 Tab 停靠点，其余为 -1，aria-current 只在 active 项', () => {
    render({ values: VALUES, columns: 3 });

    expect(tabStops().length).toBe(1);
    expect(item('a').getAttribute('tabindex')).toBe('0');
    expect(item('b').getAttribute('tabindex')).toBe('-1');
    expect(item('a').getAttribute('aria-current')).toBe('true');
    expect(item('b').hasAttribute('aria-current')).toBe(false);
    expect(item('a').getAttribute('role')).toBe('button');
  });

  it('方向键按 columns 跨行移动，且移动只改 active 不触发 onSelect', () => {
    const onSelect = vi.fn();
    render({ values: VALUES, columns: 3, onSelect });

    fireKey('a', 'ArrowRight');
    expect(item('b').getAttribute('tabindex')).toBe('0');
    expect(tabStops().length).toBe(1);

    fireKey('b', 'ArrowDown');
    expect(item('e').getAttribute('tabindex')).toBe('0');

    fireKey('e', 'ArrowUp');
    expect(item('b').getAttribute('tabindex')).toBe('0');

    fireKey('b', 'ArrowLeft');
    expect(item('a').getAttribute('tabindex')).toBe('0');

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('无 columns 时 Up/Down 按 ±1 移动（非矩形图场景）', () => {
    render({ values: VALUES });

    fireKey('a', 'ArrowDown');
    expect(item('b').getAttribute('tabindex')).toBe('0');

    fireKey('b', 'ArrowUp');
    expect(item('a').getAttribute('tabindex')).toBe('0');
  });

  it('Home / End 跳到首尾并 clamp 边界', () => {
    render({ values: VALUES, columns: 3 });

    fireKey('a', 'ArrowLeft');
    expect(item('a').getAttribute('tabindex')).toBe('0');

    fireKey('a', 'End');
    expect(item('f').getAttribute('tabindex')).toBe('0');

    fireKey('f', 'ArrowRight');
    expect(item('f').getAttribute('tabindex')).toBe('0');

    fireKey('f', 'Home');
    expect(item('a').getAttribute('tabindex')).toBe('0');
  });

  it('移动后聚焦目标元素', () => {
    render({ values: VALUES, columns: 3 });

    fireKey('a', 'ArrowRight');
    expect(document.activeElement).toBe(item('b'));
  });

  it('Enter / Space 以 onSelect(active) 提交并阻止默认行为', () => {
    const onSelect = vi.fn();
    render({ values: VALUES, columns: 3, onSelect });

    fireKey('a', 'ArrowRight');
    fireKey('b', 'Enter');
    expect(onSelect).toHaveBeenCalledWith('b');

    onSelect.mockClear();
    fireKey('b', ' ');
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('disabled 时全部 tabIndex=-1 且不响应键盘', () => {
    const onSelect = vi.fn();
    render({ values: VALUES, columns: 3, disabled: true, onSelect });

    expect(tabStops().length).toBe(0);
    expect(item('a').getAttribute('aria-current')).toBeNull();

    fireKey('a', 'Enter');
    fireKey('a', 'ArrowRight');
    expect(onSelect).not.toHaveBeenCalled();
    expect(item('b').getAttribute('tabindex')).toBe('-1');
  });
});
