import type { HandNotation, RangeAction } from '@/shared/types/poker';
import type { Position } from '@/shared/types/position';
import type { SessionStatus } from '@/shared/types/common';

/** 用户答案：动作 / 'timeout'（超时显式标记，恒判错，P1A-02）/ null（未作答） */
export type QuizAnswer = RangeAction | 'timeout';

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
  userAction: QuizAnswer;
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
  answers: (QuizAnswer | null)[];
  isCorrect: boolean[];
  timePerQuestion: number[];  // 每题用时（ms）

  // 会话状态
  status: SessionStatus;

  // 间隔重复权重（手牌 → 权重，默认 1，答错增加）
  handWeights: Record<string, number>;

  // 当前题目开始时间戳（暂停恢复后为"当前运行段"起点）
  questionStartTime: number;

  /** P1A-14：当前题在暂停前已累计的耗时（ms），恢复后续算 */
  pausedElapsed: number;

  /** "最后一题简单"补救机制：是否已追加过补救题（避免无限循环） */
  rescueUsed: boolean;
}

// 测验模式 store 切片接口（实现见 storeQuizSlice.ts）
export interface QuizSlice {
  quizState: QuizSessionState;

  /**
   * P1A-01：生成 0 题（该组合无预置范围）时返回 false 且不进入 running，
   * 由调用方停留在配置页；成功进入 running 时返回 true。
   */
  startQuiz: (position: Position, actionType: string, timeLimit: number, totalQuestions?: number) => boolean;
  /** P1A-02：'timeout' 为超时显式入口，恒判错，与"选择 fold"语义区分 */
  answerQuestion: (action: QuizAnswer) => void;
  nextQuestion: () => void;
  pauseQuiz: () => void;
  resumeQuiz: () => void;
  endQuiz: () => void;
  resetQuiz: () => void;
}
