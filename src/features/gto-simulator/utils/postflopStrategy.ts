import type { Card, Board } from '@/shared/types/poker';
import type { HandStrategy } from '../types';
import type { BoardTexture } from './boardGenerator';
import postflopData from '../data/postflop-ranges.json';

// ─── Board 构建辅助 ─────────────────────────────

export function buildBoard(flopCards: Card[], turnCard?: Card, riverCard?: Card): Board {
  return {
    flop: [flopCards[0]!, flopCards[1]!, flopCards[2]!],
    turn: turnCard ?? null,
    river: riverCard ?? null,
  };
}

export function boardToFlat(board: Board): Card[] {
  const cards: Card[] = [...board.flop];
  if (board.turn) cards.push(board.turn);
  if (board.river) cards.push(board.river);
  return cards;
}

// ─── 牌力分类 ───────────────────────────────────

export type HandStrengthCategory = 'strong_hand' | 'medium_hand' | 'draw_hand' | 'weak_hand' | 'air';

/**
 * 翻后牌力分类（P1C-23：新增 weak_hand 分支，接入 postflop-ranges.json 的 weak_hand 数据）
 * - strong_hand：set / 两对 / 超对 / 顶对 / 成顺
 * - medium_hand：中对（非顶对非底对）
 * - weak_hand：底对 / 低于顶张的口袋对（原实现将其误归 medium 或 air）
 * - draw_hand：同花听牌 / 顺子听牌
 * - air：无对无听牌
 */
export function classifyHandStrength(heroHand: [Card, Card], board: Board): HandStrengthCategory {
  const flat = boardToFlat(board);
  const boardRanks = flat.map((c) => c.rank);
  const heroRanks = heroHand.map((c) => c.rank);

  const pairedRanks = heroRanks.filter((r) => boardRanks.includes(r));
  const hasPair = pairedRanks.length > 0;
  const topBoardRank = Math.max(...boardRanks);
  const minBoardRank = Math.min(...boardRanks);
  const hasTopPair = heroRanks.includes(topBoardRank) && hasPair;
  const isPocketPair = heroRanks[0] === heroRanks[1];
  const hasOverpair = isPocketPair && heroRanks[0]! > topBoardRank;
  const hasSet = isPocketPair && boardRanks.includes(heroRanks[0]!);
  const hasTwoPair = pairedRanks.length >= 2;
  const hasUnderpair = isPocketPair && !hasSet && heroRanks[0]! <= topBoardRank;
  const hasBottomPair = hasPair && !hasTopPair && pairedRanks.every((r) => r === minBoardRank);

  if (hasSet || hasTwoPair || hasOverpair || hasTopPair) return 'strong_hand';

  const allCards = [...heroHand, ...flat];
  const suitCounts = new Map<string, number>();
  for (const c of allCards) suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  const hasFlushDraw = [...suitCounts.values()].some((v) => v === 4);

  const uniqueRanks = [...new Set(allCards.map((c) => c.rank))].sort((a, b) => a - b);

  // 检测已成顺子（5张连续）
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    if (uniqueRanks[i + 4]! - uniqueRanks[i]! === 4) return 'strong_hand';
  }

  // 检测顺子听牌（4张牌在5张跨度内）
  let hasStraightDraw = false;
  for (let i = 0; i <= uniqueRanks.length - 4; i++) {
    const window4 = uniqueRanks.slice(i, i + 4);
    if (window4.length === 4 && window4[3]! - window4[0]! <= 4) {
      hasStraightDraw = true;
      break;
    }
  }
  if (hasFlushDraw || hasStraightDraw) return 'draw_hand';

  // P1C-23：weak_hand — 底对 / 低于顶张的口袋对（无听牌）
  if (hasBottomPair || hasUnderpair) return 'weak_hand';
  if (hasPair) return 'medium_hand';
  return 'air';
}

// ─── 翻后 GTO 策略估算（postflop-ranges.json texture_strategy）──

/**
 * 翻后策略估算（P1C-04：单步/多步统一入口，texture_strategy × 牌力分类）。
 * turn/river 无独立频率表时复用 flop texture 表并按街道微调 raiseAmount。
 */
export function estimatePostflopStrategy(
  heroHand: [Card, Card],
  board: Board,
  texture: BoardTexture,
  street: 'flop' | 'turn' | 'river',
  isMultiway: boolean = false
): HandStrategy {
  const textureData = (postflopData.texture_strategy as Record<string, Record<string, HandStrategy>>)[texture];
  const strength = classifyHandStrength(heroHand, board);
  const base = textureData?.[strength];

  if (base) {
    let strategy: HandStrategy = base;
    // Multiway 调整：降低 bluff/raise 频率
    if (isMultiway && (strength === 'air' || strength === 'weak_hand')) {
      const adj = postflopData.multiway_adjustments.three_way_pot;
      strategy = {
        fold: Math.min(1, base.fold + adj.bluff_reduction * 0.5),
        call: base.call,
        raise: Math.max(0, base.raise * (1 - adj.bluff_reduction)),
        raiseAmount: base.raiseAmount,
      };
    }
    // turn/river：加注尺寸随底池增长放大（频率沿用 texture 表）
    if (street === 'turn') return { ...strategy, raiseAmount: (strategy.raiseAmount ?? 3) * 1.6 };
    if (street === 'river') return { ...strategy, raiseAmount: (strategy.raiseAmount ?? 3) * 2.2 };
    return strategy;
  }

  // JSON 缺 key 兜底（理论不可达：texture/strength 均为闭集）
  return { fold: 0.4, call: 0.4, raise: 0.2, raiseAmount: 3 };
}

/**
 * P1C-12/23：按 texture 取 c-bet 尺寸系数（cbet_frequencies 接入点），
 * 用于推导翻后"面对下注"的真实跟注额（callAmount = pot × sizingMultiplier）。
 */
export function getCbetSizingMultiplier(texture: BoardTexture | undefined): number {
  if (!texture) return 0.5;
  const entry = (postflopData.cbet_frequencies as Record<string, { sizingMultiplier: number }>)[
    `${texture}_single_raised`
  ];
  return entry?.sizingMultiplier ?? 0.5;
}
