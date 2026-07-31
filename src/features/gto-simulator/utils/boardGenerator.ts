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

/**
 * P1C-26：构建剔除已用牌后的剩余牌堆。
 * 抽牌一律从剩余牌堆中取，天然无重复，替代旧的"随机生成 + 重试"模式
 * （旧模式重试上限耗尽后会返回重复牌）。
 */
export function buildRemainingDeck(exclude: Card[], variant: GameVariant = 'standard'): Card[] {
  const ranks = getRanks(variant);
  const deck: Card[] = [];
  for (const suit of ALL_SUITS) {
    for (const rank of ranks) {
      if (!exclude.some((c) => c.suit === suit && c.rank === rank)) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

/** 从剩余牌堆随机抽取 count 张（不放回） */
export function drawCards(count: number, exclude: Card[] = [], variant: GameVariant = 'standard'): Card[] {
  const deck = buildRemainingDeck(exclude, variant);
  const drawn: Card[] = [];
  for (let i = 0; i < count && deck.length > 0; i++) {
    const idx = Math.floor(Math.random() * deck.length);
    drawn.push(deck.splice(idx, 1)[0]!);
  }
  return drawn;
}

/** 随机生成 Hero 手牌（2 张，不重复） */
export function randomHeroHand(variant: GameVariant = 'standard'): [Card, Card] {
  const [c1, c2] = drawCards(2, [], variant);
  return [c1!, c2!];
}

/**
 * 生成翻牌（3张）及 texture
 * P1C-01：excludeCards 传入 Hero 手牌（及其他已发牌），确保公共牌与 Hero 手牌全局唯一
 */
export function generateFlop(
  variant: GameVariant,
  excludeCards: Card[] = []
): { cards: Card[]; texture: BoardTexture } {
  const cards = drawCards(3, excludeCards, variant);
  return { cards, texture: classifyBoardTexture(cards) };
}

/** 生成转牌（P1C-01：excludeCards 传入 Hero 手牌等场外已用牌） */
export function generateTurnCard(existingBoard: Card[], variant: GameVariant, excludeCards: Card[] = []): Card {
  return drawCards(1, [...existingBoard, ...excludeCards], variant)[0]!;
}

/** 生成河牌（P1C-01：excludeCards 传入 Hero 手牌等场外已用牌） */
export function generateRiverCard(existingBoard: Card[], variant: GameVariant, excludeCards: Card[] = []): Card {
  return generateTurnCard(existingBoard, variant, excludeCards);
}
