import type {
  EmotionState,
  OnboardingState,
  QuickDrillBestRecord,
  StatsSummary,
  StreakState,
  TrainingRecord,
  UserSettings,
} from './types';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import type { MentorStyle } from '@/shared/types/mentor';
import type { EloDimension, EloRating, PokerVariant, RankUpEvent } from '@/shared/types/elo';

/**
 * progress 对外只读模型。
 *
 * 只声明其他模块真实消费的字段；不使用 Omit<ProgressStore, ...> 或整 store 透传，
 * 避免内部新增字段默认成为跨模块契约。需要新字段时在此显式登记。
 */
export interface ProgressReadModel {
  readonly settings: UserSettings;
  readonly onboarding: OnboardingState;
  readonly streak: StreakState;
  readonly emotion: EmotionState;
  readonly reviewItems: ReviewItem[];
  readonly mentorStyle: MentorStyle;
  readonly activeVariant: PokerVariant;
  readonly eloByVariant: Record<PokerVariant, EloRating>;
  readonly eloRankUp: RankUpEvent | null;
  readonly quickDrillStreak: number;
  readonly lastQuickDrillDate: string | null;
  readonly quickDrillBest: QuickDrillBestRecord | null;
  readonly records: TrainingRecord[];
  getStatsSummary(): StatsSummary;
}

/** onboarding 四维定位能力（ELO 播种输入） */
export type OnboardingAbility = OnboardingState['initialAbility'];

/** progress 对外业务命令：仅委托既有 action，不复制业务规则。 */
export interface ProgressCommands {
  updateSettings(partial: Partial<UserSettings>): void;
  updateElo(dimension: EloDimension, isCorrect: boolean, difficulty: number): void;
  seedEloFromOnboardingAbility(ability: OnboardingAbility): void;
  recordAnswer(isCorrect: boolean): void;
  addReviewItem(item: ReviewItem): void;
  updateReviewItem(item: ReviewItem): void;
  recordTrainingDay(): void;
  shouldDownshiftDifficulty(): boolean;
  completeOnboardingStep(step: number, data?: Partial<OnboardingState>): void;
  skipOnboarding(): void;
  submitQuickDrillResult(input: {
    score: number;
    accuracy: number;
    timeTaken: number;
  }): { isNewRecord: boolean; previousBest: QuickDrillBestRecord | null };
  recordQuickDrillCompletion(): { newBadge: boolean; quickDrillStreak: number };
  setMentorStyle(style: MentorStyle): void;
  useStreakFreeze(): boolean;
  setDailyQuestionLimit(limit: number): void;
  setTodayMood(mood: 'good' | 'neutral' | 'bad'): void;
  clearEloRankUp(): void;
  switchActiveVariant(variant: PokerVariant): void;
  checkDownswing(): boolean;
  /** 当前活动变体的 ELO 评分（只读快照） */
  getActiveEloRating(): EloRating;
  /** standard 变体 ELO 评分（策略学院每日计划输入） */
  getStandardEloRating(): EloRating;
  getOnboardingInitialAbility(): OnboardingAbility;
  getReviewItemsSnapshot(): ReviewItem[];
  getEmotionSnapshot(): EmotionState;
  getSettingsSnapshot(): UserSettings;
}
