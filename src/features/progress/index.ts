export { useProgressStore } from './store';
export { initProgressStore } from './store.bootstrap';
export { useProgress } from './hooks/useProgress';
export type { TrainingRecord, StatsSummary, DailyStats, ModuleStats, UserSettings } from './types';
export { openDB, saveToStore, loadFromStore, clearStore } from './utils/indexedDB';

// 间隔重复复习
export type { ReviewItem, ReviewItemMetadata } from '@/shared/utils/spacedRepetition';
export {
  processReview,
  getTodayReviewItems,
  createReviewItem,
  updateReviewQueue,
  getReviewStats,
  getDaysSinceLastReview,
  getTodayString,
  toLocalDateString,
} from '@/shared/utils/spacedRepetition';

// 每日训练推荐
export type { DailyRecommendation } from './utils/dailyTrainingPlan';
export {
  generateCrossModuleDailyPlan,
  getReasonColor,
  getTypeIcon,
  getPriorityColor,
} from './utils/dailyTrainingPlan';

// P1-3: 成就/徽章系统
export { ACHIEVEMENTS, ACHIEVEMENTS_BY_CATEGORY, TIER_ORDER } from './data/achievements';
export type { Achievement, AchievementCategory, AchievementTier, AchievementCondition } from './data/achievements';

// P1-3.5: 复习模式 Dialog 组件（仅导出类型与工具函数，组件由进度页面直接引用）
export type { DailyMixResult } from './utils/dailyTrainingMix';
export { composeDailyMix, getReviewRatio } from './utils/dailyTrainingMix';
