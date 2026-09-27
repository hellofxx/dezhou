import { describe, it, expect } from 'vitest';
import {
  calculateAlpha,
  calculateMDF,
  requiredEquity,
  kellyFraction,
  halfKellyFraction,
  requiredHandsForEdge,
  riskOfRuin,
} from './theoryFormulas';

/**
 * 锚点取自已发布正文，函数与课文任一侧漂移即红：
 * MDF/Alpha ↔ t5-mdf-alpha idx0/idx1（半池 67%/满池 50%/2 倍池 33%）；
 * Kelly ↔ t8-bankroll-psych idx2（p=0.55、b=1 → 10%，半 Kelly 5%）。
 */
describe('theoryFormulas 口径锚点', () => {
  it('MDF：半池 66.7% / 满池 50% / 2 倍池 33.3%', () => {
    expect(calculateMDF(100, 50)).toBeCloseTo(2 / 3, 4);
    expect(calculateMDF(100, 100)).toBeCloseTo(0.5, 6);
    expect(calculateMDF(100, 200)).toBeCloseTo(1 / 3, 4);
  });

  it('Alpha 与 MDF 互补，且尺度表与 t5-mdf-alpha 一致', () => {
    for (const bet of [40, 50, 75, 100, 200]) {
      expect(calculateAlpha(100, bet) + calculateMDF(100, bet)).toBeCloseTo(1, 10);
    }
    expect(calculateAlpha(100, 50)).toBeCloseTo(1 / 3, 4);
    expect(calculateAlpha(100, 100)).toBeCloseTo(0.5, 6);
  });

  it('跟注所需权益：半池 25% / 满池 33.3% / 3-bet 底池 31.4%', () => {
    expect(requiredEquity(50, 200)).toBeCloseTo(0.25, 6);
    expect(requiredEquity(100, 300)).toBeCloseTo(1 / 3, 6);
    // CO 开 2.5（含盲注底池 4）Facing BTN 3-bet to 8：需补 5.5，跟注后底池 17.5
    expect(requiredEquity(5.5, 17.5)).toBeCloseTo(0.3143, 4);
  });

  it('Kelly：p=0.55 b=1 → 10%，半 Kelly 5%；无优势归零', () => {
    expect(kellyFraction(0.55, 1)).toBeCloseTo(0.1, 10);
    expect(halfKellyFraction(0.55, 1)).toBeCloseTo(0.05, 10);
    expect(kellyFraction(0.6, 1)).toBeCloseTo(0.2, 10);
    expect(kellyFraction(0.5, 1)).toBe(0);
    expect(kellyFraction(0.55, 2)).toBeCloseTo(0.325, 6);
  });

  it('样本量：5bb/100 @80bb/100 需 98,345 手（z=1.96）', () => {
    expect(requiredHandsForEdge(5, 80, 1.96)).toBeCloseTo(98345, 0);
    expect(requiredHandsForEdge(5, 80, 1.645)).toBeCloseTo(69274, 0);
    expect(requiredHandsForEdge(10, 80, 1.96)).toBeCloseTo(24586, 0);
    expect(requiredHandsForEdge(0, 80, 1.96)).toBe(Number.POSITIVE_INFINITY);
  });

  it('破产概率：30/20/10 买入 ≈ 0.9% / 4.4% / 21%（5bb/100、80bb/100）', () => {
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 1000 })).toBeCloseTo(0.2096, 4);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 2000 })).toBeCloseTo(0.0439, 4);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 3000 })).toBeCloseTo(0.0092, 4);
  });

  it('边界不静默产出 NaN/Infinity', () => {
    expect(calculateAlpha(100, 0)).toBe(0);
    expect(calculateMDF(100, 0)).toBe(1);
    expect(requiredEquity(0, 100)).toBe(0);
    expect(Number.isNaN(requiredEquity(50, 0))).toBe(true);
    expect(kellyFraction(0.55, 0)).toBe(Number.NaN);
    expect(riskOfRuin({ winrateBB100: 0, sdBB100: 80, bankrollBB: 1000 })).toBe(1);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 80, bankrollBB: 0 })).toBe(1);
    expect(riskOfRuin({ winrateBB100: 5, sdBB100: 0, bankrollBB: 1000 })).toBe(0);
  });
});
