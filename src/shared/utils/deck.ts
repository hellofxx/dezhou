import { Card, Suit, Rank, HandNotation, GameVariant } from '@/shared/types/poker';
import { SUITS, RANKS, RANK_DISPLAY, SUIT_SYMBOLS, SHORT_DECK_RANKS } from '@/shared/constants/poker';

/** 创建标准52张牌 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** 创建短牌牌组（36张：6-A，移除2-5） */
export function createShortDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of SHORT_DECK_RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

/** 根据变体创建对应牌组 */
export function createDeckForVariant(variant: GameVariant): Card[] {
  return variant === 'short-deck' ? createShortDeck() : createDeck();
}

/** Fisher-Yates 洗牌 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = shuffled[i]!;
    shuffled[i] = shuffled[j]!;
    shuffled[j] = tmp;
  }
  return shuffled;
}

/** 发牌，返回 [发出的牌, 剩余牌] */
export function dealCards(deck: Card[], count: number): [Card[], Card[]] {
  const dealt = deck.slice(0, count);
  const remaining = deck.slice(count);
  return [dealt, remaining];
}

const SUIT_SHORT: Record<Suit, string> = {
  [Suit.Hearts]: 'h',
  [Suit.Diamonds]: 'd',
  [Suit.Clubs]: 'c',
  [Suit.Spades]: 's',
};

const SHORT_TO_SUIT: Record<string, Suit> = {
  h: Suit.Hearts,
  d: Suit.Diamonds,
  c: Suit.Clubs,
  s: Suit.Spades,
};

const RANK_SHORT: Record<Rank, string> = {
  [Rank.Two]: '2',
  [Rank.Three]: '3',
  [Rank.Four]: '4',
  [Rank.Five]: '5',
  [Rank.Six]: '6',
  [Rank.Seven]: '7',
  [Rank.Eight]: '8',
  [Rank.Nine]: '9',
  [Rank.Ten]: 'T',
  [Rank.Jack]: 'J',
  [Rank.Queen]: 'Q',
  [Rank.King]: 'K',
  [Rank.Ace]: 'A',
};

const SHORT_TO_RANK: Record<string, Rank> = Object.fromEntries(
  Object.entries(RANK_SHORT).map(([k, v]) => [v, Number(k) as Rank])
) as Record<string, Rank>;

/** 转为字符串如 "Ah", "Ks", "Td" */
export function cardToString(card: Card): string {
  return `${RANK_SHORT[card.rank]}${SUIT_SHORT[card.suit]}`;
}

/** 字符串解析为 Card */
export function stringToCard(str: string): Card {
  if (str.length < 2) throw new Error(`Invalid card string: ${str}`);
  const rankChar = str.charAt(0).toUpperCase();
  const suitChar = str.charAt(1).toLowerCase();
  const rank = SHORT_TO_RANK[rankChar];
  const suit = SHORT_TO_SUIT[suitChar];
  if (!rank) throw new Error(`Invalid rank: ${rankChar}`);
  if (!suit) throw new Error(`Invalid suit: ${suitChar}`);
  return { suit, rank };
}

/** 获取显示名如 "A♥", "K♠" */
export function getCardDisplayName(card: Card): string {
  return `${RANK_DISPLAY[card.rank]}${SUIT_SYMBOLS[card.suit]}`;
}

/** 返回所有169种规范手牌表示 */
export function getAllHandNotations(): HandNotation[] {
  const rankLetters: Record<number, string> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
    7: '7', 8: '8', 9: '9', 10: 'T',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A',
  };

  const notations: HandNotation[] = [];
  const rankValues = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

  // 对子 (13种)
  for (const r of rankValues) {
    notations.push(`${rankLetters[r]!}${rankLetters[r]!}`);
  }

  // 同花 (78种) + 非同花 (78种)
  for (let i = 0; i < rankValues.length; i++) {
    for (let j = i + 1; j < rankValues.length; j++) {
      const high = rankLetters[rankValues[i]!]!;
      const low = rankLetters[rankValues[j]!]!;
      notations.push(`${high}${low}s`); // suited
      notations.push(`${high}${low}o`); // offsuit
    }
  }

  return notations;
}
