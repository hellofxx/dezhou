import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { EquityChart } from './EquityChart';

/**
 * EquityChart 用户可见契约（L2 / jsdom）：
 * 卡片标题固定为"权益对比"，差值徽章必须带符号且保留一位小数（估算 - 需要），
 * 正负差值决定徽章配色 —— 这里断言文案与配色 class，图表 SVG 在 jsdom 中无布局尺寸，不作断言。
 */
afterEach(cleanup);

describe('EquityChart', () => {
  it('估算胜率高于需要胜率：差值徽章显示正号并使用成功色', () => {
    render(<EquityChart potOdds={25} estimatedEquity={36} />);

    expect(screen.getByText('权益对比')).toBeTruthy();
    const diff = screen.getByText('差值: +11.0%');
    expect(diff).toBeTruthy();
    expect(diff.classList.contains('text-[var(--success)]')).toBe(true);
  });

  it('估算胜率低于需要胜率：差值徽章显示负号并使用危险色', () => {
    render(<EquityChart potOdds={40} estimatedEquity={20} />);

    const diff = screen.getByText('差值: -20.0%');
    expect(diff).toBeTruthy();
    expect(diff.classList.contains('text-[var(--danger)]')).toBe(true);
  });

  it('两者相等：差值显示 +0.0% 且归入非负分支', () => {
    render(<EquityChart potOdds={25} estimatedEquity={25} />);

    const diff = screen.getByText('差值: +0.0%');
    expect(diff.classList.contains('text-[var(--success)]')).toBe(true);
  });
});
