// 训练会话状态
export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed';

// 训练模式
export type TrainingMode = 'learn' | 'quiz' | 'practice';

// 难度级别
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

// 训练结果
export interface TrainingResult {
  sessionId: string;
  module: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number; // 平均每题用时（毫秒）
  timestamp: number;
  details: QuestionResult[];
  /** 最后一题是否答对（"最后一题简单"策略 + 补救机制后的最终题） */
  lastQuestionCorrect?: boolean;
}

// 单题结果
export interface QuestionResult {
  question: string;    // 题目描述标识
  isCorrect: boolean;
  timeTaken: number;   // 用时（毫秒）
  userAnswer: string;
  correctAnswer: string;
}

// 游戏类型
export type GameType = 'cash' | 'tournament' | 'sit-and-go';

// 筹码结构
export interface Stakes {
  smallBlind: number;
  bigBlind: number;
  ante?: number;
}
