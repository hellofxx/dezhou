// src/i18n/moduleRegistry.ts
// i18n 模块注册表：单一 translation 命名空间下的顶层 key 全集、core 清单、路由→模块分组映射、每语言动态加载器。
// 约定：模块文件 = locales/{zh,en}/<topKey>.json，注入时包裹 { [key]: data }，t('a.b.c') 调用路径不变。
// 本文件被 config.ts（core 静态）与 preload.ts（feature 动态）共享，是拆分架构的唯一契约源。

export type I18nLanguage = 'zh' | 'en';

/** 顶层翻译 key（= locales/{zh,en}/<key>.json 文件名），与拆分产物一一对应 */
export type I18nModuleKey =
  | 'academy'
  | 'achievements'
  | 'common'
  | 'dailyChallenge'
  | 'dashboard'
  | 'downswing'
  | 'drills'
  | 'elo'
  | 'feedback'
  | 'gto'
  | 'handHistory'
  | 'help'
  | 'leaderboard'
  | 'mentor'
  | 'mood'
  | 'nav'
  | 'onboarding'
  | 'potOdds'
  | 'progress'
  | 'puzzle'
  | 'quickDrill'
  | 'rangeTrainer'
  | 'rankUp'
  | 'review'
  | 'sessionLimit'
  | 'settings'
  | 'spacedRepetition'
  | 'streak'
  | 'theory'
  | 'tilt'
  | 'variant';

/**
 * 全部模块 key（satisfies 保证与 I18nModuleKey 一一对应，注册表完整性由 preload.test.ts 守卫）。
 * 模块必须是 CORE_MODULES 或 FEATURE_GROUPS 的引用面之一；无消费方的模块应删除，
 * 而非作为"保留模块"长期驻留（历史 7 个未消费模块已清理，见 docs/CHANGELOG.md）。
 */
export const ALL_MODULES = [
  'academy',
  'achievements',
  'common',
  'dailyChallenge',
  'dashboard',
  'downswing',
  'drills',
  'elo',
  'feedback',
  'gto',
  'handHistory',
  'help',
  'leaderboard',
  'mentor',
  'mood',
  'nav',
  'onboarding',
  'potOdds',
  'progress',
  'puzzle',
  'quickDrill',
  'rangeTrainer',
  'rankUp',
  'review',
  'sessionLimit',
  'settings',
  'spacedRepetition',
  'streak',
  'theory',
  'tilt',
  'variant',
] as const satisfies readonly I18nModuleKey[];

/**
 * 启动必需模块（config.ts 静态打包进初始 chunk）：
 * 布局/导航/全局挂载组件/共享反馈组件直接消费，任何路由都需要。
 * 修改本清单时，config.ts 的静态导入须同步增删（类型 satisfies 会强制校验）。
 */
export const CORE_MODULES = [
  'nav',
  'common',
  'dashboard',
  'academy',
  'theory',
  'variant',
  'tilt',
  'streak',
  'feedback',
] as const satisfies readonly I18nModuleKey[];

/**
 * 路由前缀 → 该路由渲染所需模块分组。
 * 子路由含动态参数（:sessionId 等），最长前缀优先匹配（见 routes.tsx 的 lazyPage 实现）。
 */
export const FEATURE_GROUPS = {
  // Dashboard 首页树：FeltArena/VariantEloOverview/FirstVisitBanner 消费 progress；
  // DailyChallenge/SpacedRepetitionPanel/DownswingAlert/MoodTracker 分别消费 dailyChallenge/spacedRepetition/downswing/mood；
  // RankUpCelebration/ReviewSession 由 Dashboard 渲染，分别消费 rankUp/review
  '/': ['dashboard', 'nav', 'achievements', 'progress', 'dailyChallenge', 'spacedRepetition', 'downswing', 'mood', 'rankUp', 'review'],
  // MoodTracker 实际由 Dashboard 渲染（settings 分组不含 mood；mood 归属 '/')
  '/settings': ['settings', 'mentor', 'sessionLimit', 'variant', 'streak'],
  '/leaderboard': ['leaderboard'],
  '/range-trainer/learn': ['rangeTrainer', 'common'],
  '/range-trainer/quiz': ['rangeTrainer', 'feedback'],
  '/range-trainer': ['rangeTrainer'],
  '/pot-odds/quiz': ['potOdds'],
  '/pot-odds': ['potOdds'],
  '/gto-simulator/session/:scenarioId': ['gto', 'feedback'],
  '/gto-simulator/result/:sessionId': ['gto', 'feedback'],
  '/gto-simulator': ['gto', 'feedback'],
  '/hand-history/:handId': ['handHistory'],
  '/hand-history/import': ['handHistory'],
  '/hand-history': ['handHistory', 'common'],
  '/progress/range': ['progress', 'common'],
  '/progress/gto': ['progress', 'common'],
  // ProgressPage 渲染 AchievementBadges（achievements）与 WeaknessAnalysis（elo）
  '/progress': ['progress', 'dashboard', 'common', 'achievements', 'elo'],
  '/academy/quick-drill': ['quickDrill', 'academy'],
  // BasicsIntro 仅消费 academy（basicsIntro.*），不渲染 drill 组件
  '/academy/basics': ['academy'],
  '/academy/concept-graph': ['academy'],
  '/academy/tracks': ['academy'],
  '/academy/certification/:level': ['academy'],
  // CourseView 渲染 DrillLessonRouter → 各 Drill 组件：Position/Outs/PotOdds/HandRanking 消费 drills，
  // OpponentDrill 额外消费 gto.setup.opponentProfile.*
  '/academy/lesson/:lessonId': ['academy', 'drills', 'gto'],
  // AcademyHome 仅消费 academy + variant（VariantToggle），quickDrill/drills 不在此页渲染
  '/academy': ['academy', 'variant'],
  // TheoryChapterView 渲染 PracticeBridgeCard 消费 academy（academy 属 core，启动已加载，此处列出以如实反映渲染树）
  '/theory/chapter/:chapterId': ['theory', 'academy'],
  '/theory': ['theory', 'variant'],
  // ThemeDrill/PuzzleRush/DailyPuzzle 渲染 PuzzleCard → PuzzleCardFeedback 消费 feedback
  '/puzzle/theme/:themeId': ['puzzle', 'feedback'],
  '/puzzle/rush': ['puzzle', 'feedback'],
  '/puzzle/daily': ['puzzle', 'feedback'],
  // PuzzleHome 不渲染 PuzzleCard（feedback 由子路由消费）
  '/puzzle': ['puzzle'],
  '/help/article/:articleId': ['help'],
  '/help': ['help'],
  '/onboarding': ['onboarding'],
} as const satisfies Record<string, readonly I18nModuleKey[]>;

type JsonBundle = () => Promise<{ default: Record<string, unknown> }>;

/** 每语言动态加载器：静态 import 字面量（Vite 按需拆分为独立 chunk，非运行时模板字符串） */
export const loadModule: Record<I18nLanguage, Record<I18nModuleKey, JsonBundle>> = {
  zh: {
    academy: () => import('./locales/zh/academy.json'),
    achievements: () => import('./locales/zh/achievements.json'),
    common: () => import('./locales/zh/common.json'),
    dailyChallenge: () => import('./locales/zh/dailyChallenge.json'),
    dashboard: () => import('./locales/zh/dashboard.json'),
    downswing: () => import('./locales/zh/downswing.json'),
    drills: () => import('./locales/zh/drills.json'),
    elo: () => import('./locales/zh/elo.json'),
    feedback: () => import('./locales/zh/feedback.json'),
    gto: () => import('./locales/zh/gto.json'),
    handHistory: () => import('./locales/zh/handHistory.json'),
    help: () => import('./locales/zh/help.json'),
    leaderboard: () => import('./locales/zh/leaderboard.json'),
    mentor: () => import('./locales/zh/mentor.json'),
    mood: () => import('./locales/zh/mood.json'),
    nav: () => import('./locales/zh/nav.json'),
    onboarding: () => import('./locales/zh/onboarding.json'),
    potOdds: () => import('./locales/zh/potOdds.json'),
    progress: () => import('./locales/zh/progress.json'),
    puzzle: () => import('./locales/zh/puzzle.json'),
    quickDrill: () => import('./locales/zh/quickDrill.json'),
    rangeTrainer: () => import('./locales/zh/rangeTrainer.json'),
    rankUp: () => import('./locales/zh/rankUp.json'),
    review: () => import('./locales/zh/review.json'),
    sessionLimit: () => import('./locales/zh/sessionLimit.json'),
    settings: () => import('./locales/zh/settings.json'),
    spacedRepetition: () => import('./locales/zh/spacedRepetition.json'),
    streak: () => import('./locales/zh/streak.json'),
    theory: () => import('./locales/zh/theory.json'),
    tilt: () => import('./locales/zh/tilt.json'),
    variant: () => import('./locales/zh/variant.json'),
  },
  en: {
    academy: () => import('./locales/en/academy.json'),
    achievements: () => import('./locales/en/achievements.json'),
    common: () => import('./locales/en/common.json'),
    dailyChallenge: () => import('./locales/en/dailyChallenge.json'),
    dashboard: () => import('./locales/en/dashboard.json'),
    downswing: () => import('./locales/en/downswing.json'),
    drills: () => import('./locales/en/drills.json'),
    elo: () => import('./locales/en/elo.json'),
    feedback: () => import('./locales/en/feedback.json'),
    gto: () => import('./locales/en/gto.json'),
    handHistory: () => import('./locales/en/handHistory.json'),
    help: () => import('./locales/en/help.json'),
    leaderboard: () => import('./locales/en/leaderboard.json'),
    mentor: () => import('./locales/en/mentor.json'),
    mood: () => import('./locales/en/mood.json'),
    nav: () => import('./locales/en/nav.json'),
    onboarding: () => import('./locales/en/onboarding.json'),
    potOdds: () => import('./locales/en/potOdds.json'),
    progress: () => import('./locales/en/progress.json'),
    puzzle: () => import('./locales/en/puzzle.json'),
    quickDrill: () => import('./locales/en/quickDrill.json'),
    rangeTrainer: () => import('./locales/en/rangeTrainer.json'),
    rankUp: () => import('./locales/en/rankUp.json'),
    review: () => import('./locales/en/review.json'),
    sessionLimit: () => import('./locales/en/sessionLimit.json'),
    settings: () => import('./locales/en/settings.json'),
    spacedRepetition: () => import('./locales/en/spacedRepetition.json'),
    streak: () => import('./locales/en/streak.json'),
    theory: () => import('./locales/en/theory.json'),
    tilt: () => import('./locales/en/tilt.json'),
    variant: () => import('./locales/en/variant.json'),
  },
};
