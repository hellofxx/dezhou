import type { Card } from '@/shared/types/poker';
import type { Decision } from '@/shared/types/action';
import { ActionType } from '@/shared/types/action';
import type { HandStrategy, Scenario } from '../types';
import { getOpponentProfile } from '@/features/strategy-academy/data/opponentProfiles';
// P1C-10：isOptimal 边界与五级反馈阈值统一（只读引用 shared 常量，不修改 shared）
import { GRADE_THRESHOLDS } from '@/shared/types/decisionFeedback';

// ─── Equity 估算 ───────────────────────────────

/**
 * 翻前手牌基础胜率表（对阵随机手牌，169 手全覆盖）
 *
 * 数据来源：PokerStove / Equilab 公开胜率表（标准 52 张牌）。
 * 对子 13 + 同花 78 + 非同花 78 = 169 手。
 */
const PREFLOP_EQUITY: Record<string, number> = {
  // 对子（13）
  AA: 0.852, KK: 0.824, QQ: 0.799, JJ: 0.775, TT: 0.751,
  '99': 0.721, '88': 0.691, '77': 0.661, '66': 0.633, '55': 0.605,
  '44': 0.572, '33': 0.539, '22': 0.503,
  // 同花 A 高（12）
  AKs: 0.671, AQs: 0.663, AJs: 0.654, ATs: 0.645, A9s: 0.626,
  A8s: 0.616, A7s: 0.605, A6s: 0.595, A5s: 0.588, A4s: 0.578,
  A3s: 0.569, A2s: 0.559,
  // 同花 K 高（11）
  KQs: 0.633, KJs: 0.625, KTs: 0.617, K9s: 0.598, K8s: 0.588,
  K7s: 0.577, K6s: 0.567, K5s: 0.558, K4s: 0.548, K3s: 0.539, K2s: 0.530,
  // 同花 Q 高（10）
  QJs: 0.602, QTs: 0.594, Q9s: 0.575, Q8s: 0.565, Q7s: 0.555,
  Q6s: 0.546, Q5s: 0.537, Q4s: 0.528, Q3s: 0.519, Q2s: 0.510,
  // 同花 J 高（9）
  JTs: 0.579, J9s: 0.560, J8s: 0.550, J7s: 0.540, J6s: 0.531,
  J5s: 0.522, J4s: 0.513, J3s: 0.504, J2s: 0.495,
  // 同花 T 高（8）
  T9s: 0.543, T8s: 0.533, T7s: 0.523, T6s: 0.514, T5s: 0.505,
  T4s: 0.496, T3s: 0.488, T2s: 0.479,
  // 同花 9 高（7）
  '98s': 0.518, '97s': 0.508, '96s': 0.499, '95s': 0.490, '94s': 0.481,
  '93s': 0.473, '92s': 0.465,
  // 同花 8 高（6）
  '87s': 0.503, '86s': 0.494, '85s': 0.485, '84s': 0.476, '83s': 0.467, '82s': 0.459,
  // 同花 7 高（5）
  '76s': 0.488, '75s': 0.479, '74s': 0.470, '73s': 0.462, '72s': 0.453,
  // 同花 6 高（4）
  '65s': 0.474, '64s': 0.465, '63s': 0.456, '62s': 0.448,
  // 同花 5 高（3）
  '54s': 0.460, '53s': 0.451, '52s': 0.443,
  // 同花 4 高（2）
  '43s': 0.437, '42s': 0.429,
  // 同花 3 高（1）
  '32s': 0.418,
  // 非同花 A 高（12）
  AKo: 0.654, AQo: 0.643, AJo: 0.634, ATo: 0.624, A9o: 0.606,
  A8o: 0.595, A7o: 0.584, A6o: 0.574, A5o: 0.564, A4o: 0.553,
  A3o: 0.543, A2o: 0.532,
  // 非同花 K 高（11）
  KQo: 0.603, KJo: 0.594, KTo: 0.585, K9o: 0.566, K8o: 0.556,
  K7o: 0.545, K6o: 0.535, K5o: 0.524, K4o: 0.513, K3o: 0.502, K2o: 0.491,
  // 非同花 Q 高（10）
  QJo: 0.580, QTo: 0.570, Q9o: 0.552, Q8o: 0.541, Q7o: 0.530,
  Q6o: 0.520, Q5o: 0.509, Q4o: 0.499, Q3o: 0.488, Q2o: 0.477,
  // 非同花 J 高（9）
  JTo: 0.555, J9o: 0.537, J8o: 0.526, J7o: 0.515, J6o: 0.505,
  J5o: 0.494, J4o: 0.483, J3o: 0.472, J2o: 0.461,
  // 非同花 T 高（8）
  T9o: 0.521, T8o: 0.511, T7o: 0.500, T6o: 0.490, T5o: 0.479,
  T4o: 0.468, T3o: 0.458, T2o: 0.447,
  // 非同花 9 高（7）
  '98o': 0.497, '97o': 0.487, '96o': 0.476, '95o': 0.466, '94o': 0.455,
  '93o': 0.445, '92o': 0.434,
  // 非同花 8 高（6）
  '87o': 0.483, '86o': 0.472, '85o': 0.462, '84o': 0.452, '83o': 0.441, '82o': 0.430,
  // 非同花 7 高（5）
  '76o': 0.469, '75o': 0.458, '74o': 0.448, '73o': 0.438, '72o': 0.427,
  // 非同花 6 高（4）
  '65o': 0.455, '64o': 0.445, '63o': 0.435, '62o': 0.424,
  // 非同花 5 高（3）
  '54o': 0.442, '53o': 0.432, '52o': 0.421,
  // 非同花 4 高（2）
  '43o': 0.420, '42o': 0.409,
  // 非同花 3 高（1）
  '32o': 0.389,
};

const RANK_NAMES: Record<number, string> = {
  14: 'A', 13: 'K', 12: 'Q', 11: 'J', 10: 'T',
  9: '9', 8: '8', 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2',
};

function handToNotation(c1: Card, c2: Card): string {
  const r1 = RANK_NAMES[c1.rank] ?? '';
  const r2 = RANK_NAMES[c2.rank] ?? '';
  const suited = c1.suit === c2.suit;
  const [high, low] = c1.rank >= c2.rank ? [r1, r2] : [r2, r1];
  if (high === low) return high + low;
  return high + low + (suited ? 's' : 'o');
}

function estimatePreflopEquity(heroHand: [Card, Card]): number {
  const notation = handToNotation(heroHand[0], heroHand[1]);
  return PREFLOP_EQUITY[notation] ?? 0.50;
}

function estimatePostflopEquity(heroHand: [Card, Card], board: Card[]): number {
  const allCards = [...heroHand, ...board];
  const heroRanks = heroHand.map((c) => c.rank);
  const boardRanks = board.map((c) => c.rank);

  const rankCount = new Map<number, number>();
  for (const c of allCards) rankCount.set(c.rank, (rankCount.get(c.rank) ?? 0) + 1);

  let madeStrength = 0.25;

  const heroBoardPairs = heroRanks.filter((r) => boardRanks.includes(r));
  if (heroBoardPairs.length > 0) {
    const topBoardRank = Math.max(...boardRanks);
    madeStrength = heroBoardPairs.includes(topBoardRank) ? 0.68 : 0.56;
  }

  const boardRankSet = new Set(boardRanks);
  if (heroRanks[0] === heroRanks[1] && boardRankSet.has(heroRanks[0]!)) madeStrength = 0.80;
  if (heroRanks[0] === heroRanks[1] && !boardRankSet.has(heroRanks[0]!)) madeStrength = Math.max(madeStrength, 0.52);
  if (heroBoardPairs.length >= 2) madeStrength = 0.76;

  const suitCounts = new Map<string, number>();
  for (const c of allCards) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const flushDraw = [...suitCounts.values()].some((v) => v === 4);
  const flushMade = [...suitCounts.values()].some((v) => v >= 5);
  if (flushMade) madeStrength = Math.max(madeStrength, 0.84);

  const uniqueRanks = [...new Set(allCards.map((c) => c.rank))].toSorted((a, b) => a - b);

  // 检测已成顺子（5张连续）
  let hasMadeStraight = false;
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4]! - uniqueRanks[i]! === 4) {
      hasMadeStraight = true;
      break;
    }
  }
  if (hasMadeStraight) {
    madeStrength = Math.max(madeStrength, 0.72);
  }

  // 检测顺子听牌（4张牌在5张跨度内）
  let hasStraightDraw = false;
  if (!hasMadeStraight) {
    for (let i = 0; i <= uniqueRanks.length - 4; i++) {
      const window4 = uniqueRanks.slice(i, i + 4);
      if (window4.length === 4 && window4[3]! - window4[0]! <= 4) {
        hasStraightDraw = true;
        break;
      }
    }
  }

  let drawBonus = 0;
  if (flushDraw) drawBonus += 0.18;
  if (hasStraightDraw) drawBonus += 0.18;

  return Math.min(Math.max(madeStrength + drawBonus, 0.05), 0.95);
}

/**
 * 估算 Hero 对对手范围的胜率
 */
export function estimateHeroEquity(
  heroHand: [Card, Card],
  board: Card[] | undefined,
  street: string,
  _opponentRange?: string
): number {
  if (street === 'preflop' || !board || board.length === 0) {
    return estimatePreflopEquity(heroHand);
  }
  return estimatePostflopEquity(heroHand, board);
}

// ─── EV 计算 ───────────────────────────────────

/**
 * 基于 equity 计算单个动作的 EV（BB）
 *
 * 标准公式（与计划表 3.1 一致）：
 *   - Fold EV = 0
 *   - Call EV = equity × (pot + call) - (1 - equity) × call
 *   - Raise EV = equity × (pot + raise) - (1 - equity) × raise
 *
 * 注：纯 EV 公式不包含 fold equity（对手弃牌收益），用于 GTO 决策对比。
 * Fold equity 应在调用方根据对手模型动态计算，不应在基础 EV 函数中硬编码。
 */
export function calculateEVFromAction(
  action: 'fold' | 'call' | 'raise',
  heroEquity: number,
  potSize: number,
  callAmount: number,
  raiseAmount?: number
): number {
  switch (action) {
    case 'fold':
      return 0;
    case 'call':
      return heroEquity * (potSize + callAmount) - (1 - heroEquity) * callAmount;
    case 'raise': {
      const rA = raiseAmount ?? callAmount * 3;
      return heroEquity * (potSize + rA) - (1 - heroEquity) * rA;
    }
  }
}

/**
 * P1C-02：用户 raise/all-in 的 EV（含超注尺寸惩罚）。
 *
 * 基础 EV 公式在 equity > 0.5 时随加注尺寸单调放大（模型假设对手恒跟注且
 * hero equity 不变），导致强牌 all-in 的 EV 恒大于 GTO 尺寸 → evLoss 为负
 * → 永远评为 best（剥削漏洞）。
 *
 * 修正模型：超过 GTO 建议尺寸的部分，对手只会用更强的范围继续，
 * 超注的每 1BB 边际 EV 为 -(1 - equity)（额外筹码只在落后时被跟注）。
 *   - userAmount ≤ gtoAmount：直接按标准公式计算
 *   - userAmount > gtoAmount：EV(gtoAmount) - overshoot × (1 - equity)
 */
function calculateUserRaiseEV(
  heroEquity: number,
  potSize: number,
  callAmount: number,
  userAmount: number | undefined,
  gtoStrategy: HandStrategy
): number {
  const gtoAmount = gtoStrategy.raiseAmount ?? callAmount * 3;
  const rA = userAmount ?? gtoAmount;
  if (rA <= gtoAmount) {
    return calculateEVFromAction('raise', heroEquity, potSize, callAmount, rA);
  }
  const evAtGto = calculateEVFromAction('raise', heroEquity, potSize, callAmount, gtoAmount);
  const overshoot = rA - gtoAmount;
  return evAtGto - overshoot * (1 - heroEquity);
}

/** 统一的 EV 对比核心：userEV / optimalEV / evLoss（clamp ≥ 0，P1C-02） */
function computeDecisionEVs(
  userAction: string,
  userAmount: number | undefined,
  gtoStrategy: HandStrategy,
  heroEquity: number,
  potSize: number,
  callAmount: number
): { userEV: number; optimalEV: number; evLoss: number } {
  const evFold = 0;
  const evCall = calculateEVFromAction('call', heroEquity, potSize, callAmount);
  const evRaise = calculateEVFromAction('raise', heroEquity, potSize, callAmount, gtoStrategy.raiseAmount ?? callAmount * 3);
  const optimalEV = gtoStrategy.fold * evFold + gtoStrategy.call * evCall + gtoStrategy.raise * evRaise;

  let userEV: number;
  switch (userAction) {
    case 'fold': userEV = evFold; break;
    case 'call':
    case 'check': userEV = evCall; break;
    case 'raise':
    case 'allin':
    case 'all-in': userEV = calculateUserRaiseEV(heroEquity, potSize, callAmount, userAmount, gtoStrategy); break;
    default: userEV = evFold;
  }

  // P1C-02：clamp ≥ 0——简化 EV 模型下用户动作 EV 可能略高于混合策略均值，
  // 负损失会被 calculateGrade 判为 best，形成"越激进越优"的剥削通道
  const evLoss = Math.max(0, Math.round((optimalEV - userEV) * 1000) / 1000);
  return { userEV, optimalEV, evLoss };
}

/**
 * 计算 EV 损失（BB）：最优策略 EV − 用户动作 EV。
 * P1C-02：结果 clamp ≥ 0，且超注（>GTO 尺寸）按边际惩罚折价，见 calculateUserRaiseEV。
 */
export function calculateEVLoss(
  userAction: string,
  userAmount: number | undefined,
  gtoStrategy: HandStrategy,
  heroEquity: number,
  potSize: number,
  callAmount: number
): number {
  return computeDecisionEVs(userAction, userAmount, gtoStrategy, heroEquity, potSize, callAmount).evLoss;
}

// ─── 决策对比 ───────────────────────────────────

export interface CompareResult {
  isOptimal: boolean;
  evLoss: number;
  explanation: string;
  userEV: number;
  optimalEV: number;
  heroEquity: number;
}

/**
 * 比较用户决策与 GTO 最优策略（含真实 EV 计算）
 */
export function compareDecision(
  userAction: Decision,
  gtoStrategy: HandStrategy,
  potSize: number,
  heroEquity: number = 0.5,
  callAmount: number = 1
): CompareResult {
  const { userEV, optimalEV, evLoss } = computeDecisionEVs(
    userAction.action, userAction.amount, gtoStrategy, heroEquity, potSize, callAmount
  );

  // P1C-10：与五级反馈 GRADE_THRESHOLDS 对齐——evLoss < correct(0.5) 视为最优/可接受
  // （calculateGrade 中 0.5 归 inaccuracy，此处同口径用严格小于）
  const isOptimal = evLoss < GRADE_THRESHOLDS.correct;
  const optimal = getOptimalAction(gtoStrategy);
  const explanation = generateExplanation(userAction, gtoStrategy, optimal, isOptimal, evLoss);

  return { isOptimal, evLoss, explanation, userEV, optimalEV, heroEquity };
}

/**
 * 获取最优动作建议
 */
export function getOptimalAction(strategy: HandStrategy): Decision {
  const actions: { action: ActionType; freq: number; amount?: number }[] = [
    { action: ActionType.Fold, freq: strategy.fold },
    { action: ActionType.Call, freq: strategy.call },
    { action: ActionType.Raise, freq: strategy.raise, amount: strategy.raiseAmount },
  ];
  const sortedActions = actions.toSorted((a, b) => b.freq - a.freq);
  const best = sortedActions[0]!;
  return {
    action: best.action,
    amount: best.action === ActionType.Raise ? best.amount : undefined,
  };
}

function generateExplanation(
  userAction: Decision,
  gtoStrategy: HandStrategy,
  optimal: Decision,
  isOptimal: boolean,
  evLoss: number
): string {
  if (isOptimal) {
    return `好的决策！GTO 建议这里以较高频率 ${actionLabel(optimal.action)}，EV 损失仅 ${evLoss.toFixed(2)} BB。`;
  }
  const parts: string[] = [];
  if (gtoStrategy.raise > 0) parts.push(`${Math.round(gtoStrategy.raise * 100)}% raise`);
  if (gtoStrategy.call > 0) parts.push(`${Math.round(gtoStrategy.call * 100)}% call`);
  if (gtoStrategy.fold > 0) parts.push(`${Math.round(gtoStrategy.fold * 100)}% fold`);
  return `GTO 建议这里 ${parts.join(', ')}。你选择了 ${actionLabel(userAction.action)}，EV 损失 ${evLoss.toFixed(2)} BB。`;
}

function actionLabel(action: ActionType): string {
  switch (action) {
    case ActionType.Fold: return 'fold';
    case ActionType.Check: return 'check';
    case ActionType.Call: return 'call';
    case ActionType.Raise: return 'raise';
    case ActionType.AllIn: return 'all-in';
  }
}

/** 判断手牌策略是纯策略还是混合策略 */
export function isPureStrategy(strategy: HandStrategy): boolean {
  return strategy.fold >= 0.95 || strategy.call >= 0.95 || strategy.raise >= 0.95;
}

/** 获取策略的主导动作 */
export function getDominantAction(strategy: HandStrategy): ActionType | null {
  if (strategy.raise >= 0.95) return ActionType.Raise;
  if (strategy.call >= 0.95) return ActionType.Call;
  if (strategy.fold >= 0.95) return ActionType.Fold;
  return null;
}

// ─── Exploit 调整 ───────────────────────────────

/**
 * 根据对手类型调整 GTO 策略，生成剥削性策略
 */
export function adjustForOpponent(
  gtoStrategy: HandStrategy,
  opponentId: string,
  _scenario: Scenario
): HandStrategy {
  const opponent = getOpponentProfile(opponentId);
  if (!opponent || opponent.id === 'unknown') return gtoStrategy;

  const clamp = (v: number) => Math.max(0, Math.min(1, v));

  // 面对 Nit：更频繁地偷盲（fold to steal 高）
  if (opponent.id === 'nit') {
    const raise = clamp(gtoStrategy.raise + 0.15);
    const fold = clamp(gtoStrategy.fold - 0.10);
    const call = clamp(1 - raise - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  // 面对 Maniac：更多 call（他的范围太宽）
  if (opponent.id === 'maniac') {
    const call = clamp(gtoStrategy.call + 0.15);
    const fold = clamp(gtoStrategy.fold - 0.10);
    const raise = clamp(1 - call - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  // 面对 Calling Station：增加 value bet（raise+），减少 bluff（fold 略降，call 略降）
  // CS 几乎不弃牌 → 减少 bluff 频率（fold 降低 = 更愿意继续）
  // CS 加注即强牌 → 中等牌可适当 fold（但 CS 加注频率极低，主要靠 value bet 获利）
  // 正确策略：纯价值下注，加大尺度，绝不诈唬 → raise 增加，call 略降，fold 不变或略降
  if (opponent.id === 'calling_station') {
    const fold = clamp(gtoStrategy.fold - 0.05);   // 略降低 fold（CS 不 bluff，可多 call 中等牌）
    const raise = clamp(gtoStrategy.raise + 0.15); // 增加 value bet（CS 会用弱牌跟注）
    const call = clamp(1 - raise - fold);          // 归一化：call 略降
    return { ...gtoStrategy, raise, call, fold };
  }

  // 面对 LAG：稍微增加 call 频率（他 bluff 多）
  if (opponent.id === 'lag') {
    const call = clamp(gtoStrategy.call + 0.08);
    const fold = clamp(gtoStrategy.fold - 0.05);
    const raise = clamp(1 - call - fold);
    return { ...gtoStrategy, raise, call, fold };
  }

  // TAG 接近 GTO，微调即可
  return gtoStrategy;
}
