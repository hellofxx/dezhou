import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PotSizeInput } from './PotSizeInput';

/**
 * PotSizeInput 用户可见契约（L2 / jsdom）：
 * 数字框允许"编辑中显示草稿、失焦回填受控值"，但提交给 store 的值必须始终 clamp 在
 * [min, max] 内；滑块与快捷按钮共用同一 clamp（P1B-06 / P1B-07 回归锁）。
 */
function getNumberInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="number"]');
  if (!input) throw new Error('未找到数字输入框');
  return input;
}

function getRangeInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>('input[type="range"]');
  if (!input) throw new Error('未找到滑块输入框');
  return input;
}

/** 受控包装：模拟父组件（store）持有 value，观察草稿态与回填行为 */
function ControlledHarness({ onChange }: { onChange: (value: number) => void }) {
  const [value, setValue] = useState(50);
  return (
    <PotSizeInput
      label="底池大小"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      min={1}
      max={100}
      step={5}
      prefix="$"
    />
  );
}

afterEach(cleanup);

describe('PotSizeInput 渲染', () => {
  it('渲染 label、前缀与受控值，并把 min/max/step 透传给数字框和滑块', () => {
    const { container } = render(
      <PotSizeInput label="底池大小" value={50} onChange={() => undefined} min={1} max={100} step={5} prefix="$" />,
    );

    expect(screen.getByText('底池大小')).toBeTruthy();
    expect(screen.getByText('$')).toBeTruthy();

    const number = getNumberInput(container);
    const range = getRangeInput(container);
    expect(number.value).toBe('50');
    expect(range.value).toBe('50');
    for (const input of [number, range]) {
      expect(input.getAttribute('min')).toBe('1');
      expect(input.getAttribute('max')).toBe('100');
      expect(input.getAttribute('step')).toBe('5');
    }
  });
});

describe('PotSizeInput 数字输入', () => {
  it('合法输入实时提交数值并更新显示', () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);
    const input = getNumberInput(container);

    fireEvent.change(input, { target: { value: '80' } });

    expect(onChange).toHaveBeenLastCalledWith(80);
    expect(input.value).toBe('80');
  });

  it('超出 max 时提交 clamp 后的值，但编辑中保留草稿原文，失焦回填受控值', () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);
    const input = getNumberInput(container);

    fireEvent.change(input, { target: { value: '250' } });
    expect(onChange).toHaveBeenLastCalledWith(100);
    // 编辑中显示用户原文（不与 state 脱节）
    expect(input.value).toBe('250');

    fireEvent.blur(input);
    expect(input.value).toBe('100');
  });

  it('低于 min 时提交 clamp 后的值', () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);
    const input = getNumberInput(container);

    fireEvent.change(input, { target: { value: '-5' } });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('清空输入不提交（避免 NaN 进入计算链路），失焦恢复受控值', () => {
    const onChange = vi.fn();
    const { container } = render(<ControlledHarness onChange={onChange} />);
    const input = getNumberInput(container);

    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).not.toHaveBeenCalled();
    // 编辑中保留空草稿（DOM 与 state 不脱节）
    expect(input.value).toBe('');

    fireEvent.blur(input);
    expect(input.value).toBe('50');
  });
});

describe('PotSizeInput 滑块与快捷按钮', () => {
  it('滑块拖动提交 clamp 后的数值', () => {
    const onChange = vi.fn();
    const { container } = render(
      <PotSizeInput label="底池大小" value={50} onChange={onChange} min={1} max={100} step={5} />,
    );

    fireEvent.change(getRangeInput(container), { target: { value: '60' } });
    expect(onChange).toHaveBeenLastCalledWith(60);
  });

  it('快捷按钮提交其数值；越过 max 时同样 clamp', () => {
    const onChange = vi.fn();
    render(
      <PotSizeInput
        label="对手下注"
        value={50}
        onChange={onChange}
        min={1}
        max={100}
        quickButtons={[
          { label: 'Half Pot', value: 50 },
          { label: '2x Pot', value: 200 },
        ]}
      />,
    );

    fireEvent.click(screen.getByText('Half Pot'));
    expect(onChange).toHaveBeenLastCalledWith(50);

    fireEvent.click(screen.getByText('2x Pot'));
    expect(onChange).toHaveBeenLastCalledWith(100);
  });

  it('当前值等于快捷按钮值时按钮呈选中态', () => {
    render(
      <PotSizeInput
        label="对手下注"
        value={50}
        onChange={() => undefined}
        quickButtons={[
          { label: 'Half Pot', value: 50 },
          { label: 'Pot', value: 100 },
        ]}
      />,
    );

    expect(screen.getByText('Half Pot').classList.contains('bg-[var(--brass)]')).toBe(true);
    expect(screen.getByText('Pot').classList.contains('bg-[var(--brass)]')).toBe(false);
  });

  it('未提供快捷按钮时不渲染按钮组', () => {
    render(<PotSizeInput label="底池大小" value={50} onChange={() => undefined} />);
    expect(screen.queryByText('Half Pot')).toBeNull();
  });
});
