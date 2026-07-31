/**
 * 扑克数学纯函数（shared 层）。
 *
 * 边界防御口径（P1B-10 专批 A，2026-07-31）：
 * - 所有金额 / outs 入参经 Number.isFinite 守卫，非法值（NaN / ±Infinity）按 0 处理；
 * - 金额与 outs 负值 clamp 到 0；胜率类入参 clamp 到 [0,1]；
 * - 胜率类返回值 clamp 到 [0,1]（estimateEquity）或 [0,100]（estimateEquityShortDeck）；
 * - clamp 仅作用于非法边界输入，不改变正常输入的返回语义。
 *
 * 历史处置：calculateImpliedOdds（potOdds + gain，方向错误）已于专批 A 删除——
 * P1B-02 修复后唯一调用方 pot-odds 改用「收益并入底池」口径（见 pot-odds/utils/oddsMath.ts）。
 */

/** 金额 / outs 入参防御：非法（NaN/Infinity）归 0，负值 clamp 到 0 */
function sanitizeNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

/** 胜率类入参防御：非法归 0，越界 clamp 到 [0,1] */
function sanitizeRate(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

/**
 * 计算底池赔率（所需胜率）
 *
 * ⚠️ potSize 口径（与 pot-odds/utils/oddsMath.ts 头注一致，P1B-01 裁决的权威三项式）：
 * potSize 必须为「已并入对手本次下注后的底池总额」。若调用方将「当前底池」与
 * 「对手下注」分开维护（即当前底池不含对手本次下注），需自行并入后再调用：
 *   requiredEquity = calculatePotOdds(pot + bet, bet) = bet / (pot + bet + bet)
 *   例：pot=100, bet=50 → 50 / 200 = 25%
 * 直接传「不含对手下注的底池」会高估所需胜率（P1B-01 历史缺陷根因）。
 *
 * @param potSize 底池总额（已含对手本次下注；≥0，NaN/Infinity/负值按 0 处理）
 * @param betSize 需要跟注的金额（≥0，NaN/Infinity/负值按 0 处理）
 * @returns 底池赔率 (0-1)
 */
export function calculatePotOdds(potSize: number, betSize: number): number {
  const pot = sanitizeNonNegative(potSize);
  const bet = sanitizeNonNegative(betSize);
  if (pot + bet <= 0) return 0;
  return bet / (pot + bet);
}

/**
 * 计算期望值：EV = winRate × winAmount - (1 - winRate) × loseAmount
 *
 * ⚠️ winAmount 口径（与 pot-odds/utils/oddsMath.ts P1B-03 一致）：
 * 跟注场景下 winAmount 应为「当前底池 + 对手本次下注」（对手下注由调用方自行并入），
 * loseAmount 为我方跟注额。漏并对手下注会系统性低估 EV（P1B-03 历史缺陷根因）。
 *
 * @param winRate 胜率（0-1；越界 clamp，NaN/Infinity 按 0 处理）
 * @param winAmount 赢时获得的金额（≥0，NaN/Infinity/负值按 0 处理）
 * @param loseAmount 输时损失的金额（≥0，NaN/Infinity/负值按 0 处理）
 * @returns 期望值（正常语义下可为负，结果不 clamp）
 */
export function calculateEV(winRate: number, winAmount: number, loseAmount: number): number {
  const rate = sanitizeRate(winRate);
  const win = sanitizeNonNegative(winAmount);
  const lose = sanitizeNonNegative(loseAmount);
  return rate * win - (1 - rate) * lose;
}

/**
 * 估算胜率 (Rule of 2 and 4)
 * @param outs 补牌数（≥0，NaN/Infinity/负值按 0 处理）
 * @param street 当前街: 'flop' 表示翻牌后(还有2张牌要来), 'turn' 表示转牌后(还有1张牌要来)
 * @param variant 游戏变体
 * @returns 估算胜率 (0-1)，结果 clamp 到 [0,1]
 */
export function estimateEquity(outs: number, street: 'flop' | 'turn', variant: 'standard' | 'short-deck' | 'heads-up' = 'standard'): number {
  const safeOuts = sanitizeNonNegative(outs);
  if (variant === 'short-deck') {
    return estimateEquityShortDeck(safeOuts, street) / 100;
  }
  const multiplier = street === 'flop' ? 4 : 2;
  const percentage = safeOuts * multiplier;
  return Math.min(100, Math.max(0, percentage)) / 100;
}

/**
 * 短牌模式的 Outs 估算（基于 36 张牌组）
 *
 * 边界：单街命中概率 outs/剩余牌 clamp 到 [0,1]（outs 超过剩余牌数视为必中），
 * 防止互补概率公式在 outs>31 时溢出为负（历史缺陷：outs=100 → -419%）；
 * 最终结果再 clamp 到 [0,100]。
 *
 * @param outs 补牌数（≥0，NaN/Infinity/负值按 0 处理）
 * @param street 当前街
 * @returns 估算胜率百分比 (0-100)
 */
export function estimateEquityShortDeck(outs: number, street: 'flop' | 'turn'): number {
  const safeOuts = sanitizeNonNegative(outs);
  // 短牌 flop 后剩余牌 = 36 - 2(hero) - 3(board) = 31
  // 短牌 turn 后剩余牌 = 36 - 2(hero) - 4(board) = 30
  if (street === 'flop') {
    const p1 = Math.min(1, safeOuts / 31);
    const p2 = Math.min(1, safeOuts / 30);
    return Math.min(100, Math.max(0, (p1 + p2 - p1 * p2) * 100));
  } else {
    return Math.min(100, Math.max(0, (safeOuts / 30) * 100));
  }
}

/**
 * 是否应该跟注
 * @param equity 手牌胜率 (0-1)
 * @param potOdds 底池赔率（所需胜率，0-1）
 * @returns 是否有利可图；任一入参非法（NaN/Infinity）时保守返回 false
 */
export function isProfitableCall(equity: number, potOdds: number): boolean {
  if (!Number.isFinite(equity) || !Number.isFinite(potOdds)) return false;
  return equity >= potOdds;
}
