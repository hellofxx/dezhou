import type { TrainingResult } from '@/shared/types/common';

// 训练记录（持久化存储）
export interface TrainingRecord {
  id: string;
  module: 'range-trainer' | 'pot-odds' | 'gto-simulator' | 'strategy-academy';
  mode: string;              // 'quiz', 'practice', etc.
  result: TrainingResult;
  createdAt: number;         // timestamp
}

// 统计数据汇总
export interface StatsSummary {
  totalSessions: number;
  totalQuestions: number;
  overallAccuracy: number;
  averageTime: number;
  currentStreak: number;     // 当前连续天数
  longestStreak: number;     // 最长连续天数
  lastTrainingDate: number | null;
}

// 每日统计
export interface DailyStats {
  date: string;              // YYYY-MM-DD
  sessions: number;
  questions: number;
  accuracy: number;
  totalTime: number;
}

// 模块统计
export interface ModuleStats {
  module: string;
  sessions: number;
  accuracy: number;
  averageTime: number;
  lastPlayed: number | null;
}

// 用户设置
export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  soundEnabled: boolean;
  defaultQuizTime: number;   // 默认每题时间
  defaultQuestionCount: number;
  language: 'zh' | 'en';
}

// 新手引导状态
export interface OnboardingState {
  completed: boolean;
  currentStep: number;      // 0=欢迎, 1=定位测试, 2=首次训练, 3=庆祝, 4=目标设定, 5=完成
  placementTestScore?: number;
  initialAbility: {
    rangeKnowledge: number;
    oddsCalculation: number;
    gtoUnderstanding: number;
    positionalPlay: number;
  };
  dailyGoalMinutes: 5 | 10 | 20;
  startedAt: number;
  completedAt?: number;
}

// Streak 里程碑达成记录
export interface StreakMilestones {
  day3: boolean;
  day7: boolean;
  day30: boolean;
  day100: boolean;
  day365: boolean;
}

// Streak 完整状态（P0-2）
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastTrainingDate: string | null;       // YYYY-MM-DD（本地时区）
  streakFreezes: number;                 // 冻结卡数量
  streakFreezeUsedToday: boolean;        // 今日是否已自动/手动使用过冻结卡
  milestones: StreakMilestones;
  lastMilestoneCelebrated: number | null; // 最近庆祝的里程碑天数（3/7/30/100/365）
  streakStartDate: string | null;        // 当前 streak 起始日（YYYY-MM-DD）
  streakBrokenAt: number | null;         // Streak 断裂时间戳（Earn Back 用）
}

// Streak 里程碑奖励映射（天数 → 冻结卡奖励数量）
export const MILESTONE_FREEZE_REWARDS: Record<number, number> = {
  3: 1,
  7: 2,
  30: 3,
  100: 5,
  365: 10,
};

// 所有里程碑天数（升序）
export const MILESTONE_DAYS: readonly number[] = [3, 7, 30, 100, 365] as const;

// P2-5: 情绪管理模块
export interface EmotionState {
  todayMood: 'good' | 'neutral' | 'bad' | null;     // 今日情绪标记
  moodDate: string | null;                            // YYYY-MM-DD，标记日期
  consecutiveWrongCount: number;                      // 当前连续答错数（实时）
  dailyQuestionLimit: number;                         // 每日题量上限（0=无限）
  dailyQuestionsAnswered: number;                     // 今日已答题数
  dailyQuestionsDate: string | null;                  // 今日答题计数的日期
  accuracyHistory: { date: string; accuracy: number }[]; // 最近 7 天正确率历史
  isDownswing: boolean;                               // 是否处于下风期（连续 3 天正确率下降）
  // 内部计数器（用于实时计算今日 accuracy，不直接展示）
  dailyCorrect: number;                               // 今日答对题数
  dailyTotal: number;                                 // 今日已答题总数
}

export const DEFAULT_EMOTION_STATE: EmotionState = {
  todayMood: null,
  moodDate: null,
  consecutiveWrongCount: 0,
  dailyQuestionLimit: 0,  // 0 = 无限
  dailyQuestionsAnswered: 0,
  dailyQuestionsDate: null,
  accuracyHistory: [],
  isDownswing: false,
  dailyCorrect: 0,
  dailyTotal: 0,
};
