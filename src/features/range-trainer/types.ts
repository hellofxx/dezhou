import type { HandNotation, RangeAction } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { SessionStatus } from '@/shared/types/common';

// 范围表中一个格子的状态
export interface RangeCell {
  hand: HandNotation;
  action: RangeAction;
}

// 一个完整的范围配置（某位置某动作的标准范围）
export interface RangePreset {
  id: string;
  name: string;
  position: Position;
  actionType: 'open' | '3bet' | '4bet' | 'call-vs-raise';
  hands: HandNotation[];
}

// 学习模式状态
export interface LearnState {
  selectedPreset: RangePreset | null;
  selectedPosition: Position;
  selectedActionType: string;
  highlightedHand: HandNotation | null;
}

// 测验题目
export interface QuizQuestion {
  hand: HandNotation;
  position: Position;
  context?: string;
  correctAction: RangeAction;
}

// 单题答题反馈
export interface QuestionFeedback {
  isCorrect: boolean;
  correctAction: RangeAction;
  userAction: RangeAction;
}

// 测验会话状态
export interface QuizSessionState {
  // 配置
  position: Position | null;
  actionType: string;
  timeLimit: number;        // 每题限时（秒），0=无限
  totalQuestions: number;

  // 题目与答案
  questions: QuizQuestion[];
  currentIndex: number;
  answers: (RangeAction | null)[];
  isCorrect: boolean[];
  timePerQuestion: number[];  // 每题用时（ms）

  // 会话状态
  status: SessionStatus;

  // 间隔重复权重（手牌 → 权重，默认 1，答错增加）
  handWeights: Record<string, number>;

  // 当前题目开始时间戳
  questionStartTime: number;

  /** "最后一题简单"补救机制：是否已追加过补救题（避免无限循环） */
  rescueUsed: boolean;
}
