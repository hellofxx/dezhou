import { Suit, Rank } from '@/shared/types/poker';
import type { Card, GameVariant } from '@/shared/types/poker';
import { SHORT_DECK_RANKS } from '@/shared/constants/poker';

export type BoardTexture = 'dry' | 'wet' | 'paired' | 'monotone' | 'connected';

/**
 * 对公共牌进行 texture 分类
 * dry: 无连牌无同花（如 K-7-2 rainbow）
 * wet: 有连牌和/或同花听牌（如 J-T-9 两花）
 * paired: 有对子（如 K-K-7）
 * monotone: 全部同花
 * connected: 三张连续（如 8-9-T）
 */
export function classifyBoardTexture(board: Card[]): BoardTexture {
  if (board.length < 3) return 'dry';

  const suits = board.map((c) => c.suit);
  const ranks = board.map((c) => c.rank).sort((a, b) => a - b);

  // monotone: 全部同花
  if (suits.every((s) => s === suits[0])) return 'monotone';

  // paired: 有对子
  if (new Set(ranks).size < ranks.length) return 'paired';

  // connected: 三张连续
  const [r0, r1, r2] = ranks;
  if (r1! - r0! === 1 && r2! - r1! === 1) return 'connected';

  // 含 A-2-3 特殊顺子
  if (ranks.includes(14) && ranks.includes(2) && ranks.includes(3)) return 'connected';

  // wet: 两张同花 + 两张相连（或间隔≤2）
  const suitCounts = new Map<Suit, number>();
  for (const s of suits) suitCounts.set(s, (suitCounts.get(s) ?? 0) + 1);
  const hasTwoSuited = [...suitCounts.values()].some((c) => c >= 2);
  const hasConnector = r1! - r0! <= 2 || r2! - r1! <= 2;
  if (hasTwoSuited && hasConnector) return 'wet';

  return 'dry';
}

function getRanks(variant: GameVariant): Rank[] {
  return variant === 'short-deck'
    ? [...SHORT_DECK_RANKS]
    : [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as Rank[];
}

const ALL_SUITS = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function cardExcluded(card: Card, exclude: Card[]): boolean {
  return exclude.some((c) => c.suit === card.suit && c.rank === card.rank);
}

/** 生成翻牌（3张）及 texture */
export function generateFlop(variant: GameVariant): { cards: Card[]; texture: BoardTexture } {
  const ranks = getRanks(variant);
  const cards: Card[] = [];

  while (cards.length < 3) {
    const card: Card = { suit: randomFrom(ALL_SUITS), rank: randomFrom(ranks) };
    if (!cardExcluded(card, cards)) cards.push(card);
  }

  return { cards, texture: classifyBoardTexture(cards) };
}

/** 生成转牌 */
export function generateTurnCard(existingBoard: Card[], variant: GameVariant): Card {
  const ranks = getRanks(variant);
  let card: Card;
  let attempts = 0;
  do {
    card = { suit: randomFrom(ALL_SUITS), rank: randomFrom(ranks) };
    attempts++;
  } while (cardExcluded(card, existingBoard) && attempts < 200);
  return card;
}

/** 生成河牌 */
export function generateRiverCard(existingBoard: Card[], variant: GameVariant): Card {
  return generateTurnCard(existingBoard, variant);
}
