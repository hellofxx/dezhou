import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import PotOddsPage from './PotOddsPage';
import { usePotOddsStore } from '../store';
import { DEFAULT_EV_STATE, DEFAULT_ODDS_STATE } from '../constants';

/**
 * PotOddsPage 页面组合冒烟（L2 / jsdom）：
 * 两个 Tab（底池赔率 / EV 分析）各自挂载正确的面板，懒加载图表与 EV 计算器可正常解析；
 * 切 Tab 不丢页头，也不把另一个面板的内容残留在 DOM 中。
 */
beforeEach(() => {
  usePotOddsStore.setState({
    oddsState: { ...DEFAULT_ODDS_STATE },
    evState: { ...DEFAULT_EV_STATE },
  });
});

afterEach(cleanup);

describe('PotOddsPage', () => {
  it('默认渲染页头与底池赔率面板，懒加载的权益对比图最终出现', async () => {
    render(<PotOddsPage />);

    expect(screen.getByText('Pot Odds & EV')).toBeTruthy();
    expect(screen.getByText('底池赔率与 EV 计算器')).toBeTruthy();
    expect(
      screen.getByText('计算底池赔率、估算胜率、分析期望值，帮助你做出更好的跟注决策'),
    ).toBeTruthy();
    expect(screen.getByText('参数设置')).toBeTruthy();
    expect(screen.getByText('常见听牌参考')).toBeTruthy();
    expect(await screen.findByText('权益对比', undefined, { timeout: 5000 })).toBeTruthy();
  });

  it('切到 EV 分析 Tab：挂载 EV 计算面板并卸载底池赔率面板', async () => {
    render(<PotOddsPage />);

    fireEvent.click(screen.getByText('EV 分析'));

    expect(await screen.findByText('EV 计算', undefined, { timeout: 5000 })).toBeTruthy();
    expect(screen.queryByText('参数设置')).toBeNull();
    expect(screen.queryByText('常见听牌参考')).toBeNull();
    // 页头与 Tab 保持可见
    expect(screen.getByText('底池赔率与 EV 计算器')).toBeTruthy();
  });

  it('切回底池赔率 Tab：恢复计算器与听牌参考', async () => {
    render(<PotOddsPage />);
    fireEvent.click(screen.getByText('EV 分析'));
    await screen.findByText('EV 计算');

    fireEvent.click(screen.getByText('底池赔率'));

    expect(screen.getByText('参数设置')).toBeTruthy();
    expect(screen.getByText('常见听牌参考')).toBeTruthy();
    expect(screen.queryByText('EV 计算')).toBeNull();
    expect(await screen.findByText('权益对比', undefined, { timeout: 5000 })).toBeTruthy();
  });
});
