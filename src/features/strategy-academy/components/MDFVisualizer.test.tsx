import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MDFDerivation } from './MDFVisualizer';
import MdfComparisonTable from './MdfComparisonTable';

/**
 * MDF 可视化契约：
 * - 推导页：MDF = pot/(pot+bet) / Required Equity = bet/(pot+bet)，滑块联动
 * - 对比页：MDF / 所需胜率 / 诈唬占比 三概念表 + 独立滑块实时计算
 */

afterEach(() => cleanup());

describe('MDFDerivation：推导与滑块联动', () => {
  it('初始 pot=100 / bet=50 展示 66.7% 与 33.3%', () => {
    const { container } = render(<MDFDerivation pot={100} bet={50} />);
    expect(screen.getByText('MDF 推导过程')).toBeTruthy();
    expect(screen.getByText('三概念对比')).toBeTruthy();
    expect(screen.getAllByText('66.7%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('33.3%').length).toBeGreaterThanOrEqual(1);
    expect(container.textContent).toContain('MDF = pot / (pot + bet)');
    expect(container.textContent).toContain('Required Equity = bet / (pot + bet)');
  });

  it('调整底池滑块后 MDF 与所需胜率同步更新', () => {
    render(<MDFDerivation pot={100} bet={50} />);
    // 底池滑块上限 100：50/(50+50) = 50.0%，所需胜率同为 50.0%
    fireEvent.change(screen.getByRole('slider', { name: '底池大小' }), {
      target: { value: '50' },
    });
    expect(screen.getAllByText('50.0%').length).toBeGreaterThanOrEqual(2);
  });

  it('切换对比页渲染三概念表', () => {
    render(<MDFDerivation pot={100} bet={50} />);
    fireEvent.click(screen.getByText('三概念对比'));

    // 表格行概念名与结果卡标签同名，用 getAllByText 断言存在
    expect(screen.getAllByText('最小防御频率').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('跟注所需胜率').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('河牌诈唬占比').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('MDF = pot ÷ (pot + bet)')).toBeTruthy();
  });
});

describe('MdfComparisonTable：独立滑块计算', () => {
  it('初始 100/50 展示三概念结果，滑块变更后重算', () => {
    const { container } = render(<MdfComparisonTable initialPot={100} initialBet={50} />);
    expect(screen.getAllByText('最小防御频率').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('MDF = pot ÷ (pot + bet)')).toBeTruthy();
    expect(screen.getAllByText('66.7%').length).toBeGreaterThanOrEqual(1);
    // 对比表 Required Equity 口径为 bet/(pot+2bet)：50/200=25.0%
    expect(screen.getAllByText('25.0%').length).toBeGreaterThanOrEqual(1);

    const sliders = container.querySelectorAll<HTMLInputElement>('input[type="range"]');
    expect(sliders).toHaveLength(2);
    fireEvent.change(sliders[0]!, { target: { value: '200' } });
    // 200/(200+50)=80.0%；50/(200+100)=16.7%
    expect(screen.getAllByText('80.0%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('16.7%').length).toBeGreaterThanOrEqual(1);

    fireEvent.change(sliders[1]!, { target: { value: '100' } });
    // 200/(200+100)=66.7%，100/400=25.0%
    expect(screen.getAllByText('66.7%').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('25.0%').length).toBeGreaterThanOrEqual(1);
  });
});
