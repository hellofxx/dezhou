/**
 * 理论学院量化口径纯函数（模块内自持，不下沉 shared：当前仅 theory-academy 消费）。
 *
 * 口径与 `data/levels/variants/standard/standardQuantAudit.test.ts` 文件头审计口径同源，
 * 任一公式语义变更须同时更新该审计文件的复算块与正文段落。
 */

/** 下注方诈唬盈亏平衡所需的弃牌率：α = b / (P + b)，P = 下注前底池，b = 该街下注总额 */
export function calculateAlpha(potBeforeBet: number, betSize: number): number {
  const total = potBeforeBet + betSize;
  if (betSize <= 0 || total <= 0) return 0;
  return betSize / total;
}

/** 面对下注必须继续（跟注或加注）的最低频率：MDF = P / (P + b)，与 calculateAlpha 互补 */
export function calculateMDF(potBeforeBet: number, betSize: number): number {
  const total = potBeforeBet + betSize;
  if (betSize <= 0 || total <= 0) return 1;
  return potBeforeBet / total;
}

/**
 * 跟注所需的最低权益 = 需补入额 / 跟注后底池。
 * 用「需补入额」而非「对手下注额」：已投入的部分不可重复计入风险。
 */
export function requiredEquity(amountToCall: number, potAfterCall: number): number {
  if (amountToCall <= 0) return 0;
  if (potAfterCall <= 0) return Number.NaN;
  return amountToCall / potAfterCall;
}

/** 全 Kelly 下注比例 f* = (b·p − q) / b，winProb 为胜率、netOdds 为「赢时赢取 / 输时输掉」的净赔率 b */
export function kellyFraction(winProb: number, netOdds: number): number {
  if (netOdds <= 0) return Number.NaN;
  const loseProb = 1 - winProb;
  const fraction = (netOdds * winProb - loseProb) / netOdds;
  return fraction > 0 ? fraction : 0;
}

/** 半 Kelly：实践中用于吸收胜率估计误差与心理承受下限 */
export function halfKellyFraction(winProb: number, netOdds: number): number {
  return kellyFraction(winProb, netOdds) / 2;
}

/** 每百手转为单手：标准差按 √n 缩放，故除以 10 */
function perHandStdDev(sdPer100Hands: number): number {
  return sdPer100Hands / 10;
}

/**
 * 以 z 倍标准差在胜率上达到统计显著所需手数：n = (z·σ_hand / μ_hand)²。
 * 输入均以 bb/100 为单位，等价于 100·(z·sdBB100 / edgeBB100)²。
 */
export function requiredHandsForEdge(edgeBB100: number, sdBB100: number, zSigma: number): number {
  if (edgeBB100 <= 0 || sdBB100 <= 0 || zSigma <= 0) return Number.POSITIVE_INFINITY;
  const muPerHand = edgeBB100 / 100;
  const sigmaPerHand = perHandStdDev(sdBB100);
  return (zSigma * sigmaPerHand / muPerHand) ** 2;
}

/**
 * 扩散近似下的破产概率 ROR = exp(−2μB / σ²)，μ 为单手期望、σ² 为单手方差、B 为以 bb 计的资金。
 * 连续近似给出的是下界：离散买入结构会让实际破产概率更高。
 */
export function riskOfRuin(params: {
  winrateBB100: number;
  sdBB100: number;
  bankrollBB: number;
}): number {
  const { winrateBB100, sdBB100, bankrollBB } = params;
  if (winrateBB100 <= 0) return 1;
  if (sdBB100 <= 0) return 0;
  if (bankrollBB <= 0) return 1;
  const muPerHand = winrateBB100 / 100;
  const variancePerHand = perHandStdDev(sdBB100) ** 2;
  return Math.exp((-2 * muPerHand * bankrollBB) / variancePerHand);
}
