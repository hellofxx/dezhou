import type { TFunction } from 'i18next';
import type { RangeAction, Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';

/** 将动作映射为展示标签（§13.4 对比视图用） */
export function getActionLabel(t: TFunction, action: string): string {
  if (action === 'fold') return t('rangeTrainer.srs.optionFold');
  if (action === 'call') return t('rangeTrainer.srs.optionCall');
  if (action === 'raise') return t('rangeTrainer.srs.optionRaise');
  return action;
}

/** 解析手牌 notation 为展示用名称 */
export function getHandDisplayName(hand: string): { rank1: string; rank2: string; suited: string } {
  const rankMap: Record<string, string> = {
    'A': 'A', 'K': 'K', 'Q': 'Q', 'J': 'J', 'T': '10',
    '9': '9', '8': '8', '7': '7', '6': '6', '5': '5',
    '4': '4', '3': '3', '2': '2',
  };

  if (hand.length === 2) {
    // 对子
    return { rank1: rankMap[hand[0]!] ?? hand[0]!, rank2: rankMap[hand[1]!] ?? hand[1]!, suited: 'pair' };
  }

  const rank1 = rankMap[hand[0]!] ?? hand[0]!;
  const rank2 = rankMap[hand[1]!] ?? hand[1]!;
  const suited = hand.endsWith('s') ? 'suited' : 'offsuit';

  return { rank1, rank2, suited };
}

const CHAR_TO_RANK: Record<string, Rank> = {
  '2': Rank.Two, '3': Rank.Three, '4': Rank.Four, '5': Rank.Five,
  '6': Rank.Six, '7': Rank.Seven, '8': Rank.Eight, '9': Rank.Nine,
  'T': Rank.Ten, 'J': Rank.Jack, 'Q': Rank.Queen, 'K': Rank.King, 'A': Rank.Ace,
};

/** 将手牌 notation 转换为代表性 Card 对象（用于 PokerCard 渲染） */
export function notationToCards(hand: string): Card[] {
  if (hand.length === 2) {
    // 对子：两张不同花色的相同点数
    const rank = CHAR_TO_RANK[hand[0]!] ?? Rank.Ace;
    return [
      { suit: Suit.Spades, rank },
      { suit: Suit.Hearts, rank },
    ];
  }
  const rank1 = CHAR_TO_RANK[hand[0]!] ?? Rank.Ace;
  const rank2 = CHAR_TO_RANK[hand[1]!] ?? Rank.King;
  if (hand.endsWith('s')) {
    // 同花：两张相同花色
    return [
      { suit: Suit.Spades, rank: rank1 },
      { suit: Suit.Spades, rank: rank2 },
    ];
  }
  // 非同花：不同花色
  return [
    { suit: Suit.Spades, rank: rank1 },
    { suit: Suit.Hearts, rank: rank2 },
  ];
}

export function getSuitedLabel(t: TFunction, suited: string): string {
  if (suited === 'pair') return t('rangeTrainer.quizCard.pair');
  if (suited === 'suited') return t('rangeTrainer.quizCard.suited');
  return t('rangeTrainer.quizCard.offsuit');
}

export function getSuitedColor(suited: string): string {
  // Pairs glow warmest (gold); suited hands cool (sage); offsuit dimmest.
  if (suited === 'pair') return 'text-[var(--brass-bright)]';
  if (suited === 'suited') return 'text-[var(--sage-text)]';
  return 'text-[var(--ivory-muted)]';
}

/** 三个平权答题选项的色阶（DESIGN.md §5.5） */
export const ACTION_BUTTONS: { action: RangeAction; label: string; shortcut: string; colorClass: string }[] = [
  { action: 'fold', label: 'Fold', shortcut: '1', colorClass: 'bg-[var(--poker-terra)]/15 text-[var(--poker-terra-bright)] border-[var(--poker-terra)]/50 hover:bg-[var(--poker-terra)]/25' },
  { action: 'call', label: 'Call', shortcut: '2', colorClass: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)] border-[var(--walnut-light)] hover:bg-[var(--walnut-light)] hover:text-[var(--ivory)]' },
  { action: 'raise', label: 'Raise', shortcut: '3', colorClass: 'hover-bright bg-gradient-to-b from-[var(--brass-bright)] to-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass-dark)]' },
];
