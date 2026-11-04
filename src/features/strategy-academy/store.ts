import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AcademyProgress,
  BasicsProgress,
  PracticeResult,
  AdaptiveConfig,
  QuestionDifficulty,
  DailyPlan,
  LevelCertification,
  LessonAttemptRecord,
  CertificationAttemptPayload,
  CertificationAttemptResult,
  CertificationState,
  PlacementState,
  CheckpointRecord,
  LessonNote,
} from './types';
import {
  findLevelSummaryById,
  getLevelNumbers,
  getLevelSummaries,
  getLevelSummariesByNumber,
  isLevelEntryUnlockedByCompleted,
} from './utils/academyMeta';
import {
  REQUIRED_ACCURACY,
  areAllCertificationsValid,
  evaluateCertificationAttempt,
  isCertificationValid,
  resolveCertificationState,
} from './utils/certification';
import {
  initialBasicsProgress,
  initialProgress,
} from './utils/initialState';
import {
  mergePlacement,
  nextCheckpointRecord,
  nextLessonAttemptRecord,
  toggleBookmark,
  upsertLessonNote,
} from './utils/p2State';
import {
  areAllLessonsCompleted,
  computeLessonProgress,
  isTrackComplete,
} from './utils/academyGates';
import { migrateStrategyAcademyState } from './utils/persistMigrate';

export { REQUIRED_ACCURACY };
export { MAX_LESSON_NOTE_LENGTH } from './utils/p2State';
import { LEARNING_TRACKS } from './data/learningTracks';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { isDebugUnlockActive } from '@/shared/stores/debugMode';
import { useProgressStore } from '@/features/progress/store';
import { DEFAULT_ADAPTIVE_CONFIG } from './utils/adaptiveDifficulty';
import { generateDailyPlan, isDailyPlanFresh } from './utils/dailyPlan';
import type { PokerVariant } from '@/shared/types/elo';
import { DEFAULT_VARIANT } from '@/shared/types/elo';


interface RecentPracticeResult {
  isCorrect: boolean;
  timeTaken: number;
  difficulty: QuestionDifficulty;
}

interface AcademyStore {
  progress: AcademyProgress;
  practiceResults: PracticeResult[];
  basicsProgress: BasicsProgress;
  adaptiveConfig: AdaptiveConfig;
  recentPracticeResults: RecentPracticeResult[];
  dailyPlan: DailyPlan | null;
  certifications: Record<number, LevelCertification>;
  /** 课后尝试记录（首次成绩计掌握度/ELO，重考只更新 best/last） */
  lessonAttempts: Record<string, LessonAttemptRecord>;
  /** 策略定位测评（只放宽解锁，不写完成态） */
  placement: PlacementState | null;
  /** Level Checkpoint 形成性成绩（不发证、不解锁） */
  checkpoints: Record<number, CheckpointRecord>;
  /** 课时书签（纯阅读辅助） */
  bookmarkedLessons: string[];
  /** 课时笔记（纯文本，上限 MAX_LESSON_NOTE_LENGTH） */
  lessonNotes: Record<string, LessonNote>;
  activeTrackId: string | null;
  /** P2 变体支持：当前选中的游戏变体上下文（默认 standard） */
  activeVariant: PokerVariant;
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
  /** 记录一次实战练习结果（仅供自适应难度窗口消费，cap 50） */
  recordPracticeResult: (result: RecentPracticeResult) => void;
  setAdaptiveConfig: (config: Partial<AdaptiveConfig>) => void;
  // 新增：每日训练计划（options.force 为用户显式刷新意图，绕过同日新鲜度守卫）
  refreshDailyPlan: (reviewQueue?: string[], options?: { force?: boolean }) => void;
  // 新增：级别认证
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
  /** 记录一次课后尝试（含掌握度口径）；返回是否首次 */
  recordLessonAttempt: (
    lessonId: string,
    payload: { score: number; correct: number; total: number },
  ) => { isFirstAttempt: boolean };
  getLessonAttempt: (lessonId: string) => LessonAttemptRecord | undefined;
  /** 记录定位测评：creditLevels 取并集，不写 completedLessons */
  recordPlacement: (input: {
    recommendedLevelId: string;
    creditLevels: string[];
    correct: number;
    total: number;
  }) => void;
  /** 记录 Checkpoint 成绩（仅持久化；ELO/SRS 由页面负责） */
  recordCheckpointAttempt: (
    level: number,
    payload: { score: number; questionIds: string[] },
  ) => { isFirstAttempt: boolean };
  /** 课时书签 toggle（幂等） */
  toggleLessonBookmark: (lessonId: string) => void;
  /** 保存课时笔记；空文本即删除；超过上限截断 */
  saveLessonNote: (lessonId: string, text: string) => void;
  /** 认证状态（锁定/可考/冷却/有效/临期/过期） */
  getCertificationState: (level: number) => CertificationState;
  /** 认证提交（标准变体、完成门禁、冷却、有效期内不可重考） */
  submitCertificationAttempt: (
    level: number,
    payload: CertificationAttemptPayload,
  ) => CertificationAttemptResult;
  /** 获取课程进步数据（首次得分、最近得分、提升幅度） */
  getProgressForLesson: (lessonId: string) => { first: number; last: number; improvement: number } | null;
}

export const useAcademyStore = create<AcademyStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress,
      practiceResults: [],
      basicsProgress: initialBasicsProgress,
      adaptiveConfig: DEFAULT_ADAPTIVE_CONFIG,
      recentPracticeResults: [],
      dailyPlan: null,
      certifications: {},
      lessonAttempts: {},
      placement: null,
      checkpoints: {},
      bookmarkedLessons: [],
      lessonNotes: {},
      activeTrackId: null,
      activeVariant: DEFAULT_VARIANT,

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
      // 包括：练习明细 / 认证记录 / 课后尝试 / 每日计划 / 学习轨道 / 自适应配置。
      resetProgress: () =>
        set({
          progress: { ...initialProgress },
          practiceResults: [],
          basicsProgress: { ...initialBasicsProgress },
          adaptiveConfig: DEFAULT_ADAPTIVE_CONFIG,
          recentPracticeResults: [],
          dailyPlan: null,
          certifications: {},
          lessonAttempts: {},
          placement: null,
          checkpoints: {},
          bookmarkedLessons: [],
          lessonNotes: {},
          activeTrackId: null,
        }),

      isLevelUnlocked: (level) => {
        if (isDebugUnlockActive()) return true;
        const entries = getLevelSummaries().filter(
          (entry) => entry.level === level && typeof entry.id === 'string',
        );
        return entries.length > 0 && entries.every((entry) => get().isLevelEntryUnlocked(entry.id!));
      },

      // P0 修复（审计 1.1）：按 LevelInfo 条目判定解锁，消除 l4a/l4b 同为 level:4 时
      // isLevelUnlocked(4) “任一条目满足即解锁”导致的 4B 门禁旁路
      isLevelEntryUnlocked: (levelId) => {
        if (isDebugUnlockActive()) return true; // 调试解锁：解除全部 Level 条目门禁
        const levelInfo = findLevelSummaryById(levelId);
        if (!levelInfo) return false;
        return isLevelEntryUnlockedByCompleted(
          levelInfo,
          get().basicsProgress.completed,
          get().progress.completedLessons,
          get().placement?.creditLevels ?? [],
        );
      },

      getLevelProgress: (level) =>
        computeLessonProgress(
          getLevelSummariesByNumber(level).flatMap((entry) => entry.lessons),
          get().progress.completedLessons,
        ),

      getTotalProgress: () =>
        computeLessonProgress(
          getLevelSummaries().flatMap((entry) => entry.lessons),
          get().progress.completedLessons,
        ),

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

      recordPracticeResult: (result) =>
        set((state) => ({
          recentPracticeResults: [...state.recentPracticeResults, result].slice(-50),
        })),

      setAdaptiveConfig: (config) =>
        set((state) => ({
          adaptiveConfig: { ...state.adaptiveConfig, ...config },
        })),

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
            useProgressStore.getState().eloByVariant.standard,
            reviewQueue
          );
          return { dailyPlan: plan };
        }),

      isCertified: (level) => isCertificationValid(get().certifications[level]),

      isLevelLessonsCompleted: (level) =>
        areAllLessonsCompleted(
          getLevelSummariesByNumber(level).flatMap((entry) => entry.lessons),
          get().progress.completedLessons,
        ),

      areAllLevelsCertified: () =>
        areAllCertificationsValid(get().certifications, getLevelNumbers()),

      isTrackCompleted: (trackId) => {
        const completed = get().progress.completedLessons;
        if (trackId === 'any') {
          return LEARNING_TRACKS.some((track) => isTrackComplete(track, completed));
        }
        const track = LEARNING_TRACKS.find((item) => item.id === trackId);
        return track ? isTrackComplete(track, completed) : false;
      },
      // ===== 学习轨道 =====
      setActiveTrack: (trackId) => set({ activeTrackId: trackId }),
      // ===== P2 变体支持 =====
      switchVariant: (variant) => set({ activeVariant: variant }),

      recordLessonAttempt: (lessonId, payload) => {
        const isFirstAttempt = get().lessonAttempts[lessonId] === undefined;
        set((state) => ({
          lessonAttempts: {
            ...state.lessonAttempts,
            [lessonId]: nextLessonAttemptRecord(state.lessonAttempts[lessonId], payload),
          },
        }));
        return { isFirstAttempt };
      },

      getLessonAttempt: (lessonId) => get().lessonAttempts[lessonId],

      recordPlacement: (input) =>
        set({ placement: mergePlacement(get().placement, input) }),

      recordCheckpointAttempt: (level, payload) => {
        const { record, isFirstAttempt } = nextCheckpointRecord(
          get().checkpoints[level],
          payload,
        );
        set((state) => ({
          checkpoints: { ...state.checkpoints, [level]: record },
        }));
        return { isFirstAttempt };
      },

      toggleLessonBookmark: (lessonId) =>
        set((state) => ({
          bookmarkedLessons: toggleBookmark(state.bookmarkedLessons, lessonId),
        })),

      saveLessonNote: (lessonId, text) =>
        set((state) => ({
          lessonNotes: upsertLessonNote(state.lessonNotes, lessonId, text),
        })),

      getCertificationState: (level) =>
        resolveCertificationState({
          activeVariant: get().activeVariant,
          isLevelCompleted: get().isLevelLessonsCompleted(level),
          cert: get().certifications[level],
        }),

      submitCertificationAttempt: (level, payload) => {
        const { result, nextCert } = evaluateCertificationAttempt({
          level,
          payload,
          activeVariant: get().activeVariant,
          isLevelCompleted: get().isLevelLessonsCompleted(level),
          cert: get().certifications[level],
        });
        if (nextCert) {
          set({ certifications: { ...get().certifications, [level]: nextCert } });
        }
        return result;
      },

      getProgressForLesson: (lessonId) => {
        const attempt = get().lessonAttempts[lessonId];
        if (!attempt) return null;
        return {
          first: attempt.firstScore,
          last: attempt.lastScore,
          improvement: attempt.lastScore - attempt.firstScore,
        };
      },
    }),
    {
      name: 'strategy-academy-progress',
      version: 8,
      migrate: (persistedState: unknown, fromVersion: number) =>
        migrateStrategyAcademyState(persistedState, fromVersion) as AcademyStore,
    }
  )
);
