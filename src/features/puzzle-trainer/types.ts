/**
 * 扑克谜题（Puzzle）模式类型定义
 *
 * 三种模式：
 *  - rush:  限时冲刺（3/5 分钟，3 条命，连对奖励时间）
 *  - daily: 每日谜题（基于日期种子，当天题目固定，8 题）
 *  - theme: 主题训练（针对单一主题完成 15-30 题）
 */
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

/** 主题分类（P1 阶段实现 5 主题，P2-3 扩展至 10） */
export type PuzzleTheme =
  | 'preflop-rfi' // 翻前 RFI
  | 'big-blind-defense' // 大盲防守
  | 'three-bet' // 3Bet
  | 'c-bet' // C-Bet
  | 'flush-draw' // 同花听牌
  | 'river-value' // 河牌价值下注（P2-3 新增）
  | 'bluff' // 诈唬时机（P2-3 新增）
  | 'short-stack' // 短筹码策略（P2-3 新增）
  | 'icm' // ICM 基础（P2-3 新增）
  | 'multiway'; // 多人底池（P2-3 新增）

/** 主题分类（用于 PuzzleHome 分组展示） */
export type PuzzleThemeCategory =
  | 'preflop' // 翻前
  | 'postflop' // 翻后
  | 'river' // 河牌
  | 'tournament'; // 锦标赛

/** 题目难度 */
export type PuzzleDifficulty = 1 | 2 | 3; // 1 简单 / 2 中等 / 3 难

/** 单个选项 */
export interface PuzzleOption {
  id: string;
  /** 显示文本，如 'Raise' / 'Call' / 'Fold' */
  text: string;
  isCorrect: boolean;
  /** EV 损失（BB），用于五级反馈 */
  evLoss?: number;
  /** 该选项解析 */
  explanation: string;
}

/** 一道谜题 */
export interface PuzzleQuestion {
  id: string;
  theme: PuzzleTheme;
  /** 场景描述 */
  scenario: string;
  /** 玩家手牌（如 'AsKh'） */
  hand?: string;
  /** 位置（如 'BTN'） */
  position?: string;
  /** 公共牌（如 'Ks 7h 2c'） */
  board?: string;
  /** 底池大小（BB） */
  potSize?: number;
  /** 面临的下注（BB） */
  betSize?: number;
  /** 有效筹码（BB） */
  stackSize?: number;
  options: PuzzleOption[];
  /** 完整解析 */
  correctExplanation: string;
  difficulty: PuzzleDifficulty;
}

/** 模式类型 */
export type PuzzleMode = 'rush' | 'daily' | 'theme';

/** 会话状态 */
export type PuzzleSessionStatus = 'playing' | 'completed' | 'failed';

/** 单次答题记录 */
export interface PuzzleAnswerRecord {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  /** 用时（毫秒） */
  timeTaken: number;
  /** 五级评级（best/correct/inaccuracy/wrong/blunder，见 calculateGrade） */
  grade: DecisionGrade;
  /** EV 损失 */
  evLoss: number;
  /** P4 修复（4.2-P1-2）：相关课程 ID，用于反馈跳转 */
  relatedLessonId?: string;
}

/** 引擎运行时状态 */
export interface PuzzleEngineState {
  questions: PuzzleQuestion[];
  currentIndex: number;
  correctCount: number;
  wrongCount: number;
  /** Puzzle Rush 用，初始 3 */
  lives: number;
  /** 连对数（用于奖励时间） */
  streak: number;
  startTime: number;
  endTime: number | null;
  /** Puzzle Rush 用，毫秒 */
  timeRemaining: number;
  status: PuzzleSessionStatus;
  answers: PuzzleAnswerRecord[];
  /** 累计因连对奖励的时间（毫秒） */
  bonusAwarded: number;
}

/** 引擎选项 */
export interface UsePuzzleEngineOptions {
  mode: PuzzleMode;
  /** theme 模式用 */
  theme?: PuzzleTheme;
  /** rush 模式时长（毫秒），3min=180000 / 5min=300000 */
  duration?: number;
  /** daily/theme 用，题目数量 */
  questionCount?: number;
  /** 是否在 Rush 模式启用 3 条命；默认 true */
  enableLives?: boolean;
}

/** 结果摘要（用于 PuzzleResult 页与 store 持久化） */
export interface PuzzleResult {
  /** 会话 ID */
  sessionId: string;
  /** 模式 */
  mode: PuzzleMode;
  /** 主题（theme 模式有值） */
  theme?: PuzzleTheme;
  /** 总题数 */
  totalQuestions: number;
  /** 答对数 */
  correctCount: number;
  /** 答错数 */
  wrongCount: number;
  /** 正确率 0-1 */
  accuracy: number;
  /** 用时（毫秒） */
  duration: number;
  /** 平均每题用时（毫秒） */
  averageTime: number;
  /** Puzzle Rush 最终分数（答对题数 × 100 + 剩余时间 × 10 + 剩余命 × 200） */
  score: number;
  /** 时间戳 */
  timestamp: number;
  /** 答题明细 */
  answers: PuzzleAnswerRecord[];
  /** 所有题目（用于结果页回看） */
  questions: PuzzleQuestion[];
  /** 完成状态（completed/failed） */
  status: PuzzleSessionStatus;
}

/** Best Record：按模式 + 主题分别记录 */
export interface PuzzleBestRecord {
  /** 模式 */
  mode: PuzzleMode;
  /** 主题（theme 模式有值） */
  theme?: PuzzleTheme;
  /** 最高分 */
  bestScore: number;
  /** 最高正确率 */
  bestAccuracy: number;
  /** 最快用时（毫秒） */
  bestTime: number;
  /** 达成时间戳 */
  achievedAt: number;
}

/** 每日完成状态：{ [dateKey: 'YYYY-MM-DD']: true } */
export type DailyCompletionMap = Record<string, boolean>;
