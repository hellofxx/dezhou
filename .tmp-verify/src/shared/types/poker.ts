// 花色枚举
export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades',
}

// 牌面值枚举
export enum Rank {
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10,
  Jack = 11,
  Queen = 12,
  King = 13,
  Ace = 14,
}

// 一张扑克牌
export interface Card {
  suit: Suit;
  rank: Rank;
}

// 公共牌（翻牌3张 + 转牌1张 + 河牌1张）
export interface Board {
  flop: [Card, Card, Card];
  turn: Card | null;
  river: Card | null;
}

// 手牌（2张）
export type HoleCards = [Card, Card];

// 手牌类型分类
export type HandCategory = 'pair' | 'suited' | 'offsuit';

// 规范手牌表示（169种之一）如 "AKs", "QQ", "JTo"
export type HandNotation = string;

// 牌型等级
export enum HandRank {
  HighCard = 1,
  OnePair = 2,
  TwoPair = 3,
  ThreeOfAKind = 4,
  Straight = 5,
  Flush = 6,
  FullHouse = 7,
  FourOfAKind = 8,
  StraightFlush = 9,
  RoyalFlush = 10,
}

// 牌型判定结果
export interface HandResult {
  rank: HandRank;
  name: string;
  cards: Card[]; // 构成牌型的5张牌
  score: number; // 数值评分用于比较
}

// 范围动作（在范围表中的分类）
export type RangeAction = 'raise' | 'call' | 'fold';

// 范围条目（一种手牌对应的动作）
export interface RangeEntry {
  hand: HandNotation;
  action: RangeAction;
  frequency?: number; // 0-1, GTO混合策略时使用
}

// 游戏变体
export type GameVariant = 'standard' | 'short-deck' | 'heads-up';

// 游戏变体配置
export interface GameVariantConfig {
  variant: GameVariant;
  deckSize: number;              // 52 / 36 / 52
  minPlayers: number;            // 2 / 2 / 2
  maxPlayers: number;            // 9 / 6 / 2
  defaultPlayers: number;        // 6 / 6 / 2
  removedRanks: Rank[];          // 短牌移除的牌面值
}

// 游戏格式（变体 + 人数 + 类型）
export interface GameFormat {
  variant: GameVariant;
  playerCount: number;           // 2/3/4/6/9
  gameType: 'cash' | 'mtt' | 'sng';
}

// 预留 PLO 扩展
export type GameMode = 'hold-em' | 'omaha';
