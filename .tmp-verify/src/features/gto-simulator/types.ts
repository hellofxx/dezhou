import type { Card, HandNotation, Board, GameVariant } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { ActionType, Decision } from '@/shared/types/action';
import type { GameType, Stakes, Difficulty } from '@/shared/types/common';
import type { BoardTexture } from './utils/boardGenerator';

// 决策树节点（多步决策）
export interface DecisionNode {
  id: string;
  street: 'preflop' | 'flop' | 'turn' | 'river';
  description: string;
  /** 描述文案 i18n key（渲染时经 t() 翻译；存在时优先于 description） */
  descriptionKey?: string;
  /** descriptionKey 的插值参数 */
  descriptionParams?: Record<string, string | number>;
  board?: Board;
  potSize: number;
  heroHand: [Card, Card];
  gtoStrategy: HandStrategy;
  previousActions: PreviousAction[];
}

// 场景定义
export interface Scenario {
  id: string;
  name: string;
  description: string;
  gameType: GameType;
  stakes: Stakes;
  effectiveStack: number;    // 有效筹码（BB）
  position: Position;
  playerCount: number;       // 2-9
  gameVariant?: GameVariant; // 游戏变体
  street: 'preflop' | 'flop' | 'turn' | 'river';
  board?: Board;
  potSize: number;           // 当前底池（BB）
  spr?: number;              // Stack-to-Pot Ratio
  boardTexture?: BoardTexture;
  previousActions: PreviousAction[];
  heroHand: [Card, Card];    // Hero的手牌
  difficulty: Difficulty;
  decisionNodes?: DecisionNode[]; // 多步决策节点（为空时使用单步模式）
}

// 前置动作
export interface PreviousAction {
  position: Position;
  action: ActionType;
  amount?: number;
}

// GTO策略数据（预计算）
export interface GTOSpot {
  scenarioKey: string;       // 唯一场景标识
  handStrategies: Record<HandNotation, HandStrategy>;
}

export interface HandStrategy {
  fold: number;              // 0-1 频率
  call: number;
  raise: number;
  raiseAmount?: number;      // 加注大小（BB）
}

// 训练会话
export interface GTOSession {
  scenarios: Scenario[];
  currentIndex: number;
  decisions: GTODecision[];
  isComplete: boolean;
  startTime: number;
}

export interface GTODecision {
  scenarioId: string;
  userAction: Decision;
  gtoStrategy: HandStrategy;
  evLoss: number;            // EV损失（BB，单决策）
  isOptimal: boolean;        // 是否在容差范围内
  timeTaken: number;         // 毫秒（P1C-19：每题用时，非累计）
}

// 场景配置选项
export interface ScenarioConfig {
  gameType: GameType;
  effectiveStack: number;
  position: Position;
  playerCount: number;
  gameVariant: GameVariant;  // 游戏变体
  difficulty: Difficulty;
  scenarioCount: number;     // 本次训练的场景数
}

// 训练结果扩展
export interface GTOResult {
  sessionId: string;
  scenarios: number;
  optimalDecisions: number;
  averageEVLoss: number;     // 单决策平均 EV 损失（BB）
  evLossBB100: number;       // P1C-11: 会话 EV 损失率（BB/100）
  worstSpots: Array<{ scenario: Scenario; evLoss: number }>;
  accuracy: number;          // 最优决策比例
  totalTime: number;
}
