import { Card, Rank, HandRank, HandResult, GameVariant } from '@/shared/types/poker';

/**
 * 标准德州牌型评估（从 7 张中选最优 5 张）
 */
export function evaluateStandardHand(cards: Card[]): HandResult {
  if (cards.length < 5) {
    return { rank: HandRank.HighCard, name: '高牌', cards: cards.slice(0, 5), score: 0 };
  }

  const combos = getCombinations(cards, 5);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const result = evaluate5Cards(combo, false);
    if (!best || result.score > best.score) {
      best = result;
    }
  }

  return best!;
}

/**
 * 短牌牌型评估（36 张牌组）
 * 短牌牌型等级变化：
 * 高牌 < 一对 < 两对 < 顺子 < 三条 < 同花 < 葫芦 < 四条 < 同花顺 < 皇家同花顺
 * A-6-7-8-9 是合法的最小顺子
 */
export function evaluateShortDeckHand(cards: Card[]): HandResult {
  if (cards.length < 5) {
    return { rank: HandRank.HighCard, name: '高牌', cards: cards.slice(0, 5), score: 0 };
  }

  const combos = getCombinations(cards, 5);
  let best: HandResult | null = null;

  for (const combo of combos) {
    const result = evaluate5Cards(combo, true);
    if (!best || result.score > best.score) {
      best = result;
    }
  }

  return best!;
}

/**
 * 统一评估接口（根据变体自动选择规则）
 */
export function evaluateHand(cards: Card[], variant: GameVariant = 'standard'): HandResult {
  if (variant === 'short-deck') {
    return evaluateShortDeckHand(cards);
  }
  return evaluateStandardHand(cards);
}

// ============ 内部辅助函数 ============

/** 从数组中选取 k 个元素的所有组合 */
function getCombinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const result: T[][] = [];

  function helper(start: number, combo: T[]) {
    if (combo.length === k) {
      result.push([...combo]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]!);
      helper(i + 1, combo);
      combo.pop();
    }
  }

  helper(0, []);
  return result;
}

/** 评估 5 张牌的牌型 */
function evaluate5Cards(cards: Card[], isShortDeck: boolean): HandResult {
  const ranks = cards.map(c => c.rank).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);
  const straightInfo = getStraightInfo(ranks, isShortDeck);
  const isStraight = straightInfo !== null;

  // 统计牌面值出现次数
  const rankCounts = new Map<Rank, number>();
  for (const r of ranks) {
    rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
  }
  const counts = [...rankCounts.values()].sort((a, b) => b - a);

  // 确定牌型
  let rank: HandRank;
  let name: string;

  if (isFlush && isStraight) {
    if (straightInfo!.high === Rank.Ace && ranks.includes(Rank.King)) {
      rank = HandRank.RoyalFlush;
      name = '皇家同花顺';
    } else {
      rank = HandRank.StraightFlush;
      name = '同花顺';
    }
  } else if (counts[0] === 4) {
    rank = HandRank.FourOfAKind;
    name = '四条';
  } else if (counts[0] === 3 && counts[1] === 2) {
    rank = HandRank.FullHouse;
    name = '葫芦';
  } else if (isFlush) {
    rank = HandRank.Flush;
    name = '同花';
  } else if (isStraight) {
    rank = HandRank.Straight;
    name = '顺子';
  } else if (counts[0] === 3) {
    rank = HandRank.ThreeOfAKind;
    name = '三条';
  } else if (counts[0] === 2 && counts[1] === 2) {
    rank = HandRank.TwoPair;
    name = '两对';
  } else if (counts[0] === 2) {
    rank = HandRank.OnePair;
    name = '一对';
  } else {
    rank = HandRank.HighCard;
    name = '高牌';
  }

  // 短牌牌型等级调整：顺子 > 三条，同花 > 葫芦
  // 保持 rank 返回正确的枚举值，通过 score 映射实现等级比较

  // 计算数值评分用于比较
  const score = calculateScore(rank, ranks, rankCounts, straightInfo, isShortDeck);

  return { rank, name, cards, score };
}

/** 短牌牌型等级分数映射（顺子 > 三条） */
const SHORT_DECK_RANK_SCORE: Record<number, number> = {
  [HandRank.HighCard]: 1,
  [HandRank.OnePair]: 2,
  [HandRank.TwoPair]: 3,
  [HandRank.Straight]: 5,    // 短牌中顺子等级提升，高于三条
  [HandRank.ThreeOfAKind]: 4, // 短牌中三条等级降低，低于顺子
  [HandRank.Flush]: 6,
  [HandRank.FullHouse]: 7,
  [HandRank.FourOfAKind]: 8,
  [HandRank.StraightFlush]: 9,
  [HandRank.RoyalFlush]: 10,
};

/** 检测顺子，返回顺子最高牌 */
function getStraightInfo(ranks: number[], isShortDeck: boolean): { high: Rank } | null {
  const unique = [...new Set(ranks)].sort((a, b) => b - a);

  // 标准顺子检测
  if (unique.length >= 5) {
    for (let i = 0; i <= unique.length - 5; i++) {
      if (unique[i]! - unique[i + 4]! === 4) {
        return { high: unique[i] as Rank };
      }
    }
  }

  // A-2-3-4-5 (wheel) - 仅标准牌
  if (!isShortDeck && unique.includes(Rank.Ace) && unique.includes(Rank.Two) &&
      unique.includes(Rank.Three) && unique.includes(Rank.Four) && unique.includes(Rank.Five)) {
    return { high: Rank.Five };
  }

  // A-6-7-8-9 (短牌最小顺子，A 作为 5 使用)
  if (isShortDeck && unique.includes(Rank.Ace) && unique.includes(Rank.Six) &&
      unique.includes(Rank.Seven) && unique.includes(Rank.Eight) && unique.includes(Rank.Nine)) {
    return { high: Rank.Nine };
  }

  return null;
}

/** 计算数值评分 */
function calculateScore(
  rank: HandRank,
  _ranks: number[],
  rankCounts: Map<Rank, number>,
  straightInfo: { high: Rank } | null,
  isShortDeck: boolean = false
): number {
  // 基础分：牌型等级 * 10^10
  const rankValue = isShortDeck ? (SHORT_DECK_RANK_SCORE[rank] ?? rank) : rank;
  let score = rankValue * 10_000_000_000;

  // 按牌型添加kicker分数
  const sortedByCountThenRank = [...rankCounts.entries()]
    .sort((a, b) => b[1] - a[1] || b[0] - a[0]);

  let multiplier = 100_000_000;
  for (const [r] of sortedByCountThenRank) {
    score += r * multiplier;
    multiplier /= 15;
  }

  // 顺子/同花顺用最高牌
  if (straightInfo) {
    score += straightInfo.high * 1_000_000;
  }

  return score;
}
