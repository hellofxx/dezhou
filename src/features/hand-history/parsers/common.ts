import { Card, Suit, Rank, GameVariant } from '@/shared/types/poker';

const CHAR_TO_SUIT: Record<string, Suit> = {
  h: Suit.Hearts,
  d: Suit.Diamonds,
  c: Suit.Clubs,
  s: Suit.Spades,
};

const CHAR_TO_RANK: Record<string, Rank> = {
  '2': Rank.Two,
  '3': Rank.Three,
  '4': Rank.Four,
  '5': Rank.Five,
  '6': Rank.Six,
  '7': Rank.Seven,
  '8': Rank.Eight,
  '9': Rank.Nine,
  T: Rank.Ten,
  J: Rank.Jack,
  Q: Rank.Queen,
  K: Rank.King,
  A: Rank.Ace,
};

/** Parse a single card string like "Ah", "Kd", "Tc" */
export function parseCardString(str: string): Card {
  const trimmed = str.trim();
  if (trimmed.length < 2) throw new Error(`Invalid card: "${str}"`);
  const rankChar = trimmed[0]!.toUpperCase();
  const suitChar = trimmed[1]!.toLowerCase();
  const rank = CHAR_TO_RANK[rankChar];
  const suit = CHAR_TO_SUIT[suitChar];
  if (!rank) throw new Error(`Invalid rank: "${rankChar}"`);
  if (!suit) throw new Error(`Invalid suit: "${suitChar}"`);
  return { suit, rank };
}

/** Parse multiple cards from "Ah Kd Qs" */
export function parseBoardCards(str: string): Card[] {
  return str.trim().split(/\s+/).filter(Boolean).map(parseCardString);
}

/** Detect hand history format */
export function detectFormat(text: string): 'pokerstars' | 'ggpoker' | 'partypoker' | 'unknown' {
  if (/PokerStars\s+Hand\s+#/i.test(text)) return 'pokerstars';
  if (/Hand\s+#HD-/i.test(text) || /GGPoker\s+Hand\s+#/i.test(text) || /Hand\s+#.*-\s*GGPoker/i.test(text)) return 'ggpoker';
  if (/Hand History for Game/i.test(text) || /partypoker/i.test(text)) return 'partypoker';
  // Fallback heuristics
  if (/\*\*\* HOLE CARDS \*\*\*/.test(text)) return 'pokerstars';
  if (/\*\*\s*Dealing (flop|turn|river)\s*\*\*/i.test(text)) return 'partypoker';
  return 'unknown';
}

/** Parse an amount string like "$1.50" or "1,500" to number */
export function parseAmount(str: string): number {
  const cleaned = str.replace(/[$,€£]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * 检测游戏变体
 * - 文本中包含 "Short Deck" / "6+" / "ShortDeck" 关键词 → 短牌
 * - 牌面中未出现 2-5 的牌 → 可能是短牌（启发式判断）
 */
export function detectVariant(text: string, cards?: Card[]): GameVariant {
  // 关键词检测
  if (/short\s*deck|6\+|six\s*plus/i.test(text)) {
    return 'short-deck';
  }

  // 启发式：如果提供了牌面，检查是否包含 2-5
  if (cards && cards.length > 0) {
    const hasLowRank = cards.some(
      (c) => c.rank === Rank.Two || c.rank === Rank.Three || c.rank === Rank.Four || c.rank === Rank.Five
    );
    if (!hasLowRank && cards.length >= 5) {
      // 所有牌面都是 6+  可能是短牌
      return 'short-deck';
    }
  }

  return 'standard';
}
