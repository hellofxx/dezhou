// src/i18n/moduleRegistry.ts
// i18n 模块注册表：单一 translation 命名空间下的顶层 key 全集、core 清单、路由→模块分组映射、每语言动态加载器。
// 约定：模块文件 = locales/{zh,en}/<topKey>.json，注入时包裹 { [key]: data }，t('a.b.c') 调用路径不变。
// 本文件被 config.ts（core 静态）与 preload.ts（feature 动态）共享，是拆分架构的唯一契约源。

export type I18nLanguage = 'zh' | 'en';

/** 顶层翻译 key（= locales/{zh,en}/<key>.json 文件名），与拆分产物一一对应 */
export type I18nModuleKey =
  | 'academy'
  | 'achievements'
  | 'adaptive'
  | 'app'
  | 'common'
  | 'dailyChallenge'
  | 'dailyPlan'
  | 'dashboard'
  | 'downswing'
  | 'drills'
  | 'elo'
  | 'feedback'
  | 'gameVariant'
  | 'gto'
  | 'handHistory'
  | 'help'
  | 'leaderboard'
  | 'localTrack'
  | 'mentor'
  | 'mood'
  | 'nav'
  | 'onboarding'
  | 'opponent'
  | 'opponentDrill'
  | 'potOdds'
  | 'progress'
  | 'puzzle'
  | 'quickDrill'
  | 'rangeTrainer'
  | 'rankUp'
  | 'review'
  | 'sessionLimit'
  | 'settings'
  | 'shortcuts'
  | 'shortDeck'
  | 'spacedRepetition'
  | 'streak'
  | 'theory'
  | 'tilt'
  | 'toast'
  | 'variant';

/** 全部模块 key（satisfies 保证与 I18nModuleKey 一一对应，注册表完整性由 preload.test.ts 守卫） */
export const ALL_MODULES = [
  'academy',
  'achievements',
  'adaptive',
  'app',
  'common',
  'dailyChallenge',
  'dailyPlan',
  'dashboard',
  'downswing',
  'drills',
  'elo',
  'feedback',
  'gameVariant',
  'gto',
  'handHistory',
  'help',
  'leaderboard',
  'localTrack',
  'mentor',
  'mood',
  'nav',
  'onboarding',
  'opponent',
  'opponentDrill',
  'potOdds',
  'progress',
  'puzzle',
  'quickDrill',
  'rangeTrainer',
  'rankUp',
  'review',
  'sessionLimit',
  'settings',
  'shortcuts',
  'shortDeck',
  'spacedRepetition',
  'streak',
  'theory',
  'tilt',
  'toast',
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
  'gameVariant',
  'tilt',
  'streak',
  'feedback',
] as const satisfies readonly I18nModuleKey[];

/**
 * 路由前缀 → 该路由渲染所需模块分组。
 * 子路由含动态参数（:sessionId 等），最长前缀优先匹配（见 routes.tsx 的 lazyPage 实现）。
 */
export const FEATURE_GROUPS = {
  '/': ['dashboard', 'nav', 'achievements'],
  '/settings': ['settings', 'mentor', 'sessionLimit', 'gameVariant', 'streak', 'mood'],
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
  '/progress': ['progress', 'dashboard', 'common'],
  '/academy/quick-drill': ['quickDrill', 'academy'],
  '/academy/basics': ['academy', 'drills'],
  '/academy/concept-graph': ['academy'],
  '/academy/tracks': ['academy'],
  '/academy/certification/:level': ['academy'],
  '/academy/lesson/:lessonId': ['academy'],
  '/academy': ['academy', 'quickDrill', 'variant', 'drills'],
  '/theory/chapter/:chapterId': ['theory'],
  '/theory': ['theory', 'variant'],
  '/puzzle/theme/:themeId': ['puzzle'],
  '/puzzle/rush': ['puzzle'],
  '/puzzle/daily': ['puzzle'],
  '/puzzle': ['puzzle', 'feedback'],
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
    adaptive: () => import('./locales/zh/adaptive.json'),
    app: () => import('./locales/zh/app.json'),
    common: () => import('./locales/zh/common.json'),
    dailyChallenge: () => import('./locales/zh/dailyChallenge.json'),
    dailyPlan: () => import('./locales/zh/dailyPlan.json'),
    dashboard: () => import('./locales/zh/dashboard.json'),
    downswing: () => import('./locales/zh/downswing.json'),
    drills: () => import('./locales/zh/drills.json'),
    elo: () => import('./locales/zh/elo.json'),
    feedback: () => import('./locales/zh/feedback.json'),
    gameVariant: () => import('./locales/zh/gameVariant.json'),
    gto: () => import('./locales/zh/gto.json'),
    handHistory: () => import('./locales/zh/handHistory.json'),
    help: () => import('./locales/zh/help.json'),
    leaderboard: () => import('./locales/zh/leaderboard.json'),
    localTrack: () => import('./locales/zh/localTrack.json'),
    mentor: () => import('./locales/zh/mentor.json'),
    mood: () => import('./locales/zh/mood.json'),
    nav: () => import('./locales/zh/nav.json'),
    onboarding: () => import('./locales/zh/onboarding.json'),
    opponent: () => import('./locales/zh/opponent.json'),
    opponentDrill: () => import('./locales/zh/opponentDrill.json'),
    potOdds: () => import('./locales/zh/potOdds.json'),
    progress: () => import('./locales/zh/progress.json'),
    puzzle: () => import('./locales/zh/puzzle.json'),
    quickDrill: () => import('./locales/zh/quickDrill.json'),
    rangeTrainer: () => import('./locales/zh/rangeTrainer.json'),
    rankUp: () => import('./locales/zh/rankUp.json'),
    review: () => import('./locales/zh/review.json'),
    sessionLimit: () => import('./locales/zh/sessionLimit.json'),
    settings: () => import('./locales/zh/settings.json'),
    shortcuts: () => import('./locales/zh/shortcuts.json'),
    shortDeck: () => import('./locales/zh/shortDeck.json'),
    spacedRepetition: () => import('./locales/zh/spacedRepetition.json'),
    streak: () => import('./locales/zh/streak.json'),
    theory: () => import('./locales/zh/theory.json'),
    tilt: () => import('./locales/zh/tilt.json'),
    toast: () => import('./locales/zh/toast.json'),
    variant: () => import('./locales/zh/variant.json'),
  },
  en: {
    academy: () => import('./locales/en/academy.json'),
    achievements: () => import('./locales/en/achievements.json'),
    adaptive: () => import('./locales/en/adaptive.json'),
    app: () => import('./locales/en/app.json'),
    common: () => import('./locales/en/common.json'),
    dailyChallenge: () => import('./locales/en/dailyChallenge.json'),
    dailyPlan: () => import('./locales/en/dailyPlan.json'),
    dashboard: () => import('./locales/en/dashboard.json'),
    downswing: () => import('./locales/en/downswing.json'),
    drills: () => import('./locales/en/drills.json'),
    elo: () => import('./locales/en/elo.json'),
    feedback: () => import('./locales/en/feedback.json'),
    gameVariant: () => import('./locales/en/gameVariant.json'),
    gto: () => import('./locales/en/gto.json'),
    handHistory: () => import('./locales/en/handHistory.json'),
    help: () => import('./locales/en/help.json'),
    leaderboard: () => import('./locales/en/leaderboard.json'),
    localTrack: () => import('./locales/en/localTrack.json'),
    mentor: () => import('./locales/en/mentor.json'),
    mood: () => import('./locales/en/mood.json'),
    nav: () => import('./locales/en/nav.json'),
    onboarding: () => import('./locales/en/onboarding.json'),
    opponent: () => import('./locales/en/opponent.json'),
    opponentDrill: () => import('./locales/en/opponentDrill.json'),
    potOdds: () => import('./locales/en/potOdds.json'),
    progress: () => import('./locales/en/progress.json'),
    puzzle: () => import('./locales/en/puzzle.json'),
    quickDrill: () => import('./locales/en/quickDrill.json'),
    rangeTrainer: () => import('./locales/en/rangeTrainer.json'),
    rankUp: () => import('./locales/en/rankUp.json'),
    review: () => import('./locales/en/review.json'),
    sessionLimit: () => import('./locales/en/sessionLimit.json'),
    settings: () => import('./locales/en/settings.json'),
    shortcuts: () => import('./locales/en/shortcuts.json'),
    shortDeck: () => import('./locales/en/shortDeck.json'),
    spacedRepetition: () => import('./locales/en/spacedRepetition.json'),
    streak: () => import('./locales/en/streak.json'),
    theory: () => import('./locales/en/theory.json'),
    tilt: () => import('./locales/en/tilt.json'),
    toast: () => import('./locales/en/toast.json'),
    variant: () => import('./locales/en/variant.json'),
  },
};
