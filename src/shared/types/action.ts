// 玩家动作类型
export enum ActionType {
  Fold = 'fold',
  Check = 'check',
  Call = 'call',
  Raise = 'raise',
  AllIn = 'all-in',
}

// 一个完整的动作
export interface PlayerAction {
  type: ActionType;
  amount?: number;      // 加注/跟注的金额
  playerIndex: number;  // 玩家座位索引
  timestamp?: number;   // 时间戳（用于回放）
}

// 下注尺寸类型
export type BetSizing = 'min' | 'half-pot' | 'pot' | 'custom';

// 决策（用户在训练中的选择）
export interface Decision {
  action: ActionType;
  amount?: number;
}

// 决策反馈（对比结果）
export interface DecisionFeedback {
  isCorrect: boolean;
  optimalAction: Decision;
  evDifference: number; // EV差异（BB/100）
  explanation: string;
}
