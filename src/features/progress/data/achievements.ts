/**
 * 成就/徽章系统数据定义
 * 四类成就：学习 / 连续 / 技能 / 里程碑
 */

export type AchievementCategory = 'learning' | 'streak' | 'skill' | 'milestone';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Achievement {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  title: string;         // i18n key
  description: string;   // i18n key
  icon: string;          // emoji
  condition: AchievementCondition;
  reward?: {
    freezeCards?: number;
    xp?: number;
  };
}

export type AchievementCondition =
  | { type: 'completeLessons'; count: number; level?: number }
  | { type: 'streak'; days: number }
  | { type: 'accuracy'; threshold: number; sampleSize: number }
  | { type: 'elo'; minScore: number }
  | { type: 'certification'; level: number }
  | { type: 'allCertifications' }
  | { type: 'completeTrack'; trackId: string }
  | { type: 'firstTraining' }
  | { type: 'firstPuzzle' }
  | { type: 'firstDailyPuzzle' }
  | { type: 'quickDrillStreak'; days: number }
  | { type: 'allAchievements' };

/** 全部成就定义 */
export const ACHIEVEMENTS: Achievement[] = [
  // ===== 学习类 =====
  {
    id: 'first-training',
    category: 'learning',
    tier: 'bronze',
    title: 'achievements.items.firstTraining.title',
    description: 'achievements.items.firstTraining.description',
    icon: '🌱',
    condition: { type: 'firstTraining' },
    reward: { xp: 5 },
  },
  {
    id: 'complete-level-1',
    category: 'learning',
    tier: 'bronze',
    title: 'achievements.items.completeLevel1.title',
    description: 'achievements.items.completeLevel1.description',
    icon: '📚',
    condition: { type: 'completeLessons', count: 0, level: 1 },
  },
  {
    id: 'complete-level-2',
    category: 'learning',
    tier: 'silver',
    title: 'achievements.items.completeLevel2.title',
    description: 'achievements.items.completeLevel2.description',
    icon: '📚',
    condition: { type: 'completeLessons', count: 0, level: 2 },
  },
  {
    id: 'complete-level-3',
    category: 'learning',
    tier: 'silver',
    title: 'achievements.items.completeLevel3.title',
    description: 'achievements.items.completeLevel3.description',
    icon: '📚',
    condition: { type: 'completeLessons', count: 0, level: 3 },
  },
  {
    id: 'certification-any',
    category: 'learning',
    tier: 'gold',
    title: 'achievements.items.certificationAny.title',
    description: 'achievements.items.certificationAny.description',
    icon: '🎓',
    condition: { type: 'certification', level: 0 },
  },
  {
    id: 'certification-all',
    category: 'learning',
    tier: 'diamond',
    title: 'achievements.items.certificationAll.title',
    description: 'achievements.items.certificationAll.description',
    icon: '🏆',
    condition: { type: 'allCertifications' },
    reward: { freezeCards: 5 },
  },

  // ===== 连续类 =====
  {
    id: 'streak-3',
    category: 'streak',
    tier: 'bronze',
    title: 'achievements.items.streak3.title',
    description: 'achievements.items.streak3.description',
    icon: '🔥',
    condition: { type: 'streak', days: 3 },
    reward: { freezeCards: 1 },
  },
  {
    id: 'streak-7',
    category: 'streak',
    tier: 'silver',
    title: 'achievements.items.streak7.title',
    description: 'achievements.items.streak7.description',
    icon: '🔥',
    condition: { type: 'streak', days: 7 },
    reward: { freezeCards: 2 },
  },
  {
    id: 'streak-30',
    category: 'streak',
    tier: 'gold',
    title: 'achievements.items.streak30.title',
    description: 'achievements.items.streak30.description',
    icon: '🔥',
    condition: { type: 'streak', days: 30 },
    reward: { freezeCards: 3 },
  },
  {
    id: 'streak-100',
    category: 'streak',
    tier: 'diamond',
    title: 'achievements.items.streak100.title',
    description: 'achievements.items.streak100.description',
    icon: '🔥',
    condition: { type: 'streak', days: 100 },
    reward: { freezeCards: 5 },
  },
  {
    id: 'quick-drill-7',
    category: 'streak',
    tier: 'silver',
    title: 'achievements.items.quickDrill7.title',
    description: 'achievements.items.quickDrill7.description',
    icon: '⚡',
    condition: { type: 'quickDrillStreak', days: 7 },
    reward: { freezeCards: 1 },
  },

  // ===== 技能类 =====
  {
    id: 'perfect-10',
    category: 'skill',
    tier: 'silver',
    title: 'achievements.items.perfect10.title',
    description: 'achievements.items.perfect10.description',
    icon: '🎯',
    condition: { type: 'accuracy', threshold: 1.0, sampleSize: 10 },
  },
  {
    id: 'perfect-20',
    category: 'skill',
    tier: 'gold',
    title: 'achievements.items.perfect20.title',
    description: 'achievements.items.perfect20.description',
    icon: '🎯',
    condition: { type: 'accuracy', threshold: 1.0, sampleSize: 20 },
  },
  {
    id: 'elo-beginner',
    category: 'skill',
    tier: 'bronze',
    title: 'achievements.items.eloBeginner.title',
    description: 'achievements.items.eloBeginner.description',
    icon: '📈',
    condition: { type: 'elo', minScore: 500 },
  },
  {
    id: 'elo-intermediate',
    category: 'skill',
    tier: 'silver',
    title: 'achievements.items.eloIntermediate.title',
    description: 'achievements.items.eloIntermediate.description',
    icon: '📈',
    condition: { type: 'elo', minScore: 800 },
  },
  {
    id: 'elo-advanced',
    category: 'skill',
    tier: 'gold',
    title: 'achievements.items.eloAdvanced.title',
    description: 'achievements.items.eloAdvanced.description',
    icon: '📈',
    condition: { type: 'elo', minScore: 1200 },
  },
  {
    id: 'elo-expert',
    category: 'skill',
    tier: 'diamond',
    title: 'achievements.items.eloExpert.title',
    description: 'achievements.items.eloExpert.description',
    icon: '📈',
    condition: { type: 'elo', minScore: 2000 },
  },

  // ===== 里程碑类 =====
  {
    id: 'first-puzzle',
    category: 'milestone',
    tier: 'bronze',
    title: 'achievements.items.firstPuzzle.title',
    description: 'achievements.items.firstPuzzle.description',
    icon: '🧩',
    condition: { type: 'firstPuzzle' },
  },
  {
    id: 'first-daily-puzzle',
    category: 'milestone',
    tier: 'silver',
    title: 'achievements.items.firstDailyPuzzle.title',
    description: 'achievements.items.firstDailyPuzzle.description',
    icon: '🧩',
    condition: { type: 'firstDailyPuzzle' },
  },
  {
    id: 'complete-track-any',
    category: 'milestone',
    tier: 'gold',
    title: 'achievements.items.completeTrackAny.title',
    description: 'achievements.items.completeTrackAny.description',
    icon: '🗺️',
    condition: { type: 'completeTrack', trackId: 'any' },
  },
  {
    id: 'complete-track-local',
    category: 'milestone',
    tier: 'gold',
    title: 'achievements.items.completeTrackLocal.title',
    description: 'achievements.items.completeTrackLocal.description',
    icon: '🗺️',
    condition: { type: 'completeTrack', trackId: 'track-beginner' },
  },
  {
    id: 'all-achievements',
    category: 'milestone',
    tier: 'diamond',
    title: 'achievements.items.allAchievements.title',
    description: 'achievements.items.allAchievements.description',
    icon: '💎',
    condition: { type: 'allAchievements' },
  },
];

/** 按类别分组成就 */
export const ACHIEVEMENTS_BY_CATEGORY: Record<AchievementCategory, Achievement[]> = {
  learning: ACHIEVEMENTS.filter((a) => a.category === 'learning'),
  streak: ACHIEVEMENTS.filter((a) => a.category === 'streak'),
  skill: ACHIEVEMENTS.filter((a) => a.category === 'skill'),
  milestone: ACHIEVEMENTS.filter((a) => a.category === 'milestone'),
};

/** Tier 排序权重 */
export const TIER_ORDER: Record<AchievementTier, number> = {
  bronze: 0,
  silver: 1,
  gold: 2,
  diamond: 3,
};
