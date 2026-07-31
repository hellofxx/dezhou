export { useProgressStore } from './store';
export { useProgress } from './hooks/useProgress';
export type { TrainingRecord, StatsSummary, DailyStats, ModuleStats, UserSettings } from './types';
export { default as WeaknessAnalysis } from './components/WeaknessAnalysis';
export { default as AchievementBadges } from './components/AchievementBadges';
export { default as DifficultyIndicator } from './components/DifficultyIndicator';
export { default as ModuleStatsPage } from './components/ModuleStatsPage';
export { openDB, saveToStore, loadFromStore, clearStore } from './utils/indexedDB';

// 间隔重复复习
export type { ReviewItem, ReviewItemMetadata } from './utils/spacedRepetition';
export {
  processReview,
  getTodayReviewItems,
  createReviewItem,
  updateReviewQueue,
  getReviewStats,
  getDaysSinceLastReview,
  getTodayString,
  toLocalDateString,
} from './utils/spacedRepetition';

// 每日训练推荐
export type { DailyRecommendation } from './utils/dailyTrainingPlan';
export {
  generateDailyPlan,
  getReasonColor,
  getTypeIcon,
  getPriorityColor,
} from './utils/dailyTrainingPlan';

// 新组件
export { default as DailyTrainingPlan } from './components/DailyTrainingPlan';
export { default as SpacedRepetitionPanel } from './components/SpacedRepetitionPanel';
// P1-3.5: 复习模式 Dialog 组件
export { default as ReviewSession } from './components/ReviewSession';
// P1-3.3: 每日训练题目组成（SRS 复习 + 新题混合）
export { composeDailyMix, getReviewRatio } from './utils/dailyTrainingMix';
export type { DailyMixResult } from './utils/dailyTrainingMix';

// P1-3: 成就/徽章系统
export { default as AchievementWall } from './components/AchievementWall';
export { ACHIEVEMENTS, ACHIEVEMENTS_BY_CATEGORY, TIER_ORDER } from './data/achievements';
export type { Achievement, AchievementCategory, AchievementTier, AchievementCondition } from './data/achievements';

// 进步回放
export { default as ProgressReplay } from './components/ProgressReplay';
