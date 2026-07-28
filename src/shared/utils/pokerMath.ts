/**
 * 计算底池赔率百分比
 * @param potSize 当前底池大小
 * @param betSize 需要跟注的金额
 * @returns 底池赔率 (0-1)
 */
export function calculatePotOdds(potSize: number, betSize: number): number {
  if (potSize + betSize <= 0) return 0;
  return betSize / (potSize + betSize);
}

/**
 * 计算期望值
 * @param winRate 胜率 (0-1)
 * @param winAmount 赢时获得的金额
 * @param loseAmount 输时损失的金额
 * @returns 期望值
 */
export function calculateEV(winRate: number, winAmount: number, loseAmount: number): number {
  return winRate * winAmount - (1 - winRate) * loseAmount;
}

/**
 * 估算胜率 (Rule of 2 and 4)
 * @param outs 补牌数
 * @param street 当前街: 'flop' 表示翻牌后(还有2张牌要来), 'turn' 表示转牌后(还有1张牌要来)
 * @param variant 游戏变体
 * @returns 估算胜率 (0-1)
 */
export function estimateEquity(outs: number, street: 'flop' | 'turn', variant: 'standard' | 'short-deck' | 'heads-up' = 'standard'): number {
  if (variant === 'short-deck') {
    return estimateEquityShortDeck(outs, street) / 100;
  }
  const multiplier = street === 'flop' ? 4 : 2;
  const percentage = outs * multiplier;
  return Math.min(percentage, 100) / 100;
}

/**
 * 短牌模式的 Outs 估算（基于 36 张牌组）
 * @param outs 补牌数
 * @param street 当前街
 * @returns 估算胜率百分比 (0-100)
 */
export function estimateEquityShortDeck(outs: number, street: 'flop' | 'turn'): number {
  // 短牌 flop 后剩余牌 = 36 - 2(hero) - 3(board) = 31
  // 短牌 turn 后剩余牌 = 36 - 2(hero) - 4(board) = 30
  if (street === 'flop') {
    const p1 = outs / 31;
    const p2 = outs / 30;
    return (p1 + p2 - p1 * p2) * 100;
  } else {
    return (outs / 30) * 100;
  }
}

/**
 * 计算隐含赔率
 * @param potOdds 底池赔率
 * @param expectedFutureGain 预期未来收益
 * @returns 隐含赔率
 */
export function calculateImpliedOdds(potOdds: number, expectedFutureGain: number): number {
  return potOdds + expectedFutureGain;
}

/**
 * 是否应该跟注
 * @param equity 手牌胜率
 * @param potOdds 底池赔率
 * @returns 是否有利可图
 */
export function isProfitableCall(equity: number, potOdds: number): boolean {
  return equity >= potOdds;
}
