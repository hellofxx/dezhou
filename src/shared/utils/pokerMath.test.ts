import { describe, expect, it } from 'vitest';
import {
  calculatePotOdds,
  calculateEV,
  estimateEquity,
  estimateEquityShortDeck,
  calculateImpliedOdds,
  isProfitableCall,
} from './pokerMath';

describe('calculatePotOdds', () => {
  it('底池 100 跟注 50 → 1/3', () => {
    expect(calculatePotOdds(100, 50)).toBeCloseTo(1 / 3, 10);
  });

  it('底池与下注均为 0 时返回 0（防除零）', () => {
    expect(calculatePotOdds(0, 0)).toBe(0);
  });
});

describe('calculateEV', () => {
  it('胜率 50%、输赢等额 → EV 为 0', () => {
    expect(calculateEV(0.5, 100, 100)).toBe(0);
  });

  it('胜率 40% 赢 150 输 100 → EV 为 0', () => {
    expect(calculateEV(0.4, 150, 100)).toBeCloseTo(0, 10);
  });
});

describe('estimateEquity (2/4 法则)', () => {
  it('flop 9 outs → 36%', () => {
    expect(estimateEquity(9, 'flop')).toBeCloseTo(0.36, 10);
  });

  it('turn 9 outs → 18%', () => {
    expect(estimateEquity(9, 'turn')).toBeCloseTo(0.18, 10);
  });

  it('超大 outs 封顶 100%', () => {
    expect(estimateEquity(30, 'flop')).toBe(1);
  });

  it('短牌变体委托互补概率公式（flop 9 outs）', () => {
    const expected = estimateEquityShortDeck(9, 'flop') / 100;
    expect(estimateEquity(9, 'flop', 'short-deck')).toBeCloseTo(expected, 10);
  });
});

describe('estimateEquityShortDeck', () => {
  it('turn 按 outs/30 计算', () => {
    expect(estimateEquityShortDeck(9, 'turn')).toBeCloseTo((9 / 30) * 100, 10);
  });
});

describe('calculateImpliedOdds', () => {
  it('底池赔率与预期未来收益相加', () => {
    expect(calculateImpliedOdds(0.2, 0.1)).toBeCloseTo(0.3, 10);
  });
});

describe('isProfitableCall', () => {
  it('胜率等于底池赔率时视为有利可图（含等号）', () => {
    expect(isProfitableCall(0.25, 0.25)).toBe(true);
  });

  it('胜率低于底池赔率时不可跟注', () => {
    expect(isProfitableCall(0.2, 0.25)).toBe(false);
  });
});
