import type { Card, HandNotation, HandCategory } from '@/shared/types/poker';
import { Rank } from '@/shared/types/poker';

const RANK_LETTER: Record<number, string> = {
  2: '2', 3: '3', 4: '4', 5: '5', 6: '6',
  7: '7', 8: '8', 9: '9', 10: 'T',
  11: 'J', 12: 'Q', 13: 'K', 14: 'A',
};

/**
 * 将具体手牌（如 AsKh）归类为规范形式（AKo）
 */
export function classifyHand(card1: Card, card2: Card): HandNotation {
  const high = Math.max(card1.rank, card2.rank) as Rank;
  const low = Math.min(card1.rank, card2.rank) as Rank;

  if (high === low) {
    return `${RANK_LETTER[high]}${RANK_LETTER[low]}`;
  }

  const suited = card1.suit === card2.suit ? 's' : 'o';
  return `${RANK_LETTER[high]}${RANK_LETTER[low]}${suited}`;
}

/**
 * 获取手牌类型：pair/suited/offsuit
 */
export function getHandCategory(hand: HandNotation): HandCategory {
  if (hand.length === 2 && hand[0] === hand[1]) return 'pair';
  if (hand.endsWith('s')) return 'suited';
  return 'offsuit';
}

/**
 * 判断手牌是否在某个范围内
 */
export function isHandInRange(hand: HandNotation, range: HandNotation[]): boolean {
  return range.includes(hand);
}
