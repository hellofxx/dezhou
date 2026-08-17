import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TrainingRecord, StatsSummary, ModuleStats, UserSettings, OnboardingState, StreakState, StreakMilestones, EmotionState, QuickDrillBestRecord } from './types';
import { DEFAULT_EMOTION_STATE, MILESTONE_DAYS, MILESTONE_FREEZE_REWARDS } from './types';
import { aggregateStats, aggregateByModule, getRecentRecords as getRecent } from './utils/statsAggregator';
// P2-01 阶段 A：records 持久化外迁 IndexedDB
import { recordDatabase } from './utils/recordDatabase';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import {
  updateStreak,
  isEarnBackActive,
  applyManualFreeze,
  computeStreakBrokenAt,
  getTodayString,
  getYesterdayString as getYesterdayStringFromStreak,
} from './utils/streakCalc';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';
import { sanitizeReviewLabel } from '@/shared/utils/sanitizeReviewLabel';
import type { GameVariant } from '@/shared/types/poker';
// P1-2: ELO 能力分级
import type { EloRating, EloDimension, RankUpEvent, PokerVariant } from '@/shared/types/elo';
import { DEFAULT_ELO, DEFAULT_VARIANT } from '@/shared/types/elo';
import {
  applyEloChange,
  checkRankUp,
  getRankForScore,
  abilityToElo,
  computeOverallElo,
  getDynamicKFactor,
} from '@/shared/utils/elo';
import type { AbilityAssessment } from '@/shared/types/ability';
// P2-4: 导师角色人格化
import type { MentorStyle } from '@/shared/types/mentor';
import { DEFAULT_MENTOR } from '@/shared/types/mentor';
// P1-3: 成就/徽章系统
import { ACHIEVEMENTS } from './data/achievements';
import type { AchievementCondition } from './data/achievements';
// 跨模块 store 引用（用于成就检查）
// 成就检查已改为依赖倒置：业务模块（strategy-academy / theory-academy / puzzle-trainer）通过
// achievementRegistry 注册数据源，此处仅遍历注册表查询，不再 import 具体模块。
import { getAchievementSources } from '@/shared/stores/achievementRegistry';

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
export function mapAcademyAbilityToElo(aa: AbilityAssessment): EloRating {
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
export function hasNonDefaultAbility(aa: AbilityAssessment | undefined | null): aa is AbilityAssessment {
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

/**
 * 持久化版本迁移表（表驱动，替代线性 if 链）。
 * MIGRATIONS[i] 对应 v(i) → v(i+1) 迁移（即原 `if (fromVersion < i+1)` 代码块），
 * migrate 从 fromVersion 起顺序执行到数组末尾，与线性链行为完全等价。
 */
const MIGRATIONS: Array<(state: Record<string, unknown>) => void> = [
  // v0 → v1：注入 onboarding（v0 数据不存在，此段为防御性保留）
  (s) => {
    if (!s.onboarding) {
      s.onboarding = { ...DEFAULT_ONBOARDING, startedAt: Date.now() };
    }
  },
  // v1 → v2：注入 streak 默认值，转换老 lastTrainingDate
  (s) => {
    if (!s.streak) {
      const oldLastTrainingDate = s.lastTrainingDate;
      const lastTrainingStr =
        typeof oldLastTrainingDate === 'number' && Number.isFinite(oldLastTrainingDate)
          ? toLocalDateKey(oldLastTrainingDate)
          : null;
      s.streak = {
        ...DEFAULT_STREAK_STATE,
        lastTrainingDate: lastTrainingStr,
        // 若老用户已有训练记录，将 streakStartDate 同步为最近训练日（保守值）
        streakStartDate: lastTrainingStr,
      };
    }
    // 删除顶层 lastTrainingDate（已迁入 streak）
    delete s.lastTrainingDate;
  },
  // v2 → v3：注入 ELO 默认值与 eloRankUp=null
  // 注：strategy-academy 的 abilityAssessment → ELO 映射由 initProgressStore
  // （store.bootstrap.ts）通过 setTimeout + 动态 import 自动完成（避免循环依赖）
  (s) => {
    if (!s.elo) {
      s.elo = { ...DEFAULT_ELO, lastUpdated: Date.now() };
    }
    if (s.eloRankUp === undefined) {
      s.eloRankUp = null;
    }
  },
  // v3 → v4：注入 P1-4.3 快速训练连续打卡默认值
  (s) => {
    if (s.quickDrillStreak === undefined) {
      s.quickDrillStreak = 0;
    }
    if (s.lastQuickDrillDate === undefined) {
      s.lastQuickDrillDate = null;
    }
  },
  // v4 → v5：注入 P2-4 导师风格默认值
  (s) => {
    if (!s.mentorStyle) {
      s.mentorStyle = DEFAULT_MENTOR;
    }
  },
  // v5 → v6：注入 P2-5 情绪管理模块默认值
  (s) => {
    if (!s.emotion) {
      s.emotion = { ...DEFAULT_EMOTION_STATE };
    } else {
      // 防御性合并：补全可能缺失的内部计数器字段
      s.emotion = { ...DEFAULT_EMOTION_STATE, ...(s.emotion as object) };
    }
  },
  // v6 → v7：注入 P1-3 成就系统默认值
  (s) => {
    if (!s.unlockedAchievements) {
      s.unlockedAchievements = [];
    }
    if (!s.achievementUnlockDates) {
      s.achievementUnlockDates = {};
    }
  },
  // v7 → v8：注入冻结卡碎片经济系统默认值
  (s) => {
    if (s.freezeCardFragments === undefined) {
      s.freezeCardFragments = 0;
    }
    if (s.lastFragmentDate === undefined) {
      s.lastFragmentDate = null;
    }
    if (s.fragmentsEarnedToday === undefined) {
      s.fragmentsEarnedToday = 0;
    }
  },
  // v8 → v9：注入待展示里程碑庆典默认值（全局庆典 host）
  (s) => {
    if (s.pendingMilestone === undefined) {
      s.pendingMilestone = null;
    }
  },
  // v9 → v10：游戏变体 ELO 分离（elo → eloByVariant）
  (s) => {
    const elo = s.elo as EloRating | undefined;
    const eloByVariant = s.eloByVariant as Record<PokerVariant, EloRating> | undefined;
    // 如果已有 elo，克隆到 eloByVariant.standard
    if (elo && eloByVariant === undefined) {
      const standardElo = { ...elo, variant: 'standard' as PokerVariant };
      s.eloByVariant = {
        standard: standardElo,
        'short-deck': { ...standardElo, variant: 'short-deck' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
        'heads-up': { ...standardElo, variant: 'heads-up' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
      };
      // activeVariant 默认为 standard
      if (s.activeVariant === undefined) {
        s.activeVariant = 'standard';
      }
    }
    // 如果没有 elo 但有 eloByVariant（新用户使用），确保所有变体都有默认值
    if (eloByVariant && !('elo' in s)) {
      for (const variant of ['standard', 'short-deck', 'heads-up'] as PokerVariant[]) {
        if (!eloByVariant[variant]) {
          eloByVariant[variant] = {
            ...DEFAULT_ELO,
            variant,
            gamesPlayed: 0,
            lastUpdated: 0,
          };
        }
      }
    }
  },
  // v10 → v11：清洗 reviewItems GTO 标签尾部的硬编码中文"决策"。
  // 场景数据层（GTO scenarioGenerator）已不再写入"决策"后缀，
  // 此处清理已持久化在 localStorage 中的遗留脏数据，避免首页
  // 英文界面下出现"BTN Turn 决策"中英混杂。
  (s) => {
    const items = s.reviewItems as Array<{ label?: string }> | undefined;
    if (Array.isArray(items)) {
      s.reviewItems = items.map((item) => {
        if (item.label && item.label.endsWith(' 决策')) {
          return { ...item, label: sanitizeReviewLabel(item.label) };
        }
        return item;
      });
    }
  },
  // v11 → v12：注入 quickDrillBest 默认值（P2-02：从 puzzle-trainer store 迁入）
  (s) => {
    if (s.quickDrillBest === undefined) {
      s.quickDrillBest = null;
    }
  },
  // v12 → v13：淘汰 elo 字段，统一使用 eloByVariant.standard
  // （P2-01 阶段 A 退役计划第一步：清理 localStorage 中的双写冗余数据）
  (s) => {
    const eloByVariant = s.eloByVariant as Record<PokerVariant, EloRating> | undefined;
    if (!eloByVariant) {
      // 防御：老数据缺失 eloByVariant 时兜底重建（v9→v10 已保证存在，此处双保险）
      s.eloByVariant = {
        standard: { ...DEFAULT_ELO, variant: 'standard' as PokerVariant },
        'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
        'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
      };
    } else if (!eloByVariant.standard) {
      eloByVariant.standard = { ...DEFAULT_ELO, variant: 'standard' as PokerVariant };
    }
    // 直接删除顶层 elo 字段（退役：统一以 eloByVariant.standard 为单一事实源）
    delete s.elo;
  },
  // v13 → v14：清理 elo 内存兼容层残留键
  // （消费方已全部迁移至 eloByVariant；v13 之后内存镜像曾通过 partialize 回写复活
  //   过 elo 键，已处于 v13 的存量用户此处防御性删除，此后不再复活）
  (s) => {
    delete s.elo;
  },
  // v14 → v15：注入学习焦点模式默认值（§13.6.2）
  (s) => {
    if (s.focusModule === undefined) {
      s.focusModule = null;
    }
  },
];

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
  /** 手动使用一张冻结卡"为今天请假"（lastTrainingDate 置为今天保住连续性），
   * 返回是否成功（今日已训/无卡/今日已用/无可保护 streak 则失败） */
  useStreakFreeze: () => boolean;
  /** 断裂发现检测（首页挂载时调用）：昨日漏训且无卡可自动保护时标记
   * streakBrokenAt（今日 0 点），驱动"⚡ Earn Back 窗口期"提示 */
  detectStreakBreak: () => void;
  /** 检查并标记新达成的里程碑，返回新里程碑天数（无则 null）；
   * 达成时立即发放冻结卡奖励并设置 pendingMilestone（全局庆典 host 监听展示） */
  checkMilestone: () => number | null;
  /** 待展示的里程碑庆典（非 null 表示刚达成，全局 host 弹窗展示后清除） */
  pendingMilestone: number | null;
  /** 清除待展示里程碑（庆典弹窗关闭后调用） */
  clearPendingMilestone: () => void;
  /** 奖励冻结卡（默认 +1，可指定数量） */
  awardStreakFreeze: (count?: number) => void;
  /** 判断是否处于 Earn Back 窗口期（streakBrokenAt 在 24h 内） */
  canEarnBack: () => boolean;
  /** 恢复 streak：currentStreak = previousStreak + 1，清除 streakBrokenAt */
  earnBackStreak: (previousStreak: number) => void;

  // ELO 能力分级（P1-2）
  /** 段位升级事件（非 null 时表示刚发生升级，Dashboard 监听并弹 Dialog）*/
  eloRankUp: RankUpEvent | null;
  /** 更新对应维度 ELO 与 overall；自动检测段位升级并设置 eloRankUp */
  updateElo: (
    dimension: EloDimension,
    isCorrect: boolean,
    difficulty: number
  ) => void;
  /** 重置 ELO 为默认值（gamesPlayed 清零）*/
  resetElo: () => void;
  /** 清空段位升级事件（关闭 Dialog 后调用）*/
  clearEloRankUp: () => void;
  /** 从 strategy-academy 的 abilityAssessment 同步初始 ELO（仅当 gamesPlayed=0 时生效）*/
  syncEloFromAcademyAbility: (aa: AbilityAssessment) => void;
    
  // P2-1: 游戏变体 ELO 分离（eloRating → eloByVariant）
  /** 当前选中的游戏变体 */
  activeVariant: PokerVariant;
  /** 各变体的独立 ELO 评分 */
  eloByVariant: Record<PokerVariant, EloRating>;
  /** P2-1: 切换当前活动变体（ELO 更新将作用于该变体） */
  switchActiveVariant: (variant: PokerVariant) => void;
  /** P2-1: 获取指定变体指定维度的 ELO 分数 */
  getVariantElo: (variant: PokerVariant, dimension: EloDimension) => number;
  /** P2-1: 获取全部变体的 ELO 评分 */
  getAllVariantsRatings: () => Record<PokerVariant, EloRating>;

  // P1-4.3: 快速训练连续打卡（与 streak 独立的子计数器）
  /** 连续完成快速训练的天数（与 streak.currentStreak 解耦，仅统计快速训练） */
  quickDrillStreak: number;
  /** 上次完成快速训练的日期（YYYY-MM-DD），用于幂等与连续判断 */
  lastQuickDrillDate: string | null;
  /** P2-02: 快速训练历史最佳记录（从 puzzle-trainer store 迁入） */
  quickDrillBest: QuickDrillBestRecord | null;
  /**
   * 记录一次快速训练完成（幂等：同日多次完成只计一次）。
   * 若连续 7 天达成，奖励 1 张冻结卡。
   * @returns newBadge 是否触发了 7 天奖励；quickDrillStreak 当前连续天数
   */
  recordQuickDrillCompletion: () => { newBadge: boolean; quickDrillStreak: number };
  /**
   * P2-02: 提交快速训练结果，返回是否破纪录。
   * 从 puzzle-trainer store 迁入，实现与原来完全一致。
   */
  submitQuickDrillResult: (input: {
    score: number;
    accuracy: number;
    timeTaken: number;
  }) => { isNewRecord: boolean; previousBest: QuickDrillBestRecord | null };

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

  // 学习焦点模式（§13.6.2）
  /** 当前聚焦的模块 ID（null = 未聚焦） */
  focusModule: string | null;
  /** 设置聚焦模块（传递 null 取消聚焦） */
  setFocusModule: (module: string | null) => void;

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

      addRecord: (record) => {
        // P1A-04/P1F-03 兜底（专批 B）：纵深防御拒收空会话 —— totalQuestions <= 0
        // 的训练结果不入账（不计 records，不写 IndexedDB，不参与统计/成就/Dashboard 聚合）。
        // 模块侧已阻断空会话入口（range-trainer X 按钮 / theory 空题库守卫），
        // 此处为中枢兜底，防止未来任意模块 emit 空会话污染数据
        if (!record.result || record.result.totalQuestions <= 0) return;
        set((state) => {
          // 去重：相同 id 的记录不重复添加（防止事件总线重复 emit）
          if (state.records.some((r) => r.id === record.id)) return state;
          return { records: [...state.records, record] };
        });
        // P2-01 阶段 A：records 持久化外迁 IndexedDB —— 内存仍保留全量 records 供
        // 实时查询/统计，持久化由 side-effect 统一写入（put 按 id 幂等）并自动裁剪。
        // IndexedDB 不可用时静默降级为会话内记录（跨会话持久化缺失，不影响功能）。
        void (async () => {
          try {
            await recordDatabase.add([record]);
            await recordDatabase.cleanup(1000); // 自动裁剪：仅保留最近 1000 条
          } catch (err) {
            console.warn('[progress] 训练记录写入 IndexedDB 失败', err);
          }
        })();
      },

      deleteRecord: (id) => {
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        }));
        // P2-01 阶段 A：同步删除 IndexedDB 记录，避免刷新后残留
        void recordDatabase.delete(id).catch((err) => {
          console.warn('[progress] 删除训练记录失败', err);
        });
      },

      clearAllRecords: () => {
        set({ records: [] });
        // P2-01 阶段 A：同步清空 IndexedDB
        void recordDatabase.clear().catch((err) => {
          console.warn('[progress] 清空训练记录失败', err);
        });
      },

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
      lastDismissalDate: getTodayString(),

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

      dismissRecommendation: (id) => set((state) => {
        // 去重：同一 id 重复调用不重复 push
        if (state.dismissedRecommendations.includes(id)) return state;
        return {
          dismissedRecommendations: [...state.dismissedRecommendations, id],
        };
      }),

      clearDailyDismissals: () =>
        set({ dismissedRecommendations: [], lastDismissalDate: getTodayString() }),

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
        if (updated.lastTrainingDate === getTodayString() && updated !== prev) {
          set({ streak: updated });
          get().checkMilestone();
          // 完成每日训练有 30% 概率获得 1 个碎片（每日最多 2 个）
          tryEarnFragment(0.3);
        } else {
          set({ streak: updated });
        }
      },

      useStreakFreeze: () => {
        // 语义：为"今天"补出勤（主动请假），判定与状态变更收敛在纯函数 applyManualFreeze
        const next = applyManualFreeze(get().streak);
        if (next === null) return false;
        set({ streak: next });
        return true;
      },

      detectStreakBreak: () => {
        const brokenAt = computeStreakBrokenAt(get().streak);
        if (brokenAt === null) return;
        set((state) => ({ streak: { ...state.streak, streakBrokenAt: brokenAt } }));
      },

      checkMilestone: () => {
        const streak = get().streak;
        // P1 fix: 收集所有新达成的里程碑（而非仅最大者）。
        // 逐日训练时 streak 每次 +1 只会命中一个；但 earnBack/导入记录导致跳档时
        // （如 2 天直接到 30 天），3/7 天里程碑也会被一并标记并发奖，避免奖励丢失。
        const newlyReached = MILESTONE_DAYS.filter(
          (day) => !streak.milestones[`day${day}` as keyof StreakMilestones] && streak.currentStreak >= day,
        );
        if (newlyReached.length === 0) return null;
        const nextMilestones = { ...streak.milestones };
        let totalRewards = 0;
        for (const day of newlyReached) {
          nextMilestones[`day${day}` as keyof StreakMilestones] = true;
          totalRewards += MILESTONE_FREEZE_REWARDS[day] ?? 1;
        }
        const lastDay = newlyReached[newlyReached.length - 1]!;
        set({
          streak: {
            ...streak,
            milestones: nextMilestones,
            lastMilestoneCelebrated: lastDay,
          },
          // 设置待展示庆典（展示最大者；奖励已按全部新达成累计发放）
          pendingMilestone: lastDay,
        });
        // 达成即发放冻结卡奖励（与弹窗展示解耦，刷新/导航不丢奖励）
        get().awardStreakFreeze(totalRewards);
        return lastDay;
      },

      pendingMilestone: null,
      clearPendingMilestone: () => set({ pendingMilestone: null }),

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
            lastTrainingDate: getTodayString(),
            streakFreezeUsedToday: false,
          },
        }));
      },

      // ===== ELO 能力分级（P1-2）=====
      // eloByVariant 为 ELO 单一事实源（顶层 elo 镜像已移除，persist v14）
      eloRankUp: null,
      
      // P2-1: 游戏变体 ELO 分离
      activeVariant: DEFAULT_VARIANT,
      eloByVariant: {
        standard: { ...DEFAULT_ELO, variant: 'standard' as PokerVariant },
        'short-deck': { ...DEFAULT_ELO, variant: 'short-deck' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
        'heads-up': { ...DEFAULT_ELO, variant: 'heads-up' as PokerVariant, gamesPlayed: 0, lastUpdated: 0 },
      },

      updateElo: (dimension, isCorrect, difficulty) => {
        // ELO 更新作用于当前活动变体（eloByVariant 单一事实源）
        const variant = get().activeVariant;
        const prev = get().eloByVariant[variant];
        const oldOverall = prev.overall;
        const newElo = applyEloChange(prev, dimension, isCorrect, difficulty);
        const rankUp = checkRankUp(oldOverall, newElo.overall);
        set({
          eloByVariant: { ...get().eloByVariant, [variant]: { ...newElo, variant } },
          // 仅在发生升段时覆盖事件；未升段保留现值，避免会话中后续答题
          // 把尚未展示的升段庆祝事件清零（由 clearEloRankUp 在弹窗关闭后清除）
          eloRankUp: rankUp.isUp
            ? { from: getRankForScore(oldOverall), to: rankUp.newRank! }
            : get().eloRankUp,
        });
      },

      resetElo: () =>
        // 重置 standard 变体 ELO（gamesPlayed 清零；eloByVariant 单一事实源）
        set({
          eloByVariant: {
            ...get().eloByVariant,
            standard: { ...DEFAULT_ELO, variant: 'standard' as PokerVariant, lastUpdated: Date.now() },
          },
          eloRankUp: null,
        }),

      clearEloRankUp: () => set({ eloRankUp: null }),

      syncEloFromAcademyAbility: (aa) => {
        // 仅当 ELO 尚未被答题更新过时才同步（避免覆盖已累积的进度）
        if (get().eloByVariant.standard.gamesPlayed > 0) return;
        if (!hasNonDefaultAbility(aa)) return;
        const synced = mapAcademyAbilityToElo(aa);
        // 同步初始 ELO 到 standard 变体（eloByVariant 单一事实源）
        set({
          eloByVariant: {
            ...get().eloByVariant,
            standard: { ...synced, variant: 'standard' as PokerVariant },
          },
        });
      },

      // ===== P2-1: 变体 ELO 查询与切换 =====
      switchActiveVariant: (variant) => set({ activeVariant: variant }),

      getVariantElo: (variant, dimension) => get().eloByVariant[variant][dimension],

      getAllVariantsRatings: () => get().eloByVariant,

      // ===== P1-4.3: 快速训练连续打卡（独立于 streak.currentStreak） =====
      quickDrillStreak: 0,
      lastQuickDrillDate: null,
      quickDrillBest: null,

      recordQuickDrillCompletion: () => {
        const today = getTodayString();
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

      submitQuickDrillResult: ({ score, accuracy, timeTaken }) => {
        const previousBest = get().quickDrillBest;
        const isNewRecord = !previousBest || score > previousBest.bestScore;
        if (isNewRecord) {
          set({
            quickDrillBest: {
              bestScore: score,
              bestAccuracy: accuracy,
              bestTime: timeTaken,
              achievedAt: Date.now(),
            },
          });
        }
        return { isNewRecord, previousBest };
      },

      // ===== P2-4: 导师角色人格化 =====
      mentorStyle: DEFAULT_MENTOR,
      setMentorStyle: (style) => set({ mentorStyle: style }),

      // ===== P2-5: 情绪管理模块 =====
      emotion: { ...DEFAULT_EMOTION_STATE },

      setTodayMood: (mood) => {
        const today = getTodayString();
        set((state) => ({
          emotion: {
            ...state.emotion,
            todayMood: mood,
            moodDate: today,
          },
        }));
      },

      recordAnswer: (isCorrect) => {
        const today = getTodayString();
        const prev = get().emotion;

        // 跨日重置：如果 dailyQuestionsDate 不是今天，先重置计数器（含连续答错数）
        let dailyCorrect = prev.dailyCorrect;
        let dailyTotal = prev.dailyTotal;
        let dailyQuestionsAnswered = prev.dailyQuestionsAnswered;
        let prevConsecutiveWrong = prev.consecutiveWrongCount;
        if (prev.dailyQuestionsDate !== today) {
          dailyCorrect = 0;
          dailyTotal = 0;
          dailyQuestionsAnswered = 0;
          prevConsecutiveWrong = 0;
        }

        // 更新计数器
        dailyTotal += 1;
        dailyQuestionsAnswered += 1;
        if (isCorrect) {
          dailyCorrect += 1;
        }

        // 更新连续答错数（跨日从 0 起算，昨日的连错不延续到今天）
        const consecutiveWrongCount = isCorrect ? 0 : prevConsecutiveWrong + 1;

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
        // PROG-10 修复：当日答题数过少（<3 题）时跳过下风期判断，
        // 避免单题剧烈波动把当日 accuracy 拉低造成误判噪声
        if (prev.dailyQuestionsAnswered < 3) {
          return prev.isDownswing;
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
        const today = getTodayString();
        set((state) => ({
          emotion: {
            ...state.emotion,
            dailyQuestionsAnswered: 0,
            dailyQuestionsDate: today,
            dailyCorrect: 0,
            dailyTotal: 0,
            consecutiveWrongCount: 0,
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

      // ===== 学习焦点模式（§13.6.2）=====
      focusModule: null,
      setFocusModule: (module) => set({ focusModule: module }),

      checkAchievements: async () => {
        // 此函数由 initProgressStore（store.bootstrap.ts）中的 debounce 包装
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
          // PROG-13 修复：并发安全 —— 函数式更新中过滤已存在的成就，
          // 避免 async 窗口内重复调用时同一成就被重复解锁/重复发奖
          set((s) => {
            const existing = new Set(s.unlockedAchievements);
            const dedupNew = newUnlocked.filter((id) => !existing.has(id));
            if (dedupNew.length === 0) return s;
            const dates = Object.fromEntries(
              dedupNew.map((id) => [id, newDates[id] ?? Date.now()]),
            );
            return {
              unlockedAchievements: [...s.unlockedAchievements, ...dedupNew],
              achievementUnlockDates: { ...s.achievementUnlockDates, ...dates },
            };
          });
          if (freezeReward > 0) {
            get().awardStreakFreeze(freezeReward);
          }
        }
      },
    }),
    {
      name: 'poker-training-progress',
      version: 15,
      migrate: (persistedState: unknown, fromVersion: number) => {
        // 兼容老数据：顶层 lastTrainingDate (number 时间戳) 已在 v2 迁移中并入 streak。
        // 表驱动调度：MIGRATIONS[i] 对应 v(i) → v(i+1)（即原 if (fromVersion < i+1) 段），
        // 从 fromVersion 起顺序执行到数组末尾，与线性 if 链行为完全等价。
        const next = (persistedState as Record<string, unknown>) ?? {};
        for (let v = fromVersion; v < MIGRATIONS.length; v++) {
          MIGRATIONS[v]!(next);
        }
        return next as unknown as ProgressStore;
      },
      // P2-01 阶段 A：records 外迁 IndexedDB —— 排除在 localStorage 之外，
      // 避免无上限 records 数组导致每次 set() 全量 JSON.stringify 阻塞主线程。
      // records 持久化由 addRecord 等 action 的 side-effect 统一写入 recordDatabase。
      partialize: (state) => {
        const { records, ...rest } = state;
        return rest as Partial<ProgressStore>;
      },
      // 启动时（hydration 完成后）兜底清洗历史遗留的 GTO 标签中文"决策"后缀。
      // 不依赖 version migrate 的触发时机，确保任何时期写入的脏 label 都被清理。
      // 🔍 P3.4: 灰度观察 - 添加监控计数器（开发环境），用于判断是否需要完全删除此逻辑
      // 建议观察周期：2-3 个 release cycle（约 2-3 个月）。命中率为 0 → 可安全删除。
      onRehydrateStorage: () => (state) => {
        const items = state?.reviewItems;
        if (!items || items.length === 0) return;
        const dirty = items.some((item) => item.label?.endsWith('决策'));
        if (!dirty) return;
        
        // 🔍 监控计数（仅开发环境输出）
        if (import.meta.env.DEV) {
          console.warn('[ProgressStore] P3.4 监控：检测到需要清洗的脏 label:', items.filter(i => i.label?.endsWith('决策')).length, '项');
          // TODO: 上报埋点到监控系统（生产环境替换为 analytics.track()）
        }
        
        useProgressStore.setState({
          reviewItems: items.map((item) =>
            item.label?.endsWith('决策')
              ? { ...item, label: sanitizeReviewLabel(item.label) }
              : item,
          ),
        });
      },
    }
  )
);

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
      // “完成 Level N”成就：该级全部课程完成（含 L4 拆分后的 4A/4B 节点），
      // 而非仅完成 1 课；判定逻辑由 academy 注册的数据源提供（依赖倒置）
      const level = condition.level;
      return getAchievementSources().some((s) => s.isLevelLessonsCompleted(level));
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
      // 以当前活动变体的 ELO 为判定源（eloByVariant 单一事实源）
      return state.eloByVariant[state.activeVariant].overall >= condition.minScore;

    case 'certification': {
      for (const source of getAchievementSources()) {
        const certs = source.getCertifications();
        if (condition.level === 0) {
          if (Object.values(certs).some((c) => c?.certifiedAt)) return true;
        } else if (certs[condition.level]?.certifiedAt) {
          return true;
        }
      }
      return false;
    }

    case 'allCertifications': {
      // 全部等级均需认证（区别于 certification level=0 的“任意认证”）
      return getAchievementSources().some((s) => s.areAllLevelsCertified());
    }

    case 'completeTrack': {
      // 按 trackId 精确判定轨道全部课程完成（'any' = 任一非空轨道），
      // 替代旧版“完成 10 课即算”的粗糙估算
      return getAchievementSources().some((s) => s.isTrackCompleted(condition.trackId));
    }

    case 'firstPuzzle': {
      return getAchievementSources().some((s) => s.hasPuzzleHistory?.() ?? false);
    }

    case 'firstDailyPuzzle': {
      return getAchievementSources().some((s) => s.hasCompletedDailyPuzzle?.() ?? false);
    }

    // 理论学院（2026-07）：完成章节数达标
    case 'theoryChapters': {
      // 廉价短路：仅在理论模块产生过训练记录时才查询注册数据源，
      // 避免任意模块训练完成后的成就检查都触发理论数据读取
      if (!state.records.some((r) => r.module === 'theory-academy')) return false;
      return getAchievementSources().some(
        (s) => (s.getCompletedChapters?.() ?? []).length >= condition.count
      );
    }

    // 理论学院（2026-07）：前 N 个 Level（t1..tN）全部章节完成
    case 'theoryLevel': {
      // 廉价短路：同 theoryChapters，理论模块无记录时直接返回 false
      if (!state.records.some((r) => r.module === 'theory-academy')) return false;
      return getAchievementSources().some(
        (s) => s.isTheoryLevelFullyCompleted?.(condition.level) ?? false
      );
    }

    case 'allAchievements': {
      // 从成就数据源派生非 meta 总数，避免硬编码阈值随成就增减而漂移
      const nonMetaTotal = ACHIEVEMENTS.filter((a) => a.id !== 'all-achievements').length;
      const unlockedNonMeta = state.unlockedAchievements.filter((id) => id !== 'all-achievements');
      return unlockedNonMeta.length >= nonMetaTotal;
    }

    default:
      return false;
  }
}

// ===== 冻结卡碎片：概率获取辅助函数 =====
// 每日最多获得 2 个碎片，跨日自动重置计数器
function tryEarnFragment(probability: number) {
  const state = useProgressStore.getState();
  const today = getTodayString();

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

