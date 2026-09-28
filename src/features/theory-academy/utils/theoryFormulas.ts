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

/** 诈唬面对多名未行动者时全部弃牌的概率：∏ f_i（各人弃牌率相同则 f^n） */
export function multiwayAllFold(foldRate: number, defenders: number): number {
  if (foldRate < 0 || foldRate > 1) return Number.NaN;
  if (defenders <= 0) return 1;
  return foldRate ** defenders;
}

/**
 * 多人防守的责任分摊：n 名防守者共同使诈唬无利可图时，每人所需的最低防守频率 d = 1 − α^(1/n)。
 * 不是把单挑 MDF 除以人数——防守要求是乘积结构，除半会系统性少防守。
 */
export function perDefenderRequiredDefense(alpha: number, defenders: number): number {
  if (alpha <= 0 || alpha >= 1 || defenders <= 0) return Number.NaN;
  return 1 - alpha ** (1 / defenders);
}

/** 诈唬进多人池的期望值：全弃概率 × 现有底池 − 被拦概率 × 下注额 */
export function multiwayBluffEv(params: {
  potBeforeBet: number;
  betSize: number;
  foldRate: number;
  defenders: number;
}): number {
  const { potBeforeBet, betSize, foldRate, defenders } = params;
  const allFold = multiwayAllFold(foldRate, defenders);
  return allFold * potBeforeBet - (1 - allFold) * betSize;
}

/**
 * Outs → 命中权益（T1『Outs 与 2/4 法则』的精确口径，非 ×2/×4 估算）：
 * 一张牌 = outs/47；两张牌 = 1 − ((47−outs)/47)·((46−outs)/46)。
 * cardsToCome 只接受 1 或 2，其余返回 NaN（2/4 法则本身不适用于第三张牌）。
 */
export function outsToEquity(outs: number, cardsToCome: 1 | 2): number {
  if (outs <= 0) return 0;
  if (outs > 47) return Number.NaN;
  if (cardsToCome === 1) return outs / 47;
  if (cardsToCome === 2) return 1 - ((47 - outs) / 47) * ((46 - outs) / 46);
  return Number.NaN;
}

/**
 * 口袋对子档位的组合数（T4『组合数学与 Blockers』）：
 * 一个未在牌面出现的对子档位 = C(4,2) = 6 种；牌面已见该点数一张时 = C(3,2) = 3 种。
 * boardCardsOnThoseRanks 要求不超过 tiers，且每张属不同档位（同档两张则该档归零，不在本口径内）。
 */
export function pairTierCombos(tiers: number, boardCardsOnThoseRanks: number): number {
  if (tiers < 0 || boardCardsOnThoseRanks < 0 || boardCardsOnThoseRanks > tiers) return Number.NaN;
  return (tiers - boardCardsOnThoseRanks) * 6 + boardCardsOnThoseRanks * 3;
}

/** 激进度 AF = (下注次数 + 加注次数) ÷ 跟注次数（T7『统计指标』原式）；跟注数为 0 时无定义 */
export function aggressionFactor(bets: number, raises: number, calls: number): number {
  if (calls <= 0) return Number.NaN;
  return (bets + raises) / calls;
}

/** VPIP = 主动投钱入池手数 ÷ 总手数 × 100（T7『统计指标』原式） */
export function vpipPercent(voluntaryHands: number, totalHands: number): number {
  if (totalHands <= 0) return Number.NaN;
  return (voluntaryHands / totalHands) * 100;
}
