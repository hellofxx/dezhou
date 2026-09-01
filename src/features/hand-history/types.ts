import type { Card, HoleCards, GameVariant } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { PlayerAction } from '@/shared/types/action';
import type { Stakes } from '@/shared/types/common';

// ─── PlayerAction.amount 统一语义（HH-020）─────────────────
// `PlayerAction.amount`（定义于 shared/types/action.ts）在 hand-history 模块内约定为：
//   amount = 该动作结束后，该玩家在本街（preflop/flop/turn/river）的**累计总投注额（to 金额）**。
// - `Call`（含 post 盲注/ante）：parser 存增量，由 `parsers/common.ts#normalizeToAmounts` 累加为 to。
// - `Raise` / `AllIn`：parser 存的就是 to 总额（"raises $X to $Y" 取 $Y、partypoker "raises [$Y]" 取 $Y），
//   直接作为 to。
// 因此回放扣减必须用 `computeReplayState.processActions` 的 `max(0, to - 本街该玩家已投入)`，
// 禁止对 Raise/AllIn 直接扣减 `amount`（会把「先 call 再 raise to」重复扣减）。
// UI 文本展示（formatAction / AnnotationPanel）对 Call 显示增量（amount - 本街先前投入），
// 对 Raise/AllIn 显示 to 总额，详见 utils/handNotation.ts 与 components/AnnotationPanel.tsx。

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
