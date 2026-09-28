import { describe, it, expect } from 'vitest';
import {
  calculateAlpha,
  calculateMDF,
  requiredEquity,
  kellyFraction,
  halfKellyFraction,
  requiredHandsForEdge,
  riskOfRuin,
  multiwayAllFold,
  perDefenderRequiredDefense,
  multiwayBluffEv,
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

  it('多人防守：乘积律、责任分摊与尺度上调的反效果', () => {
    // 半池下注进单挑：α=1/3 恰为保本弃牌率 → EV=0
    expect(calculateAlpha(100, 50)).toBeCloseTo(1 / 3, 6);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 1 })).toBeCloseTo(0, 10);
    // 两名各按 MDF(66.7%) 防守的对手：全弃率 (1/3)² = 11.1%
    expect(multiwayAllFold(1 / 3, 2)).toBeCloseTo(0.1111, 4);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 2 })).toBeCloseTo(-33.33, 2);
    // 三名：(1/3)³ = 3.7%
    expect(multiwayAllFold(1 / 3, 3)).toBeCloseTo(0.037, 3);
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 50, foldRate: 1 / 3, defenders: 3 })).toBeCloseTo(-44.44, 2);
    // 责任分摊：每人只需防守 1−α^(1/n)，两人 42.3%、三人 30.7%
    expect(perDefenderRequiredDefense(1 / 3, 2)).toBeCloseTo(0.4226, 4);
    expect(perDefenderRequiredDefense(1 / 3, 3)).toBeCloseTo(0.3066, 4);
    // 常见错算：把单挑 MDF 66.7% 除以人数得 33.4% —— 低于真实义务
    expect(0.6667 / 2).toBeLessThan(perDefenderRequiredDefense(1 / 3, 2));
    // 恒等式：分摊后"至少一人拦住"的概率仍等于单挑 MDF
    const d2 = perDefenderRequiredDefense(1 / 3, 2);
    expect(1 - (1 - d2) ** 2).toBeCloseTo(calculateMDF(100, 50), 10);
    // 放大尺度不救诈唬：满池进两人（各弃 50%）EV 更差
    expect(multiwayBluffEv({ potBeforeBet: 100, betSize: 100, foldRate: 0.5, defenders: 2 })).toBeCloseTo(-50, 10);
  });

  it('多人函数边界不静默产出 NaN/Infinity', () => {
    expect(Number.isNaN(multiwayAllFold(1.2, 2))).toBe(true);
    expect(multiwayAllFold(0.5, 0)).toBe(1);
    expect(Number.isNaN(perDefenderRequiredDefense(0, 2))).toBe(true);
    expect(Number.isNaN(perDefenderRequiredDefense(1, 2))).toBe(true);
    expect(Number.isNaN(perDefenderRequiredDefense(0.5, 0))).toBe(true);
  });
});
