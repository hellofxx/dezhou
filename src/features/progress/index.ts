/**
 * progress 模块公共入口（跨模块契约）。
 *
 * 业务读取/命令走 api.ts；展示组件走 ui.ts。完整 store 与底层 IndexedDB
 * 适配器属于模块内部实现，不在此导出。
 */
export { useProgressState, progressCommands } from './api';
export type { ProgressCommands, ProgressReadModel, OnboardingAbility } from './api.types';

export type {
  TrainingRecord,
  StatsSummary,
  DailyStats,
  ModuleStats,
  UserSettings,
  OnboardingState,
} from './types';

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
export type {
  Achievement,
  AchievementCategory,
  AchievementTier,
  AchievementCondition,
} from './data/achievements';

// P1-3.5: 复习模式工具（组件由进度页面直接引用）
export type { DailyMixResult } from './utils/dailyTrainingMix';
export { composeDailyMix, getReviewRatio } from './utils/dailyTrainingMix';
