import { Card, Suit, Rank, GameVariant } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';

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

// 按人数的座位环位置序列（从按钮位起顺时针：BTN → SB → BB → 最早位 … → CO）。
// HU（2 人）按钮位即小盲（shared/types/position.ts getPositionsForPlayerCount 口径），
// 另一位为 BB；5 人无 UTG（HJ 为最早行动位）；7/8 人为 9 人序列前缀。
const POSITIONS_BY_COUNT: Record<number, Position[]> = {
  2: [Position.BTN, Position.BB],
  3: [Position.BTN, Position.SB, Position.BB],
  4: [Position.BTN, Position.SB, Position.BB, Position.CO],
  5: [Position.BTN, Position.SB, Position.BB, Position.HJ, Position.CO],
  6: [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.HJ, Position.CO],
  7: [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.UTG1, Position.HJ, Position.CO],
  8: [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.UTG1, Position.MP, Position.HJ, Position.CO],
  9: [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.UTG1, Position.MP, Position.MP, Position.HJ, Position.CO],
};

const POSITIONS_FALLBACK_6: Position[] = [Position.BTN, Position.SB, Position.BB, Position.UTG, Position.HJ, Position.CO];
const POSITIONS_FALLBACK_9: Position[] = POSITIONS_BY_COUNT[9]!;

/**
 * 按座位环（从按钮位起）为各座位分配位置。
 * 三平台解析器共用（此前三份拷贝对 2/4/5 人桌均沿用 6 人序列导致错位）。
 */
export function assignPositions(playerCount: number, buttonSeat: number, seats: number[]): Position[] {
  const posList = POSITIONS_BY_COUNT[playerCount] ??
    (playerCount <= 6 ? POSITIONS_FALLBACK_6 : POSITIONS_FALLBACK_9);

  // 从按钮位起的座位环
  const btnIdx = seats.indexOf(buttonSeat);
  const ordered = btnIdx >= 0
    ? [...seats.slice(btnIdx), ...seats.slice(0, btnIdx)]
    : [...seats];

  const posMap = new Map<number, Position>();
  for (let i = 0; i < ordered.length; i++) {
    posMap.set(ordered[i]!, posList[i % posList.length] ?? Position.MP);
  }

  return seats.map(s => posMap.get(s) ?? Position.MP);
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
