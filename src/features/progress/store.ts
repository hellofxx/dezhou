import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrainingRecord, StatsSummary, ModuleStats, UserSettings, OnboardingState, StreakState, StreakMilestones, EmotionState } from './types';
import { DEFAULT_EMOTION_STATE } from './types';
import { aggregateStats, aggregateByModule, getRecentRecords as getRecent } from './utils/statsAggregator';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { ReviewItem } from './utils/spacedRepetition';
import { getTodayString as getTodayStringFromSR } from './utils/spacedRepetition';
import {
  updateStreak,
  checkNewMilestone,
  isEarnBackActive,
  getTodayString as getTodayStringFromStreak,
  getYesterdayString as getYesterdayStringFromStreak,
} from './utils/streakCalc';
import type { GameVariant } from '@/shared/types/poker';
// P1-2: ELO 能力分级
import type { EloRating, EloDimension, RankUpEvent } from '@/shared/types/elo';
import { DEFAULT_ELO } from '@/shared/types/elo';
import {
  applyEloChange,
  checkRankUp,
  getRankForScore,
  abilityToElo,
  computeOverallElo,
  getDynamicKFactor,
} from '@/shared/utils/elo';
import type { AbilityAssessment } from '@/features/strategy-academy/types';
// P2-4: 导师角色人格化
import type { MentorStyle } from '@/shared/types/mentor';
import { DEFAULT_MENTOR } from '@/shared/types/mentor';
// P1-3: 成就/徽章系统
import { ACHIEVEMENTS } from './data/achievements';
import type { AchievementCondition } from './data/achievements';
// 跨模块 store 引用（用于成就检查）
// strategy-academy/store 通过动态 import 访问，避免静态循环依赖（见 getAcademyStore）
import { usePuzzleStore } from '@/features/puzzle-trainer/store';

// ===== 跨模块动态导入辅助（避免静态循环依赖） =====
let _academyModule: { useAcademyStore: typeof import('@/features/strategy-academy/store')['useAcademyStore'] } | null = null;

/** 获取 strategy-academy store 模块（首次调用时动态加载，后续复用缓存） */
async function getAcademyStore() {
  if (!_academyModule) {
    _academyModule = await import('@/features/strategy-academy/store');
  }
  return _academyModule;
}

// theory-academy（2026-07）：同模式的动态导入（避免静态循环依赖）
let _theoryModule: {
  store: typeof import('@/features/theory-academy/store');
  utils: typeof import('@/features/theory-academy/utils/theoryProgress');
} | null = null;

/** 获取 theory-academy store 与进度工具模块（首次调用时动态加载，后续复用缓存） */
async function getTheoryStore() {
  if (!_theoryModule) {
    const [store, utils] = await Promise.all([
      import('@/features/theory-academy/store'),
      import('@/features/theory-academy/utils/theoryProgress'),
    ]);
    _theoryModule = { store, utils };
  }
  return _theoryModule;
}

// onboarding 默认状态（migrate 与初始化共用）
export const DEFAULT_ONBOARDING: OnboardingState = {
  completed: false,
  currentStep: 0,
  initialAbility: {
    rangeKnowledge: 50,
    oddsCalculation: 50,
    gtoUnderstanding: 50,
    positionalPlay: 50,
  },
  dailyGoalMinutes: 10,
  startedAt: Date.now(),
};

// Streak 默认状态：新用户赠送 2 张冻结卡（migrate 与初始化共用）
export const DEFAULT_STREAK_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastTrainingDate: null,
  streakFreezes: 2,
  streakFreezeUsedToday: false,
  milestones: {
    day3: false,
    day7: false,
    day30: false,
    day100: false,
    day365: false,
  },
  lastMilestoneCelebrated: null,
  streakStartDate: null,
  streakBrokenAt: null,
};

/**
 * P1-2.3: 将 strategy-academy 的 AbilityAssessment（0-100）映射为 ELO 初始值
 * 维度对应关系：
 *   preflop    ← rangeKnowledge, positionalPlay（翻前范围与位置）
 *   postflop   ← gtoUnderstanding, positionalPlay（翻后 GTO 决策）
 *   math       ← oddsCalculation（赔率/数学）
 *   handReading← gtoUnderstanding, rangeKnowledge（综合阅读）
 *   mental     ← emotionalControl（情绪）
 */
function mapAcademyAbilityToElo(aa: AbilityAssessment): EloRating {
  const elo: EloRating = {
    ...DEFAULT_ELO,
    preflop: abilityToElo((aa.rangeKnowledge + aa.positionalPlay) / 2),
    postflop: abilityToElo((aa.gtoUnderstanding + aa.positionalPlay) / 2),
    math: abilityToElo(aa.oddsCalculation),
    handReading: abilityToElo((aa.gtoUnderstanding + aa.rangeKnowledge) / 2),
    mental: abilityToElo(aa.emotionalControl),
    lastUpdated: Date.now(),
  };
  elo.overall = computeOverallElo(elo);
  elo.kFactor = getDynamicKFactor(elo.gamesPlayed, elo.overall);
  return elo;
}

/** 检测 abilityAssessment 是否包含非默认数据（用于判断是否需要映射） */
function hasNonDefaultAbility(aa: AbilityAssessment | undefined | null): aa is AbilityAssessment {
  if (!aa) return false;
  return (
    typeof aa.rangeKnowledge === 'number' &&
    typeof aa.oddsCalculation === 'number' &&
    typeof aa.gtoUnderstanding === 'number' &&
    typeof aa.positionalPlay === 'number' &&
    typeof aa.emotionalControl === 'number' &&
    (aa.rangeKnowledge !== 50 ||
      aa.oddsCalculation !== 50 ||
      aa.gtoUnderstanding !== 50 ||
      aa.positionalPlay !== 50 ||
      aa.emotionalControl !== 50)
  );
}

/** 时间戳转本地时区 YYYY-MM-DD（用于 migrate 老数据） */
function timestampToYYYYMMDD(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface ProgressStore {
  // 训练记录
  records: TrainingRecord[];

  // Actions
  addRecord: (record: TrainingRecord) => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;

  // 用户设置
  settings: UserSettings;
  updateSettings: (settings: Partial<UserSettings>) => void;

  // 全局游戏变体
  currentGameVariant: GameVariant;
  setGameVariant: (variant: GameVariant) => void;

  // 计算属性
  getStatsSummary: () => StatsSummary;
  getRecentRecords: (count: number) => TrainingRecord[];
  getModuleStats: () => ModuleStats[];

  // 间隔重复复习
  reviewItems: ReviewItem[];
  dismissedRecommendations: string[];  // 今日已跳过的推荐 id
  lastDismissalDate: string;           // 上次重置日期
  updateReviewItem: (item: ReviewItem) => void;
  addReviewItem: (item: ReviewItem) => void;
  dismissRecommendation: (id: string) => void;
  clearDailyDismissals: () => void;    // 每日重置

  // 新手引导
  onboarding: OnboardingState;
  completeOnboardingStep: (step: number, data?: Partial<OnboardingState>) => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;

  // Streak 完整机制（P0-2）
  streak: StreakState;
  /** 记录今日训练，调用 updateStreak 更新状态（含 Earn Back / 冻结卡自动扣减） */
  recordTrainingDay: () => void;
  /** 手动使用一张冻结卡，返回是否成功（数量不足或今日已用过则失败） */
  useStreakFreeze: () => boolean;
  /** 检查并标记新达成的里程碑，返回新里程碑天数（无则 null） */
  checkMilestone: () => number | null;
  /** 奖励冻结卡（默认 +1，可指定数量） */
  awardStreakFreeze: (count?: number) => void;
  /** 判断是否处于 Earn Back 窗口期（streakBrokenAt 在 24h 内） */
  canEarnBack: () => boolean;
  /** 恢复 streak：currentStreak = previousStreak + 1，清除 streakBrokenAt */
  earnBackStreak: (previousStreak: number) => void;

  // ELO 能力分级（P1-2）
  elo: EloRating;
  /** 段位升级事件（非 null 时表示刚发生升级，Dashboard 监听并弹 Dialog） */
  eloRankUp: RankUpEvent | null;
  /** 更新对应维度 ELO 与 overall；自动检测段位升级并设置 eloRankUp */
  updateElo: (
    dimension: EloDimension,
    isCorrect: boolean,
    difficulty: number
  ) => void;
  /** 重置 ELO 为默认值（gamesPlayed 清零） */
  resetElo: () => void;
  /** 清空段位升级事件（关闭 Dialog 后调用） */
  clearEloRankUp: () => void;
  /** 从 strategy-academy 的 abilityAssessment 同步初始 ELO（仅当 gamesPlayed=0 时生效） */
  syncEloFromAcademyAbility: (aa: AbilityAssessment) => void;

  // P1-4.3: 快速训练连续打卡（与 streak 独立的子计数器）
  /** 连续完成快速训练的天数（与 streak.currentStreak 解耦，仅统计快速训练） */
  quickDrillStreak: number;
  /** 上次完成快速训练的日期（YYYY-MM-DD），用于幂等与连续判断 */
  lastQuickDrillDate: string | null;
  /**
   * 记录一次快速训练完成（幂等：同日多次完成只计一次）。
   * 若连续 7 天达成，奖励 1 张冻结卡。
   * @returns newBadge 是否触发了 7 天奖励；quickDrillStreak 当前连续天数
   */
  recordQuickDrillCompletion: () => { newBadge: boolean; quickDrillStreak: number };

  // P2-4: 导师角色人格化
  /** 当前教练风格（默认 strict-math），影响反馈文案 */
  mentorStyle: MentorStyle;
  /** 切换教练风格 */
  setMentorStyle: (style: MentorStyle) => void;

  // P2-5: 情绪管理模块
  /** 情绪状态（今日情绪 / 连续答错 / 每日题量上限 / 下风期标记 / 正确率历史） */
  emotion: EmotionState;
  /** 设置今日情绪（如果是新的一天，重置 moodDate） */
  setTodayMood: (mood: 'good' | 'neutral' | 'bad') => void;
  /** 记录答题：更新 consecutiveWrongCount / dailyQuestionsAnswered / accuracyHistory */
  recordAnswer: (isCorrect: boolean) => void;
  /** 设置每日题量上限（0=无限） */
  setDailyQuestionLimit: (limit: number) => void;
  /** 检查是否连续 3 天正确率下降，更新 isDownswing 并返回结果 */
  checkDownswing: () => boolean;
  /** 重置每日计数器（新的一天调用） */
  resetDailyCounters: () => void;
  /**
   * P4 修复：统一的自适应难度降级判断。
   * 连续答错 ≥ 3 次时返回 true，调用方应将难度下调一级。
   */
  shouldDownshiftDifficulty: () => boolean;

  // P1-3: 成就/徽章系统
  /** 已解锁的成就 ID 列表 */
  unlockedAchievements: string[];
  /** 成就解锁时间戳映射 */
  achievementUnlockDates: Record<string, number>;
  /** 检查并解锁新成就（debounced） */
  checkAchievements: () => void;

  // 冻结卡碎片经济系统
  /** 当前碎片数量（0-4，满5合成1张） */
  freezeCardFragments: number;
  /** 上次获得碎片的日期（YYYY-MM-DD） */
  lastFragmentDate: string | null;
  /** 今日已获得碎片数（每日最多 2 个） */
  fragmentsEarnedToday: number;
  /**
   * 获得1个碎片，如果满5个则自动合成1张冻结卡
   * @returns newFragments 合成后剩余碎片数；synthesized 是否触发了合成
   */
  earnFragment: () => { newFragments: number; synthesized: boolean };
}

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      records: [],

      addRecord: (record) =>
        set((state) => {
          // 去重：相同 id 的记录不重复添加（防止事件总线重复 emit）
          if (state.records.some((r) => r.id === record.id)) return state;
          return { records: [...state.records, record] };
        }),

      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),

      clearAllRecords: () => set({ records: [] }),

      settings: {
        theme: 'dark',
        soundEnabled: true,
        defaultQuizTime: 15,
        defaultQuestionCount: 20,
        language: 'zh',
      },

      updateSettings: (partial) =>
        set((state) => ({
          settings: { ...state.settings, ...partial },
        })),

      // 全局游戏变体
      currentGameVariant: 'standard' as GameVariant,
      setGameVariant: (variant) => set({ currentGameVariant: variant }),

      getStatsSummary: () => aggregateStats(get().records),

      getRecentRecords: (count) => getRecent(get().records, count),

      getModuleStats: () => aggregateByModule(get().records),

      // 间隔重复复习
      reviewItems: [],
      dismissedRecommendations: [],
      lastDismissalDate: getTodayStringFromSR(),

      updateReviewItem: (item) =>
        set((state) => ({
          reviewItems: state.reviewItems.map((r) =>
            r.id === item.id ? item : r
          ),
        })),

      addReviewItem: (item) =>
        set((state) => {
          // 如果已存在则更新，否则添加
          const exists = state.reviewItems.some((r) => r.id === item.id);
          return {
            reviewItems: exists
              ? state.reviewItems.map((r) => (r.id === item.id ? item : r))
              : [...state.reviewItems, item],
          };
        }),

      dismissRecommendation: (id) =>
        set((state) => ({
          dismissedRecommendations: [...state.dismissedRecommendations, id],
        })),

      clearDailyDismissals: () =>
        set({ dismissedRecommendations: [], lastDismissalDate: getTodayStringFromSR() }),

      // 新手引导
      onboarding: { ...DEFAULT_ONBOARDING, startedAt: Date.now() },

      completeOnboardingStep: (step, data) =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            ...data,
            currentStep: step,
            completed: step >= 5 ? true : state.onboarding.completed,
            completedAt: step >= 5 ? Date.now() : state.onboarding.completedAt,
          },
        })),

      skipOnboarding: () =>
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            completed: true,
            currentStep: 5,
            completedAt: Date.now(),
          },
        })),

      resetOnboarding: () =>
        set({
          onboarding: { ...DEFAULT_ONBOARDING, startedAt: Date.now() },
        }),

      // Streak 完整机制（P0-2）
      streak: { ...DEFAULT_STREAK_STATE },

      recordTrainingDay: () => {
        const prev = get().streak;
        const updated = updateStreak(prev);
        // 只在今日成功记录（lastTrainingDate 等于 today）时检查里程碑
        if (updated.lastTrainingDate === getTodayStringFromStreak() && updated !== prev) {
          set({ streak: updated });
          get().checkMilestone();
          // 完成每日训练有 30% 概率获得 1 个碎片（每日最多 2 个）
          tryEarnFragment(0.3);
        } else {
          set({ streak: updated });
        }
      },

      useStreakFreeze: () => {
        const streak = get().streak;
        if (streak.streakFreezes <= 0 || streak.streakFreezeUsedToday) return false;
        set({
          streak: {
            ...streak,
            streakFreezes: streak.streakFreezes - 1,
            streakFreezeUsedToday: true,
          },
        });
        return true;
      },

      checkMilestone: () => {
        const streak = get().streak;
        const newDay = checkNewMilestone(streak.currentStreak, streak.milestones);
        if (newDay === null) return null;
        const key = `day${newDay}` as keyof StreakMilestones;
        set({
          streak: {
            ...streak,
            milestones: { ...streak.milestones, [key]: true },
            lastMilestoneCelebrated: newDay,
          },
        });
        return newDay;
      },

      awardStreakFreeze: (count = 1) =>
        set((state) => ({
          streak: {
            ...state.streak,
            streakFreezes: state.streak.streakFreezes + count,
          },
        })),

      canEarnBack: () => isEarnBackActive(get().streak.streakBrokenAt),

      earnBackStreak: (previousStreak) => {
        const restored = previousStreak + 1;
        set((state) => ({
          streak: {
            ...state.streak,
            currentStreak: restored,
            longestStreak: Math.max(state.streak.longestStreak, restored),
            streakBrokenAt: null,
            lastTrainingDate: getTodayStringFromStreak(),
            streakFreezeUsedToday: false,
          },
        }));
      },

      // ===== ELO 能力分级（P1-2） =====
      elo: { ...DEFAULT_ELO, lastUpdated: Date.now() },
      eloRankUp: null,

      updateElo: (dimension, isCorrect, difficulty) => {
        const prev = get().elo;
        const oldOverall = prev.overall;
        const newElo = applyEloChange(prev, dimension, isCorrect, difficulty);
        const rankUp = checkRankUp(oldOverall, newElo.overall);
        set({
          elo: newElo,
          eloRankUp: rankUp.isUp
            ? { from: getRankForScore(oldOverall), to: rankUp.newRank! }
            : null,
        });
      },

      resetElo: () =>
        set({ elo: { ...DEFAULT_ELO, lastUpdated: Date.now() }, eloRankUp: null }),

      clearEloRankUp: () => set({ eloRankUp: null }),

      syncEloFromAcademyAbility: (aa) => {
        // 仅当 ELO 尚未被答题更新过时才同步（避免覆盖已累积的进度）
        if (get().elo.gamesPlayed > 0) return;
        if (!hasNonDefaultAbility(aa)) return;
        set({ elo: mapAcademyAbilityToElo(aa) });
      },

      // ===== P1-4.3: 快速训练连续打卡（独立于 streak.currentStreak） =====
      quickDrillStreak: 0,
      lastQuickDrillDate: null,

      recordQuickDrillCompletion: () => {
        const today = getTodayStringFromStreak();
        const yesterday = getYesterdayStringFromStreak();
        const prev = get();

        // 幂等：同日多次完成只计一次（仅返回当前状态）
        if (prev.lastQuickDrillDate === today) {
          return { newBadge: false, quickDrillStreak: prev.quickDrillStreak };
        }

        // 连续判断：上次完成日为昨天 → +1；否则重置为 1（首次或断签）
        const newStreak = prev.lastQuickDrillDate === yesterday
          ? prev.quickDrillStreak + 1
          : 1;

        // 每 7 天奖励 1 张冻结卡（在 7、14、21… 触发）
        const newBadge = newStreak > 0 && newStreak % 7 === 0;
        set({
          quickDrillStreak: newStreak,
          lastQuickDrillDate: today,
        });
        if (newBadge) {
          get().awardStreakFreeze(1);
        }
        // 快速训练完成时有 20% 概率获得 1 个碎片（每日最多 2 个）
        tryEarnFragment(0.2);
        return { newBadge, quickDrillStreak: newStreak };
      },

      // ===== P2-4: 导师角色人格化 =====
      mentorStyle: DEFAULT_MENTOR,
      setMentorStyle: (style) => set({ mentorStyle: style }),

      // ===== P2-5: 情绪管理模块 =====
      emotion: { ...DEFAULT_EMOTION_STATE },

      setTodayMood: (mood) => {
        const today = getTodayStringFromStreak();
        set((state) => ({
          emotion: {
            ...state.emotion,
            todayMood: mood,
            moodDate: today,
          },
        }));
      },

      recordAnswer: (isCorrect) => {
        const today = getTodayStringFromStreak();
        const prev = get().emotion;

        // 跨日重置：如果 dailyQuestionsDate 不是今天，先重置计数器
        let dailyCorrect = prev.dailyCorrect;
        let dailyTotal = prev.dailyTotal;
        let dailyQuestionsAnswered = prev.dailyQuestionsAnswered;
        if (prev.dailyQuestionsDate !== today) {
          dailyCorrect = 0;
          dailyTotal = 0;
          dailyQuestionsAnswered = 0;
        }

        // 更新计数器
        dailyTotal += 1;
        dailyQuestionsAnswered += 1;
        if (isCorrect) {
          dailyCorrect += 1;
        }

        // 更新连续答错数
        const consecutiveWrongCount = isCorrect ? 0 : prev.consecutiveWrongCount + 1;

        // 更新 accuracyHistory（保留最近 7 天）
        const accuracy = dailyTotal > 0 ? dailyCorrect / dailyTotal : 0;
        const existingIdx = prev.accuracyHistory.findIndex((h) => h.date === today);
        let accuracyHistory: { date: string; accuracy: number }[];
        if (existingIdx >= 0) {
          accuracyHistory = prev.accuracyHistory.map((h, i) =>
            i === existingIdx ? { date: today, accuracy } : h
          );
        } else {
          accuracyHistory = [...prev.accuracyHistory, { date: today, accuracy }];
          // 仅保留最近 7 天
          if (accuracyHistory.length > 7) {
            accuracyHistory = accuracyHistory.slice(-7);
          }
        }

        set({
          emotion: {
            ...prev,
            consecutiveWrongCount,
            dailyQuestionsAnswered,
            dailyQuestionsDate: today,
            dailyCorrect,
            dailyTotal,
            accuracyHistory,
          },
        });

        // 检查下风期（仅在数据足够时更新 isDownswing）
        get().checkDownswing();
      },

      setDailyQuestionLimit: (limit) => {
        set((state) => ({
          emotion: { ...state.emotion, dailyQuestionLimit: limit },
        }));
      },

      checkDownswing: () => {
        const prev = get().emotion;
        const history = prev.accuracyHistory;
        // 需要至少 3 天数据
        if (history.length < 3) {
          if (prev.isDownswing) {
            set((state) => ({ emotion: { ...state.emotion, isDownswing: false } }));
          }
          return false;
        }
        // 取最近 3 天，按日期升序比较
        const last3 = history.slice(-3);
        const isDownswing =
          last3[1]!.accuracy < last3[0]!.accuracy &&
          last3[2]!.accuracy < last3[1]!.accuracy;
        if (prev.isDownswing !== isDownswing) {
          set((state) => ({ emotion: { ...state.emotion, isDownswing } }));
        }
        return isDownswing;
      },

      resetDailyCounters: () => {
        const today = getTodayStringFromStreak();
        set((state) => ({
          emotion: {
            ...state.emotion,
            dailyQuestionsAnswered: 0,
            dailyQuestionsDate: today,
            dailyCorrect: 0,
            dailyTotal: 0,
          },
        }));
      },

      /**
       * P4 修复（4.5-P0）：统一的自适应难度降级判断。
       *
       * 用于所有训练模块（range-trainer / pot-odds / puzzle-trainer / gto-simulator）
       * 在答题后调用，判断是否应降低难度。
       *
       * 规则：
       *   - 连续答错 ≥ 3 次 → 建议降级（与 TiltWarning 阈值一致）
       *   - 返回 true 时，调用方应将难度下调一级（但不低于最低难度）
       *
       * @returns 是否应降低难度
       */
      shouldDownshiftDifficulty: () => {
        return get().emotion.consecutiveWrongCount >= 3;
      },

      // ===== 冻结卡碎片经济系统 =====
      freezeCardFragments: 0,
      lastFragmentDate: null,
      fragmentsEarnedToday: 0,

      earnFragment: () => {
        const current = get().freezeCardFragments + 1;
        if (current >= 5) {
          // 满5个碎片，合成1张冻结卡
          set({ freezeCardFragments: 0 });
          get().awardStreakFreeze(1);
          return { newFragments: 0, synthesized: true };
        }
        set({ freezeCardFragments: current });
        return { newFragments: current, synthesized: false };
      },

      // ===== P1-3: 成就/徽章系统 =====
      unlockedAchievements: [],
      achievementUnlockDates: {},

      checkAchievements: async () => {
        // 此函数将被 debounce 包装（见文件底部）
        const state = get();
        const alreadyUnlocked = new Set(state.unlockedAchievements);
        const newUnlocked: string[] = [];
        const newDates: Record<string, number> = {};
        let freezeReward = 0;

        for (const ach of ACHIEVEMENTS) {
          if (alreadyUnlocked.has(ach.id)) continue;
          if (await checkCondition(ach.condition, state)) {
            newUnlocked.push(ach.id);
            newDates[ach.id] = Date.now();
            if (ach.reward?.freezeCards) {
              freezeReward += ach.reward.freezeCards;
            }
          }
        }

        if (newUnlocked.length > 0) {
          set((s) => ({
            unlockedAchievements: [...s.unlockedAchievements, ...newUnlocked],
            achievementUnlockDates: { ...s.achievementUnlockDates, ...newDates },
          }));
          if (freezeReward > 0) {
            get().awardStreakFreeze(freezeReward);
          }
        }
      },
    }),
    {
      name: 'poker-training-progress',
      version: 8,
      migrate: (persistedState: unknown, fromVersion: number) => {
        // 兼容老数据：顶层 lastTrainingDate (number 时间戳) 已在 v2 迁移中并入 streak
        const next = (persistedState ?? {}) as Partial<ProgressStore> & {
          lastTrainingDate?: number | null;
        };
        // v0 → v1：注入 onboarding
        if (fromVersion < 1) {
          if (!next.onboarding) {
            next.onboarding = { ...DEFAULT_ONBOARDING, startedAt: Date.now() };
          }
        }
        // v1 → v2：注入 streak 默认值，转换老 lastTrainingDate
        if (fromVersion < 2) {
          if (!next.streak) {
            const oldLastTrainingDate = next.lastTrainingDate;
            const lastTrainingStr =
              typeof oldLastTrainingDate === 'number' && Number.isFinite(oldLastTrainingDate)
                ? timestampToYYYYMMDD(oldLastTrainingDate)
                : null;
            next.streak = {
              ...DEFAULT_STREAK_STATE,
              lastTrainingDate: lastTrainingStr,
              // 若老用户已有训练记录，将 streakStartDate 同步为最近训练日（保守值）
              streakStartDate: lastTrainingStr,
            };
          }
          // 删除顶层 lastTrainingDate（已迁入 streak）
          delete (next as Record<string, unknown>).lastTrainingDate;
        }
        // v2 → v3：注入 ELO 默认值与 eloRankUp=null
        // 注：strategy-academy 的 abilityAssessment → ELO 映射在模块底部
        // 通过 setTimeout + 动态 import 自动完成（避免循环依赖）
        if (fromVersion < 3) {
          if (!next.elo) {
            next.elo = { ...DEFAULT_ELO, lastUpdated: Date.now() };
          }
          if (next.eloRankUp === undefined) {
            next.eloRankUp = null;
          }
        }
        // v3 → v4：注入 P1-4.3 快速训练连续打卡默认值
        if (fromVersion < 4) {
          if (next.quickDrillStreak === undefined) {
            next.quickDrillStreak = 0;
          }
          if (next.lastQuickDrillDate === undefined) {
            next.lastQuickDrillDate = null;
          }
        }
        // v4 → v5：注入 P2-4 导师风格默认值
        if (fromVersion < 5) {
          if (!next.mentorStyle) {
            next.mentorStyle = DEFAULT_MENTOR;
          }
        }
        // v5 → v6：注入 P2-5 情绪管理模块默认值
        if (fromVersion < 6) {
          if (!next.emotion) {
            next.emotion = { ...DEFAULT_EMOTION_STATE };
          } else {
            // 防御性合并：补全可能缺失的内部计数器字段
            next.emotion = { ...DEFAULT_EMOTION_STATE, ...next.emotion };
          }
        }
        // v6 → v7：注入 P1-3 成就系统默认值
        if (fromVersion < 7) {
          if (!next.unlockedAchievements) {
            next.unlockedAchievements = [];
          }
          if (!next.achievementUnlockDates) {
            next.achievementUnlockDates = {};
          }
        }
        // v7 → v8：注入冻结卡碎片经济系统默认值
        if (fromVersion < 8) {
          if (next.freezeCardFragments === undefined) {
            next.freezeCardFragments = 0;
          }
          if (next.lastFragmentDate === undefined) {
            next.lastFragmentDate = null;
          }
          if (next.fragmentsEarnedToday === undefined) {
            next.fragmentsEarnedToday = 0;
          }
        }
        return next as ProgressStore;
      },
    }
  )
);

// 订阅训练事件总线，自动写入 store
trainingEvents.subscribe((record) => {
  useProgressStore.getState().addRecord(record);
  // 训练完成后触发成就检查（debounced）
  debouncedCheckAchievements();
});

// P1-3: 成就检查 debounce 包装（300ms）
let checkTimeout: ReturnType<typeof setTimeout> | null = null;
function debouncedCheckAchievements() {
  if (checkTimeout) clearTimeout(checkTimeout);
  checkTimeout = setTimeout(() => {
    useProgressStore.getState().checkAchievements();
  }, 300);
}

/**
 * 成就条件检查辅助函数
 * 根据条件类型从各 store 状态判断是否达成
 */
async function checkCondition(
  condition: AchievementCondition,
  state: ProgressStore
): Promise<boolean> {
  switch (condition.type) {
    case 'firstTraining':
      return state.records.length > 0;

    case 'completeLessons': {
      if (condition.level === undefined) return false;
      try {
        const academy = await getAcademyStore();
        const completed = academy.useAcademyStore.getState().progress.completedLessons;
        const prefix = `l${condition.level}-`;
        const levelLessons = completed.filter((id) => id.startsWith(prefix));
        return levelLessons.length > 0;
      } catch {
        return false;
      }
    }

    case 'streak':
      return state.streak.currentStreak >= condition.days;

    case 'quickDrillStreak':
      return state.quickDrillStreak >= condition.days;

    case 'accuracy': {
      return state.records.some(
        (r) =>
          r.result.totalQuestions >= condition.sampleSize &&
          r.result.accuracy >= condition.threshold
      );
    }

    case 'elo':
      return state.elo.overall >= condition.minScore;

    case 'certification': {
      try {
        const academy = await getAcademyStore();
        const certs = academy.useAcademyStore.getState().certifications;
        if (condition.level === 0) {
          return Object.values(certs).some((c) => c.certifiedAt);
        }
        return !!certs[condition.level]?.certifiedAt;
      } catch {
        return false;
      }
    }

    case 'allCertifications': {
      try {
        const academy = await getAcademyStore();
        const certs = academy.useAcademyStore.getState().certifications;
        return Object.values(certs).some((c) => c.certifiedAt);
      } catch {
        return false;
      }
    }

    case 'completeTrack': {
      try {
        const academy = await getAcademyStore();
        const completed = new Set(academy.useAcademyStore.getState().progress.completedLessons);
        // 简化判断：完成了 10+ 课程认为可能完成了一个 track
        return completed.size >= 10;
      } catch {
        return false;
      }
    }

    case 'firstPuzzle': {
      try {
        const history = usePuzzleStore.getState().history;
        return history.length > 0;
      } catch {
        return false;
      }
    }

    case 'firstDailyPuzzle': {
      try {
        const dailyCompleted = usePuzzleStore.getState().dailyCompleted;
        return Object.keys(dailyCompleted).length > 0;
      } catch {
        return false;
      }
    }

    // 理论学院（2026-07）：完成章节数达标
    case 'theoryChapters': {
      try {
        const theory = await getTheoryStore();
        const completed = theory.store.useTheoryStore.getState().progress.completedChapters;
        return completed.length >= condition.count;
      } catch {
        return false;
      }
    }

    // 理论学院（2026-07）：前 N 个 Level（t1..tN）全部章节完成
    case 'theoryLevel': {
      try {
        const theory = await getTheoryStore();
        const completed = theory.store.useTheoryStore.getState().progress.completedChapters;
        for (let lv = 1; lv <= condition.level; lv++) {
          if (!theory.utils.isLevelFullyCompleted(`t${lv}`, completed)) return false;
        }
        return true;
      } catch {
        return false;
      }
    }

    case 'allAchievements': {
      const totalNonMeta = state.unlockedAchievements.filter((id) => id !== 'all-achievements');
      return totalNonMeta.length >= 20;
    }

    default:
      return false;
  }
}

// ===== 冻结卡碎片：概率获取辅助函数 =====
// 每日最多获得 2 个碎片，跨日自动重置计数器
function tryEarnFragment(probability: number) {
  const state = useProgressStore.getState();
  const today = getTodayStringFromStreak();

  // 跨日重置
  if (state.lastFragmentDate !== today) {
    useProgressStore.setState({ fragmentsEarnedToday: 0, lastFragmentDate: today });
  }

  // 每日最多 2 个碎片
  if (useProgressStore.getState().fragmentsEarnedToday >= 2) return;

  // 概率判定
  if (Math.random() < probability) {
    useProgressStore.setState((s) => ({
      fragmentsEarnedToday: s.fragmentsEarnedToday + 1,
    }));
    useProgressStore.getState().earnFragment();
  }
}

// P1-2.3: 启动时从 strategy-academy 的 abilityAssessment 同步初始 ELO
// 仅当 elo.gamesPlayed === 0 时执行（避免覆盖已累积的答题进度）
// 通过 getAcademyStore() 动态加载，避免静态循环依赖
if (typeof window !== 'undefined') {
  setTimeout(() => {
    void (async () => {
      try {
        const progressState = useProgressStore.getState();
        if (progressState.elo.gamesPlayed > 0) return;
        const academy = await getAcademyStore();
        const aa = academy.useAcademyStore.getState().abilityAssessment;
        if (hasNonDefaultAbility(aa)) {
          useProgressStore.setState({ elo: mapAcademyAbilityToElo(aa) });
        }
      } catch {
        // 静默失败：academy store 未初始化时不影响主流程
      }
    })();
  }, 0);
}
