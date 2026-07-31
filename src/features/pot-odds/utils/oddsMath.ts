import { calculatePotOdds, calculateEV, estimateEquity, isProfitableCall } from '@/shared/utils/pokerMath';
import type { OddsCalculatorState, OddsResult } from '../types';

/**
 * 底池赔率面板核心口径（P1-B 修复，2026-07-31）——纯函数，供 useOddsCalculation 与测试共用。
 *
 * 权威口径（与题库三项式一致，已确认裁决）：
 *   所需胜率 = 跟注额 / (当前底池 + 对手下注 + 我方跟注额) = bet / (pot + bet + bet)
 *   例：pot=100, bet=50 → 50/200 = 25%
 *
 * 计算器 UI 将「底池大小」与「对手下注」分开输入，shared 的 calculatePotOdds(potSize, betSize)
 * 语义为「potSize 已含对手下注」（口径已在 shared/utils/pokerMath.ts JSDoc 明示，专批 A 2026-07-31）。
 * 因此本层将对手下注并入底池参数后再调用 shared 纯函数（其边界防御已由 P1B-10 专批 A 落地）。
 *
 * P1B-01：basePotOdds = calculatePotOdds(pot + bet, bet) → bet/(pot+2bet)
 * P1B-02：隐含赔率方向修正——预期额外收益并入底池：
 *   所需胜率 = bet / (pot + bet + bet + gain)，收益越大所需胜率越低。
 *   shared 的 calculateImpliedOdds（方向相反）已由专批 A 作为死代码删除。
 * P1B-03：EV 赢时获得 = 底池 + 对手下注（pot + bet），输时损失 = 跟注额（bet）。
 *   与 P1B-01 同批修复，保证 isProfitable 与 EV 符号一致（不再"错得自洽"）。
 */
export function computeOddsResult(state: OddsCalculatorState): OddsResult {
  const { potSize, betSize, outs, street, impliedOddsGain, gameVariant } = state;

  // P1B-01：对手下注并入底池参数 → 所需胜率 = bet / (pot + bet + bet)
  const basePotOdds = calculatePotOdds(potSize + betSize, betSize);
  // P1B-02：隐含收益并入底池 → 所需胜率 = bet / (pot + bet + bet + gain)
  const potOdds = impliedOddsGain > 0
    ? calculatePotOdds(potSize + betSize + impliedOddsGain, betSize)
    : basePotOdds;

  const requiredEquity = potOdds;
  const estimatedEquity = estimateEquity(outs, street, gameVariant);
  const profitable = isProfitableCall(estimatedEquity, requiredEquity);

  // P1B-03：EV = eq × (pot + bet) - (1 - eq) × bet
  const ev = calculateEV(estimatedEquity, potSize + betSize, betSize);

  return {
    potOdds: potOdds * 100,
    requiredEquity: requiredEquity * 100,
    estimatedEquity: estimatedEquity * 100,
    isProfitable: profitable,
    ev,
  };
}
