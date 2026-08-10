import { Suit, Rank, GameVariant, GameVariantConfig } from '@/shared/types/poker';

export const SUITS = [Suit.Hearts, Suit.Diamonds, Suit.Clubs, Suit.Spades] as const;

export const RANKS = [
  Rank.Two, Rank.Three, Rank.Four, Rank.Five, Rank.Six,
  Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
] as const;

export const RANK_DISPLAY: Record<Rank, string> = {
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

/**
 * 扑克牌牌面（实物）专用显示。与 RANK_DISPLAY 不同：
 * 10 在牌面上渲染为 "10"，而 "T" 仅保留给手牌 notation / 理论文字表述
 * （如 deck.ts 的 RANK_SHORT 与 getCardDisplayName）。
 */
export const RANK_CARD_FACE_DISPLAY: Record<Rank, string> = {
  ...RANK_DISPLAY,
  [Rank.Ten]: '10',
};

export const SUIT_SYMBOLS: Record<Suit, string> = {
  [Suit.Hearts]: '♥',
  [Suit.Diamonds]: '♦',
  [Suit.Clubs]: '♣',
  [Suit.Spades]: '♠',
};

/**
 * Traditional card-face suit colors: hearts/diamonds red, clubs/spades ink.
 * Used by CardSVG (renders on ivory card face).
 */
export const SUIT_COLORS: Record<Suit, string> = {
  [Suit.Hearts]: '#e84057',    // 鲜红
  [Suit.Diamonds]: '#e84057',  // 鲜红
  [Suit.Clubs]: '#1a1a1a',     // 牌面上黑色
  [Suit.Spades]: '#1a1a1a',    // 牌面上黑色
} as const;

/**
 * 深色背景上的花色（用于 UI 组件而非牌面）
 * clubs/spades 用象牙白以保证在深色背景上可读
 */
export const SUIT_COLORS_LIGHT: Record<Suit, string> = {
  [Suit.Hearts]: '#d04545',
  [Suit.Diamonds]: '#d04545',
  [Suit.Clubs]: '#d4cfc0',     // 象牙白
  [Suit.Spades]: '#d4cfc0',    // 象牙白
} as const;

/** 规范手牌总数 */
export const TOTAL_HANDS = 169;

/** 总手牌组合数 */
export const TOTAL_COMBOS = 1326;

// 短牌移除的牌面值
export const SHORT_DECK_REMOVED_RANKS = [Rank.Two, Rank.Three, Rank.Four, Rank.Five] as const;

// 短牌有效牌面值
export const SHORT_DECK_RANKS = [
  Rank.Six, Rank.Seven, Rank.Eight, Rank.Nine, Rank.Ten,
  Rank.Jack, Rank.Queen, Rank.King, Rank.Ace,
] as const;

// 短牌总组合数：C(36,2) = 630
export const SHORT_DECK_TOTAL_COMBOS = 630;

// 短牌规范手牌数：9对子 + C(9,2)同花 + C(9,2)非同花 = 9 + 36 + 36 = 81
export const SHORT_DECK_TOTAL_HANDS = 81;

// 游戏变体配置
export const GAME_VARIANT_CONFIGS: Record<GameVariant, GameVariantConfig> = {
  'standard': {
    variant: 'standard',
    displayName: '标准德州',
    deckSize: 52,
    minPlayers: 2,
    maxPlayers: 9,
    defaultPlayers: 6,
    removedRanks: [],
    handRankingChanges: [],
  },
  'short-deck': {
    variant: 'short-deck',
    displayName: '短牌德州 (6+)',
    deckSize: 36,
    minPlayers: 2,
    maxPlayers: 6,
    defaultPlayers: 6,
    removedRanks: [Rank.Two, Rank.Three, Rank.Four, Rank.Five],
    handRankingChanges: ['三条 > 顺子', '同花 > 葫芦', 'A-6-7-8-9 是最小顺子'],
  },
  'heads-up': {
    variant: 'heads-up',
    displayName: '单挑德州',
    deckSize: 52,
    minPlayers: 2,
    maxPlayers: 2,
    defaultPlayers: 2,
    removedRanks: [],
    handRankingChanges: [],
  },
};
