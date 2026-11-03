import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EVCalculator } from './EVCalculator';
import { usePotOddsStore } from '../store';
import { DEFAULT_EV_STATE } from '../constants';

/**
 * EVCalculator 交互契约（L2 / jsdom）：
 * EV = 胜率 × 底池 - (1 - 胜率) × 跟注额；盈亏平衡点 = call / (pot + call)。
 * 等号分支（winRate == breakeven）必须显示 "=" 与"盈亏平衡"，不能退化成 "亏损"
 * （P1B-08 回归锁）。
 */
beforeEach(() => {
  usePotOddsStore.setState({ evState: { ...DEFAULT_EV_STATE } });
});

afterEach(cleanup);

function numberInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="number"]'));
}

function winRateSlider(container: HTMLElement): HTMLInputElement {
  const slider = container.querySelector<HTMLInputElement>('input[type="range"]');
  if (!slider) throw new Error('未找到胜率滑块');
  return slider;
}

describe('EVCalculator 结果计算', () => {
  it('默认参数（35% / pot 100 / call 50）：EV +2.50，胜率高于平衡点显示盈利', () => {
    const { container } = render(<EVCalculator />);
    const text = container.textContent ?? '';

    expect(screen.getByText('EV 计算')).toBeTruthy();
    expect(text).toContain('+2.50');
    expect(text).toContain('33.3%');
    expect(text).toContain('当前胜率 35% > 平衡点 33.3% → 盈利');
    expect(screen.getByText('EV 随胜率变化曲线')).toBeTruthy();
  });

  it('胜率低于平衡点：EV 为负并显示亏损', () => {
    const { container } = render(<EVCalculator />);

    fireEvent.change(winRateSlider(container), { target: { value: '30' } });

    expect(usePotOddsStore.getState().evState.winRate).toBe(30);
    const text = container.textContent ?? '';
    expect(text).toContain('-5.00');
    expect(text).toContain('当前胜率 30% < 平衡点 33.3% → 亏损');
  });

  it('胜率恰好等于平衡点：显示 "=" 与"盈亏平衡"（P1B-08）', () => {
    const { container } = render(<EVCalculator />);
    const [, callInput] = numberInputs(container);
    fireEvent.change(callInput!, { target: { value: '100' } });
    expect(container.textContent).toContain('50.0%');

    fireEvent.change(winRateSlider(container), { target: { value: '50' } });

    const text = container.textContent ?? '';
    expect(text).toContain('+0.00');
    expect(text).toContain('当前胜率 50% = 平衡点 50.0% → 盈亏平衡');
  });

  it('修改底池与跟注金额写入 store 并重算盈亏平衡点', () => {
    const { container } = render(<EVCalculator />);
    const [potInput, callInput] = numberInputs(container);

    fireEvent.change(potInput!, { target: { value: '300' } });
    fireEvent.change(callInput!, { target: { value: '100' } });

    expect(usePotOddsStore.getState().evState).toEqual({
      winRate: 35,
      potSize: 300,
      callAmount: 100,
    });
    // 100 / (300 + 100) = 25.0%
    expect(container.textContent).toContain('25.0%');
    // EV = 0.35 × 300 - 0.65 × 100 = +40.00
    expect(container.textContent).toContain('+40.00');
  });

  it('重置按钮恢复默认参数与结果', () => {
    const { container } = render(<EVCalculator />);
    fireEvent.change(winRateSlider(container), { target: { value: '80' } });
    fireEvent.change(numberInputs(container)[0]!, { target: { value: '400' } });
    fireEvent.change(numberInputs(container)[1]!, { target: { value: '20' } });

    fireEvent.click(container.querySelector('button')!);

    expect(usePotOddsStore.getState().evState).toEqual(DEFAULT_EV_STATE);
    expect(container.textContent).toContain('+2.50');
  });
});
