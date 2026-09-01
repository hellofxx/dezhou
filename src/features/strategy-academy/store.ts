import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AcademyProgress, BasicsProgress, PracticeResult, AbilityAssessment, AdaptiveConfig, QuestionDifficulty, DailyPlan, LevelCertification } from './types';
import { LEVELS } from './data/courses';
import { LEARNING_TRACKS } from './data/learningTracks';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { isDebugUnlockActive } from '@/shared/stores/debugMode';
import { DEFAULT_ADAPTIVE_CONFIG, updateAbilityScore } from './utils/adaptiveDifficulty';
import { generateDailyPlan, isDailyPlanFresh } from './utils/dailyPlan';
import type { PokerVariant } from '@/shared/types/elo';
import { DEFAULT_VARIANT } from '@/shared/types/elo';

/** 级别认证通过基准正确率（%）：store 判定与 LevelCertification 组件展示/判定的单一事实源 */
export const REQUIRED_ACCURACY = 70;
/** 认证有效期（毫秒）：30 天，每次通过认证从当次通过时间起算 */
const CERT_VALIDITY_MS = 30 * 24 * 60 * 60 * 1000;

const initialProgress: AcademyProgress = {
  completedLessons: [],
  quizScores: {},
  currentLesson: null,
  startedAt: 0,
  completedUnits: {},
};

const initialBasicsProgress: BasicsProgress = {
  currentStep: 0,
  completed: false,
};

const initialAbilityAssessment: AbilityAssessment = {
  rangeKnowledge: 50,
  oddsCalculation: 50,
  gtoUnderstanding: 50,
  positionalPlay: 50,
  emotionalControl: 50,
  lastUpdated: Date.now(),
};

interface RecentPracticeResult {
  isCorrect: boolean;
  timeTaken: number;
  difficulty: QuestionDifficulty;
}

interface AcademyStore {
  progress: AcademyProgress;
  practiceResults: PracticeResult[];
  basicsProgress: BasicsProgress;
  abilityAssessment: AbilityAssessment;
  adaptiveConfig: AdaptiveConfig;
  recentPracticeResults: RecentPracticeResult[];
  dailyPlan: DailyPlan | null;
  certifications: Record<number, LevelCertification>;
  activeTrackId: string | null;
  /** P2 变体支持：当前选中的游戏变体上下文（默认 standard） */
  activeVariant: PokerVariant;
  /** 课程首次得分（lessonId → 0-100） */
  firstAttemptScores: Record<string, number>;
  /** 课程最近得分（lessonId → 0-100） */
  lastAttemptScores: Record<string, number>;
  startLesson: (lessonId: string) => void;
  /** 标记课程小节完成（lessonId → unitId），幂等：重复标记同一 unit 不重复计数（P4） */
  markUnitCompleted: (lessonId: string, unitId: string) => void;
  completeLesson: (lessonId: string) => void;
  recordQuizScore: (lessonId: string, score: number) => void;
  recordPracticeScore: (result: PracticeResult) => void;
  resetProgress: () => void;
  isLevelUnlocked: (level: number) => boolean;
  /** 按 LevelInfo.id（如 'l4a'/'l4b'）判断单个 Level 条目是否解锁，区分同 level 数字的 4A/4B */
  isLevelEntryUnlocked: (levelId: string) => boolean;
  getLevelProgress: (level: number) => number;
  getTotalProgress: () => number;
  isCompleted: (lessonId: string) => boolean;
  updateBasicsStep: (step: number) => void;
  completeBasics: () => void;
  resetBasics: () => void;
  updateAbility: (result: RecentPracticeResult) => void;
  setAdaptiveConfig: (config: Partial<AdaptiveConfig>) => void;
  resetAbility: () => void;
  // 新增：每日训练计划（options.force 为用户显式刷新意图，绕过同日新鲜度守卫）
  refreshDailyPlan: (reviewQueue?: string[], options?: { force?: boolean }) => void;
  // 新增：级别认证
  attemptCertification: (level: number, score: number) => void;
  isCertified: (level: number) => boolean;
  /** 某 level 数字的全部课程是否已完成（L4 含 4A/4B 两个节点；供成就系统判定） */
  isLevelLessonsCompleted: (level: number) => boolean;
  /** 全部等级是否均已认证（供"全部等级认证"成就判定） */
  areAllLevelsCertified: () => boolean;
  /** 学习轨道是否全部课程完成；'any' 表示任一非空轨道完成（供成就系统判定） */
  isTrackCompleted: (trackId: string) => boolean;
  // 新增：学习轨道
  setActiveTrack: (trackId: string | null) => void;
  /** P2 变体支持：切换当前学习变体上下文 */
  switchVariant: (variant: PokerVariant) => void;
  /** 记录课程尝试得分（首次写入 firstAttemptScores，始终更新 lastAttemptScores） */
  recordAttemptScore: (lessonId: string, score: number) => void;
  /** 获取课程进步数据（首次得分、最近得分、提升幅度） */
  getProgressForLesson: (lessonId: string) => { first: number; last: number; improvement: number } | null;
}

export const useAcademyStore = create<AcademyStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      practiceResults: [],
      basicsProgress: initialBasicsProgress,
      abilityAssessment: initialAbilityAssessment,
      adaptiveConfig: DEFAULT_ADAPTIVE_CONFIG,
      recentPracticeResults: [],
      dailyPlan: null,
      certifications: {},
      activeTrackId: null,
      activeVariant: DEFAULT_VARIANT,
      firstAttemptScores: {},
      lastAttemptScores: {},

      startLesson: (lessonId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            currentLesson: lessonId,
            startedAt: state.progress.startedAt || Date.now(),
          },
        })),

      markUnitCompleted: (lessonId, unitId) =>
        set((state) => {
          const current = state.progress.completedUnits[lessonId] ?? [];
          if (current.includes(unitId)) return state; // 幂等：重复标记不计数
          return {
            progress: {
              ...state.progress,
              completedUnits: {
                ...state.progress.completedUnits,
                [lessonId]: [...current, unitId],
              },
            },
          };
        }),

      completeLesson: (lessonId) =>
        set((state) => ({
          progress: {
            ...state.progress,
            completedLessons: state.progress.completedLessons.includes(lessonId)
              ? state.progress.completedLessons
              : [...state.progress.completedLessons, lessonId],
            currentLesson: null,
          },
        })),

      recordQuizScore: (lessonId, score) =>
        set((state) => ({
          progress: {
            ...state.progress,
            quizScores: { ...state.progress.quizScores, [lessonId]: score },
          },
        })),

      recordPracticeScore: (result) => {
        // P1E-05（专批 B）：逐题作答明细 answers 仅供完成回调侧消费（SRS 回写），
        // 入库前剥离，保持 practiceResults 持久化负载与历史形状不变
        const { answers: _answers, ...persistable } = result;
        void _answers;
        // 先同步提交状态（纯状态归约，不在 updater 内做副作用）
        set((state) => ({
          practiceResults: [...state.practiceResults, persistable].slice(-200),
          progress: {
            ...state.progress,
            quizScores: {
              ...state.progress.quizScores,
              [`practice-${result.lessonId}`]: Math.round(result.accuracy * 100),
            },
          },
        }));
        // 状态提交后再发事件：避免 updater 被重放（StrictMode 等）导致重复发事件，
        // 也保证订阅方同步读取时看到的是含本次结果的最新状态（对齐 theory-academy 基准写法）
        trainingEvents.emit({
          id: `academy-practice-${result.lessonId}-${Date.now()}`,
          module: 'strategy-academy',
          mode: 'practice',
          result: {
            sessionId: `academy-practice-${result.lessonId}`,
            module: 'strategy-academy',
            totalQuestions: result.totalQuestions,
            correctAnswers: result.correctAnswers,
            accuracy: result.accuracy,
            averageTime: result.averageTime * 1000, // PracticeResult 单位为秒，转毫秒（与 progress 各模块一致）
            timestamp: result.timestamp,
            details: [],
          },
          createdAt: Date.now(),
        });
      },

      // ACAD-08：重置进度时联动清理由进度派生的关联状态，避免 UI 残留旧数据。
      // 包括：练习明细 / 认证记录 / 首末次得分 / 每日计划 / 学习轨道 / 能力评估与自适应配置。
      resetProgress: () =>
        set({
          progress: { ...initialProgress },
          practiceResults: [],
          basicsProgress: { ...initialBasicsProgress },
          abilityAssessment: { ...initialAbilityAssessment, lastUpdated: Date.now() },
          adaptiveConfig: DEFAULT_ADAPTIVE_CONFIG,
          recentPracticeResults: [],
          dailyPlan: null,
          certifications: {},
          activeTrackId: null,
          firstAttemptScores: {},
          lastAttemptScores: {},
        }),

      isLevelUnlocked: (level) => {
        if (isDebugUnlockActive()) return true; // 调试解锁：解除全部 Level 门禁
        // ACAD-07：委托逐条目判定，且要求同 level 全部条目都满足才解锁，
        // 消除旧「任一满足即 return true」的 || 旁路（L4A/L4B 同为 level:4 时 4B 被误放行）
        const entries = LEVELS.filter((l) => l.level === level && typeof l.id === 'string');
        if (entries.length === 0) return false;
        return entries.every((entry) => get().isLevelEntryUnlocked(entry.id!));
      },

      // P0 修复（审计 1.1）：按 LevelInfo 条目判定解锁，消除 l4a/l4b 同为 level:4 时
      // isLevelUnlocked(4) “任一条目满足即解锁”导致的 4B 门禁旁路
      isLevelEntryUnlocked: (levelId) => {
        if (isDebugUnlockActive()) return true; // 调试解锁：解除全部 Level 条目门禁
        const idx = LEVELS.findIndex((l) => l.id === levelId);
        const levelInfo = idx >= 0 ? LEVELS[idx] : undefined;
        if (!levelInfo) return false;
        if (levelInfo.level <= 1) return get().basicsProgress.completed;
        const { completedLessons } = get().progress;

        if (levelInfo.prerequisiteLevelIds && levelInfo.prerequisiteLevelIds.length > 0) {
          return levelInfo.prerequisiteLevelIds.every((prereqId) => {
            const prereqLevel = LEVELS.find((l) => l.id === prereqId);
            if (!prereqLevel) return false;
            return prereqLevel.lessons.every((l) => completedLessons.includes(l.id));
          });
        }
        // 回退：依赖前一个 LEVELS 条目全部完成
        return idx === 0
          ? get().basicsProgress.completed
          : LEVELS[idx - 1]?.lessons.every((l) => completedLessons.includes(l.id)) ?? false;
      },

      getLevelProgress: (level) => {
        // 合并同一 level 的所有条目（如 L4A + L4B）
        const entries = LEVELS.filter((l) => l.level === level);
        const allLessons = entries.flatMap((l) => l.lessons);
        if (allLessons.length === 0) return 0;
        const { completedLessons } = get().progress;
        const completed = allLessons.filter((l) => completedLessons.includes(l.id)).length;
        return Math.round((completed / allLessons.length) * 100);
      },

      getTotalProgress: () => {
        const allLessons = LEVELS.flatMap((l) => l.lessons);
        if (allLessons.length === 0) return 0;
        const { completedLessons } = get().progress;
        const completed = allLessons.filter((l) => completedLessons.includes(l.id)).length;
        return Math.round((completed / allLessons.length) * 100);
      },

      isCompleted: (lessonId) => get().progress.completedLessons.includes(lessonId),

      updateBasicsStep: (step) =>
        set((state) => ({
          basicsProgress: { ...state.basicsProgress, currentStep: step },
        })),

      completeBasics: () => {
        // 先同步提交状态（纯状态归约，不在 updater 内做副作用）
        set((state) => ({
          basicsProgress: {
            ...state.basicsProgress,
            completed: true,
            completedAt: Date.now(),
          },
        }));
        // 状态提交后再发事件：避免 updater 被重放（StrictMode 等）导致重复发事件，
        // 也保证订阅方同步读取时看到的是 basics 已完成的最新状态（对齐 theory-academy 基准写法）
        trainingEvents.emit({
          id: `academy-basics-${Date.now()}`,
          module: 'strategy-academy',
          mode: 'basics',
          result: {
            sessionId: 'academy-basics',
            module: 'strategy-academy',
            totalQuestions: 0,
            correctAnswers: 0,
            accuracy: 1,
            averageTime: 0,
            timestamp: Date.now(),
            details: [],
          },
          createdAt: Date.now(),
        });
      },

      resetBasics: () =>
        set({ basicsProgress: { ...initialBasicsProgress } }),

      updateAbility: (result) =>
        set((state) => {
          const { isCorrect, timeTaken, difficulty } = result;
          const assessment = state.abilityAssessment;
          // 根据难度更新不同维度的能力评分
          const newAssessment: AbilityAssessment = {
            rangeKnowledge: updateAbilityScore(assessment.rangeKnowledge, isCorrect, timeTaken, difficulty),
            oddsCalculation: updateAbilityScore(assessment.oddsCalculation, isCorrect, timeTaken, difficulty),
            gtoUnderstanding: updateAbilityScore(assessment.gtoUnderstanding, isCorrect, timeTaken, difficulty),
            positionalPlay: updateAbilityScore(assessment.positionalPlay, isCorrect, timeTaken, difficulty),
            emotionalControl: updateAbilityScore(assessment.emotionalControl, isCorrect, timeTaken, difficulty),
            lastUpdated: Date.now(),
          };
          const newRecentResults = [...state.recentPracticeResults, result].slice(-50);
          return {
            abilityAssessment: newAssessment,
            recentPracticeResults: newRecentResults,
          };
        }),

      setAdaptiveConfig: (config) =>
        set((state) => ({
          adaptiveConfig: { ...state.adaptiveConfig, ...config },
        })),

      resetAbility: () =>
        set({
          abilityAssessment: { ...initialAbilityAssessment, lastUpdated: Date.now() },
          recentPracticeResults: [],
        }),

      // ===== 每日训练计划 =====
      refreshDailyPlan: (reviewQueue = [], options) =>
        set((state) => {
          // 同日新鲜度守卫只约束自动/惰性生成入口（DailyPlanCard 挂载时的 refreshDailyPlan()）；
          // 用户显式点击刷新（options.force）属明确意图，绕过守卫强制重新生成 ——
          // BUG-ACA-006 修复：旧实现守卫一并拦截手动刷新按钮，当天点击完全无效
          if (
            !options?.force &&
            state.dailyPlan &&
            isDailyPlanFresh(state.dailyPlan.generatedAt)
          ) {
            return {};
          }
          const plan = generateDailyPlan(
            state.progress.completedLessons,
            state.abilityAssessment,
            reviewQueue
          );
          return { dailyPlan: plan };
        }),

      // ===== 级别认证 =====
      attemptCertification: (level, score) =>
        set((state) => {
          const existing = state.certifications[level];
          const levelEntries = LEVELS.filter((l) => l.level === level);

          // 任务 A: 动态题量算法
          const totalQuizQuestions = levelEntries.reduce(
            (sum, e) => sum + e.lessons.reduce((s, l) => s + l.quiz.length, 0),
            0
          );

          // 难度系数：L1=1.0, L2=1.1, ..., L8=1.8
          // ACAD-01 修复：数组补齐 8 个元素，L7/L8 不再回落 1.0
          const difficultyMultiplier = [1.0, 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8][level - 1] ?? 1.0;

          // 最终题量：min(总题池 × 难度系数，25)
          const questionCount = Math.min(Math.floor(totalQuizQuestions * difficultyMultiplier), 25);

          // 通过标准为固定基准（REQUIRED_ACCURACY，与组件展示口径单一事实源）。
          // 旧实现按考生分数动态抬升阈值（70%-71.4%）且组件展示 80%，双口径不一致已修复。
          const requiredAccuracy = REQUIRED_ACCURACY;
          const passed = score >= requiredAccuracy;

          const cert: LevelCertification = {
            level,
            requiredAccuracy,
            cooldownPeriod: 24, // 默认冷却 24 小时
            lastAttemptAt: Date.now(),
            questionCount,
            timeLimit: 0,
            attempts: (existing?.attempts ?? 0) + 1,
            bestScore: Math.max(existing?.bestScore ?? 0, score),
            certifiedAt: passed ? Date.now() : existing?.certifiedAt,
            // 有效期 30 天，每次通过认证从当次通过时间起算（修复：旧实现基于历史
            // validUntil 叠加 30 天，认证过期很久后重新通过会得到仍是过去时间的
            // validUntil，即"刚通过立即失效"）；未通过时保留既有有效期字段。
            validUntil: passed ? Date.now() + CERT_VALIDITY_MS : existing?.validUntil,
          };
          return {
            certifications: { ...state.certifications, [level]: cert },
          };
        }),

      isCertified: (level) => {
        const cert = get().certifications[level];
        if (!cert?.certifiedAt) return false;
        
        // 如果有有效期限且已过期，也需要重新认证
        if (cert.validUntil && Date.now() > cert.validUntil) {
          return false;
        }
        
        return true;
      },

      isLevelLessonsCompleted: (level) => {
        const completed = new Set(get().progress.completedLessons);
        // 同 level 数字可能对应多个节点（如 L4 拆为 4A/4B），全部课程都须完成
        const lessons = LEVELS.filter((l) => l.level === level).flatMap((l) => l.lessons);
        if (lessons.length === 0) return false;
        return lessons.every((lesson) => completed.has(lesson.id));
      },

      areAllLevelsCertified: () => {
        const certs = get().certifications;
        const levelNumbers = [...new Set(LEVELS.map((l) => l.level))];
        // ACAD-02 修复：校验 validUntil 过期（过期认证视为未达成）
        const now = Date.now();
        return levelNumbers.every((lv) => {
          const cert = certs[lv];
          if (!cert?.certifiedAt) return false;
          return cert.validUntil === undefined || cert.validUntil > now;
        });
      },

      isTrackCompleted: (trackId) => {
        const completed = new Set(get().progress.completedLessons);
        const isDone = (ids: readonly string[]): boolean =>
          ids.length > 0 && ids.every((id) => completed.has(id));
        if (trackId === 'any') {
          // 任一非空轨道全部完成（排除 lessonIds 为空的动态轨道）
          return LEARNING_TRACKS.some((t) => isDone(t.lessonIds));
        }
        const track = LEARNING_TRACKS.find((t) => t.id === trackId);
        return track ? isDone(track.lessonIds) : false;
      },

      // ===== 学习轨道 =====
      setActiveTrack: (trackId) => set({ activeTrackId: trackId }),

      // ===== P2 变体支持 =====
      switchVariant: (variant) => set({ activeVariant: variant }),

      // ===== 进步回放得分记录 =====
      recordAttemptScore: (lessonId, score) =>
        set((state) => {
          const firstScores = { ...state.firstAttemptScores };
          if (!(lessonId in firstScores)) {
            firstScores[lessonId] = score;
          }
          return {
            firstAttemptScores: firstScores,
            lastAttemptScores: { ...state.lastAttemptScores, [lessonId]: score },
          };
        }),

      getProgressForLesson: (lessonId) => {
        const { firstAttemptScores, lastAttemptScores } = get();
        const first = firstAttemptScores[lessonId];
        const last = lastAttemptScores[lessonId];
        if (first === undefined || last === undefined) return null;
        return { first, last, improvement: last - first };
      },
    }),
    {
      name: 'strategy-academy-progress',
      version: 5,
      migrate: (persistedState: unknown, fromVersion: number) => {
        const next = (persistedState ?? {}) as Partial<AcademyStore>;
        // v0 → v1：注入进步回放得分记录默认值
        if (fromVersion < 1) {
          if (!next.firstAttemptScores) {
            next.firstAttemptScores = {};
          }
          if (!next.lastAttemptScores) {
            next.lastAttemptScores = {};
          }
        }
        // v1 → v2：裁剪 practiceResults 至最近 200 条
        if (fromVersion < 2) {
          if (Array.isArray(next.practiceResults) && next.practiceResults.length > 200) {
            next.practiceResults = next.practiceResults.slice(-200);
          }
        }
        // v2 → v3：认证系统新增 cooldownPeriod/validUntil/lastAttemptAt
        if (fromVersion < 3) {
          const certs = (next.certifications as Record<number, LevelCertification>) ?? {};
          for (const level in certs) {
            const cert = certs[level];
            if (!cert) continue;
            cert.cooldownPeriod = cert.cooldownPeriod ?? 24;
            cert.lastAttemptAt = cert.lastAttemptAt ?? Date.now();
            // validUntil 保持可选，不设置默认值
          }
          next.certifications = certs;
        }
        // v3 → v4：新增小节完成记录 completedUnits（lessonId → 已完成 unit id 列表），
        // 老数据补默认空映射；已有 completedUnits 保持原值不被覆盖
        // 防御性合并：确保缺失 progress 字段时也能产出完整形状
        if (fromVersion < 4) {
          const progress = next.progress ?? ({} as AcademyProgress);
          next.progress = { ...initialProgress, ...progress, completedUnits: progress.completedUnits ?? {} };
        }
        // v4 → v5：P2 变体支持，新增 activeVariant 字段（默认 standard）
        if (fromVersion < 5) {
          if (!next.activeVariant) {
            next.activeVariant = DEFAULT_VARIANT;
          }
        }
        return next as AcademyStore;
      },
    }
  )
);
