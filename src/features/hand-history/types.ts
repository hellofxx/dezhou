import type { Card, HoleCards, GameVariant } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { PlayerAction } from '@/shared/types/action';
import type { Stakes } from '@/shared/types/common';

// 玩家信息
export interface Player {
  id: number;
  name: string;
  position: Position;
  seatNumber: number;
  stack: number;
  holeCards?: HoleCards;
}

// 单条街的动作
export interface StreetActions {
  cards: Card[];
  actions: PlayerAction[];
}

// 完整牌局历史
export interface HandHistory {
  id: string;
  site: 'pokerstars' | 'ggpoker' | 'partypoker' | 'manual';
  handNumber: string;
  timestamp: number;
  gameType: string;
  variant?: GameVariant;   // 游戏变体（标准/短牌）
  stakes: Stakes;
  players: Player[];
  board: Card[];
  streets: {
    preflop: PlayerAction[];
    flop: StreetActions;
    turn: StreetActions;
    river: StreetActions;
  };
  pot: number;
  winner?: {
    playerId: number;
    amount: number;
    hand?: string;
  };
  /** hero（"Dealt to" 玩家）在 players 中的索引；旧数据/无底牌局为 undefined（消费方回退启发式） */
  heroPlayerId?: number;
  annotations: Record<string, string>;
}

// 导入结果
export interface ImportMessage {
  /** i18n key（handHistory.importer.*），渲染端经 t() 解析 */
  key: string;
  /** t() 插值参数 */
  params?: Record<string, string | number>;
}

export interface ImportResult {
  success: boolean;
  hands: HandHistory[];
  errors: ImportMessage[];
  warnings?: ImportMessage[];
  format?: string;
}

// 回放状态
export interface ReplayState {
  currentStreet: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown';
  currentActionIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  visibleCards: Card[];
  playerStacks: number[];
  currentPot: number;
}

// 牌局列表筛选
export interface HandFilter {
  search: string;
  site?: string;
  dateFrom?: number;
  dateTo?: number;
  minPot?: number;
  sortBy: 'date' | 'pot' | 'site';
}
