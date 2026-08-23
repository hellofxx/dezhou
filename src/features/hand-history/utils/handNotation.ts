import type { Card } from '@/shared/types/poker';
import type { PlayerAction } from '@/shared/types/action';
import { ActionType } from '@/shared/types/action';
import { Suit, Rank } from '@/shared/types/poker';
import type { HandHistory, Player } from '../types';

const RANK_CHARS: Record<number, string> = {
  [Rank.Two]: '2', [Rank.Three]: '3', [Rank.Four]: '4', [Rank.Five]: '5',
  [Rank.Six]: '6', [Rank.Seven]: '7', [Rank.Eight]: '8', [Rank.Nine]: '9',
  [Rank.Ten]: 'T', [Rank.Jack]: 'J', [Rank.Queen]: 'Q', [Rank.King]: 'K', [Rank.Ace]: 'A',
};

const SUIT_CHARS: Record<string, string> = {
  [Suit.Hearts]: 'h', [Suit.Diamonds]: 'd', [Suit.Clubs]: 'c', [Suit.Spades]: 's',
};

/** Card to short notation: "Ah", "Ks" */
export function cardToNotation(card: Card): string {
  return `${RANK_CHARS[card.rank] ?? '?'}${SUIT_CHARS[card.suit] ?? '?'}`;
}

/** Cards array to notation string: "AhKs" */
export function cardsToNotation(cards: Card[]): string {
  return cards.map(cardToNotation).join('');
}

/** Format a player action to human-readable text */
export function formatAction(action: PlayerAction, players: Player[]): string {
  const player = players[action.playerIndex];
  const name = player?.name ?? `Seat ${action.playerIndex + 1}`;

  switch (action.type) {
    case ActionType.Fold:
      return `${name}: folds`;
    case ActionType.Check:
      return `${name}: checks`;
    case ActionType.Call:
      return `${name}: calls $${action.amount ?? 0}`;
    case ActionType.Raise:
      return `${name}: raises to $${action.amount ?? 0}`;
    case ActionType.AllIn:
      return `${name}: all-in $${action.amount ?? 0}`;
    default:
      return `${name}: ${action.type}`;
  }
}

/** Format hand summary */
export function formatHandSummary(hand: HandHistory): string {
  const date = new Date(hand.timestamp).toLocaleDateString();
  const winner = hand.winner
    ? hand.players[hand.winner.playerId]?.name ?? 'Unknown'
    : 'N/A';
  return `#${hand.handNumber} - ${hand.stakes.smallBlind}/${hand.stakes.bigBlind} - ${date} - Winner: ${winner} ($${hand.pot})`;
}

/** Format date for display（locale 缺省 zh-CN；调用方传 i18n.language 实现语言跟随） */
export function formatDate(timestamp: number, locale = 'zh-CN'): string {
  return new Date(timestamp).toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
