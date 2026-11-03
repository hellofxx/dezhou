import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { calculateEV, EVCalculator } from './EVCalculator';

/**
 * EV 计算器契约：
 * - calculateEV 的胜率口径为 0-1 概率，越界 / 非有限值一律夹紧
 * - UI 滑块为 0-100 百分比：边界处必须归一化后再计算（回归锁：
 *   旧实现把 30 直接传给 calculateEV 被 clamp 成 100%，默认显示 +150BB）
 */

afterEach(() => cleanup());

describe('calculateEV：概率口径与夹紧', () => {
  it('正常用例：rate*(pot+bet) - (1-rate)*bet', () => {
    expect(calculateEV(100, 50, 0.3)).toBeCloseTo(10, 10);
    expect(calculateEV(100, 50, 0.5)).toBeCloseTo(50, 10);
    expect(calculateEV(100, 50, 0)).toBeCloseTo(-50, 10);
  });

  it('胜率越界夹紧到 0-1', () => {
    expect(calculateEV(100, 50, 1.2)).toBeCloseTo(150, 10);
    expect(calculateEV(100, 50, -0.5)).toBeCloseTo(-50, 10);
  });

  it('非有限值 / 负底池与下注按 0 兜底', () => {
    expect(calculateEV(100, 50, Number.NaN)).toBeCloseTo(-50, 10);
    expect(calculateEV(Number.NaN, 50, 0.5)).toBeCloseTo(0, 10);
    expect(calculateEV(100, -50, 0.5)).toBeCloseTo(50, 10);
  });
});

describe('EVCalculator：百分比输入归一化（回归锁）', () => {
  it('默认 30% 胜率 / pot 100 / bet 50 显示 +10.00BB（而非 +150BB）', () => {
    render(<EVCalculator />);

    expect(screen.getByText('EV 曲线可视化')).toBeTruthy();
    expect(screen.getByText('+10.00BB')).toBeTruthy();
    expect(screen.getByText('25.0%')).toBeTruthy();
    expect(screen.getAllByText('30%').length).toBeGreaterThanOrEqual(2); // 滑块旁 + 当前胜率
  });

  it('调整底池与胜率后 EV 实时更新', () => {
    render(<EVCalculator />);

    fireEvent.change(screen.getByRole('spinbutton', { name: '底池大小' }), {
      target: { value: '200' },
    });
    // 0.3*(200+50) - 0.7*50 = 75 - 35 = 40
    expect(screen.getByText('+40.00BB')).toBeTruthy();

    fireEvent.change(screen.getByRole('slider', { name: '胜率滑块' }), {
      target: { value: '0' },
    });
    // 0*(250) - 1*50 = -50
    expect(screen.getByText('-50.00BB')).toBeTruthy();
  });
});
