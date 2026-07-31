import { describe, expect, it } from 'vitest';
import {
  calculatePotOdds,
  calculateEV,
  estimateEquity,
  estimateEquityShortDeck,
  isProfitableCall,
} from './pokerMath';

// calculateImpliedOdds 已删除（专批 A，2026-07-31）：P1B-02 后零调用方死代码，
// 其「potOdds + gain」方向本身错误（收益越大所需胜率反而应越低），不保留测试。

describe('calculatePotOdds', () => {
  it('底池 100 跟注 50 → 1/3', () => {
    expect(calculatePotOdds(100, 50)).toBeCloseTo(1 / 3, 10);
  });

  it('底池与下注均为 0 时返回 0（防除零）', () => {
    expect(calculatePotOdds(0, 0)).toBe(0);
  });

  it('负 bet 不再返回 -1，clamp 为 0 后返回 0', () => {
    expect(calculatePotOdds(100, -100)).toBe(0);
    expect(calculatePotOdds(-50, -50)).toBe(0);
  });

  it('NaN / Infinity 入参按 0 处理，不产生 NaN 直通', () => {
    expect(calculatePotOdds(NaN, 50)).toBe(1); // pot 归 0 → 50/50
    expect(calculatePotOdds(100, NaN)).toBe(0);
    expect(calculatePotOdds(Infinity, 50)).toBe(1); // Infinity 归 0 → 50/50
    expect(Number.isFinite(calculatePotOdds(Infinity, Infinity))).toBe(true);
  });
});

describe('calculateEV', () => {
  it('胜率 50%、输赢等额 → EV 为 0', () => {
    expect(calculateEV(0.5, 100, 100)).toBe(0);
  });

  it('胜率 40% 赢 150 输 100 → EV 为 0', () => {
    expect(calculateEV(0.4, 150, 100)).toBeCloseTo(0, 10);
  });

  it('正常语义下 EV 可为负（结果不 clamp）', () => {
    expect(calculateEV(0.1, 100, 100)).toBeCloseTo(-80, 10);
  });

  it('胜率越界 clamp 到 [0,1]', () => {
    expect(calculateEV(1.5, 100, 100)).toBe(100); // rate clamp 1
    expect(calculateEV(-0.5, 100, 100)).toBe(-100); // rate clamp 0
  });

  it('NaN / Infinity / 负金额按 0 处理', () => {
    expect(calculateEV(NaN, 100, 100)).toBe(-100); // rate 归 0
    expect(calculateEV(0.5, NaN, 100)).toBe(-50); // win 归 0
    expect(calculateEV(0.5, 100, Infinity)).toBe(50); // lose 归 0
    expect(calculateEV(0.5, -100, -100)).toBe(0); // 双负金额归 0
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

  it('负 outs 不再返回负胜率，clamp 为 0', () => {
    expect(estimateEquity(-5, 'flop')).toBe(0);
    expect(estimateEquity(-5, 'turn', 'short-deck')).toBe(0);
  });

  it('NaN / Infinity outs 按 0 处理，结果恒在 [0,1]', () => {
    expect(estimateEquity(NaN, 'flop')).toBe(0);
    expect(estimateEquity(Infinity, 'turn')).toBe(0);
    expect(estimateEquity(Infinity, 'flop', 'short-deck')).toBe(0);
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

  it('outs>31 不再溢出为负（历史缺陷 outs=100 → -419%），封顶 100', () => {
    expect(estimateEquityShortDeck(100, 'flop')).toBe(100);
    expect(estimateEquityShortDeck(32, 'flop')).toBe(100);
    expect(estimateEquityShortDeck(100, 'turn')).toBe(100);
  });

  it('负 / NaN / Infinity outs 按 0 处理，结果恒在 [0,100]', () => {
    expect(estimateEquityShortDeck(-9, 'flop')).toBe(0);
    expect(estimateEquityShortDeck(NaN, 'turn')).toBe(0);
    expect(estimateEquityShortDeck(Infinity, 'flop')).toBe(0);
  });
});

describe('isProfitableCall', () => {
  it('胜率等于底池赔率时视为有利可图（含等号）', () => {
    expect(isProfitableCall(0.25, 0.25)).toBe(true);
  });

  it('胜率低于底池赔率时不可跟注', () => {
    expect(isProfitableCall(0.2, 0.25)).toBe(false);
  });

  it('任一入参非法（NaN/Infinity）时保守返回 false', () => {
    expect(isProfitableCall(NaN, 0.25)).toBe(false);
    expect(isProfitableCall(0.5, NaN)).toBe(false);
    expect(isProfitableCall(Infinity, 0.25)).toBe(false);
  });
});
