import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { OddsCalculator } from './OddsCalculator';
import { usePotOddsStore } from '../store';
import { DEFAULT_ODDS_STATE } from '../constants';

/**
 * OddsCalculator 交互契约（L2 / jsdom）：
 * 参数输入（底池 / 对手下注 / outs / 街道 / 变体 / 隐含赔率）必须写入 store 并把
 * 计算结果同步到 OddsDisplay；快捷下注按钮与重置按钮的行为对用户可见。
 */
beforeEach(() => {
  usePotOddsStore.setState({ oddsState: { ...DEFAULT_ODDS_STATE } });
});

afterEach(cleanup);

function numberInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="number"]'));
}

function rangeInputs(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll<HTMLInputElement>('input[type="range"]'));
}

describe('OddsCalculator 默认渲染', () => {
  it('默认参数下展示 25% 所需胜率、36% 估算胜率与跟注建议', () => {
    const { container } = render(<OddsCalculator />);
    const text = container.textContent ?? '';

    expect(screen.getByText('参数设置')).toBeTruthy();
    expect(screen.getByText('游戏变体')).toBeTruthy();
    expect(screen.getByText('底池大小')).toBeTruthy();
    expect(screen.getByText('对手下注')).toBeTruthy();
    expect(screen.getByText('Outs 数量')).toBeTruthy();
    expect(text).toContain('25.0%');
    expect(text).toContain('36.0%');
    expect(screen.getByText('建议跟注')).toBeTruthy();
  });
});

describe('OddsCalculator 参数输入', () => {
  it('修改底池数字框实时写入 store 并重算所需胜率', () => {
    const { container } = render(<OddsCalculator />);
    const [potInput] = numberInputs(container);

    fireEvent.change(potInput!, { target: { value: '200' } });

    expect(usePotOddsStore.getState().oddsState.potSize).toBe(200);
    expect(container.textContent).toContain('16.7%');
  });

  it('修改对手下注数字框写入 store 并重算所需胜率', () => {
    const { container } = render(<OddsCalculator />);
    const betInput = numberInputs(container)[1]!;

    fireEvent.change(betInput, { target: { value: '150' } });

    expect(usePotOddsStore.getState().oddsState.betSize).toBe(150);
    // 150 / (100 + 150 + 150) = 37.5%
    expect(container.textContent).toContain('37.5%');
  });

  it('outs 滑块更新 outs 并改变估算胜率（Rule of 4）', () => {
    const { container } = render(<OddsCalculator />);
    // range 顺序：底池滑块、对手下注滑块、outs 滑块
    const outsRange = rangeInputs(container)[2]!;

    fireEvent.change(outsRange, { target: { value: '15' } });

    expect(usePotOddsStore.getState().oddsState.outs).toBe(15);
    // outs 读数（大字）与滑块刻度都会出现 '15'，取读数节点断言显示已更新
    const outsReadout = screen.getAllByText('15').find((el) => el.className.includes('text-lg'));
    expect(outsReadout).toBeTruthy();
    expect(container.textContent).toContain('60.0%');
  });

  it('街道切换改变 hint 与估算倍率（flop ×4 / turn ×2）', () => {
    const { container } = render(<OddsCalculator />);
    expect(screen.getByText('还有2张牌要来，使用 ×4 法则')).toBeTruthy();

    fireEvent.click(screen.getByText('转牌后 (Turn)'));

    expect(usePotOddsStore.getState().oddsState.street).toBe('turn');
    expect(screen.getByText('还有1张牌要来，使用 ×2 法则')).toBeTruthy();
    expect(container.textContent).toContain('18.0%');

    fireEvent.click(screen.getByText('翻牌后 (Flop)'));
    expect(screen.getByText('还有2张牌要来，使用 ×4 法则')).toBeTruthy();
  });

  it('短牌变体切换使用 36 张牌组估算，并显示模式提示', () => {
    const { container } = render(<OddsCalculator />);
    expect(screen.queryByText(/短牌模式基于 36 张牌组计算/)).toBeNull();

    fireEvent.click(screen.getByText('短牌德州 (6+)'));

    expect(usePotOddsStore.getState().oddsState.gameVariant).toBe('short-deck');
    expect(screen.getByText(/短牌模式基于 36 张牌组计算/)).toBeTruthy();
    expect(container.textContent).toContain('50.3%');

    fireEvent.click(screen.getByText('标准德州'));
    expect(usePotOddsStore.getState().oddsState.gameVariant).toBe('standard');
    expect(screen.queryByText(/短牌模式基于 36 张牌组计算/)).toBeNull();
  });
});

describe('OddsCalculator 快捷下注与隐含赔率', () => {
  it('快捷下注按钮按底池比例写入 betSize', () => {
    render(<OddsCalculator />);

    fireEvent.click(screen.getByText('Pot'));
    expect(usePotOddsStore.getState().oddsState.betSize).toBe(100);

    fireEvent.click(screen.getByText('1/2 Pot'));
    expect(usePotOddsStore.getState().oddsState.betSize).toBe(50);

    fireEvent.click(screen.getByText('3/4 Pot'));
    expect(usePotOddsStore.getState().oddsState.betSize).toBe(75);

    fireEvent.click(screen.getByText('2x Pot'));
    expect(usePotOddsStore.getState().oddsState.betSize).toBe(200);
  });

  it('隐含赔率默认折叠，展开后可输入预期额外收益并降低所需胜率', () => {
    const { container } = render(<OddsCalculator />);
    expect(screen.queryByText('预期额外收益')).toBeNull();

    fireEvent.click(screen.getByText('隐含赔率（高级选项）'));
    expect(screen.getByText('预期额外收益')).toBeTruthy();

    const gainInput = numberInputs(container)[2]!;
    fireEvent.change(gainInput, { target: { value: '100' } });

    expect(usePotOddsStore.getState().oddsState.impliedOddsGain).toBe(100);
    // 50 / (100 + 50 + 50 + 100) = 16.67%
    expect(container.textContent).toContain('16.7%');

    fireEvent.click(screen.getByText('隐含赔率（高级选项）'));
    expect(screen.queryByText('预期额外收益')).toBeNull();
  });

  it('重置按钮把所有参数恢复默认（含变体 / 街道 / outs / 隐含赔率）', () => {
    const { container } = render(<OddsCalculator />);
    fireEvent.change(numberInputs(container)[0]!, { target: { value: '999' } });
    fireEvent.change(rangeInputs(container)[2]!, { target: { value: '3' } });
    fireEvent.click(screen.getByText('转牌后 (Turn)'));
    fireEvent.click(screen.getByText('短牌德州 (6+)'));
    fireEvent.click(screen.getByText('隐含赔率（高级选项）'));
    fireEvent.change(numberInputs(container)[2]!, { target: { value: '70' } });

    // 卡片头部的重置按钮是组件内第一个 button
    fireEvent.click(container.querySelector('button')!);

    expect(usePotOddsStore.getState().oddsState).toEqual(DEFAULT_ODDS_STATE);
    expect(container.textContent).toContain('25.0%');
  });
});
