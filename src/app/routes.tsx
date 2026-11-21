import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import BlankLayout from '@/layouts/BlankLayout';
import SettingsRoute from '@/layouts/SettingsRoute';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { ErrorBoundary } from '@/shared/components/system/ErrorBoundary';
import { preloadI18n } from '@/i18n/preload';
import { FEATURE_GROUPS } from '@/i18n/moduleRegistry';
import { LegacyLessonRedirect, LegacyRedirect } from './legacyRedirects';

type PageModule = { default: React.ComponentType<unknown> };
type PageLoader = () => Promise<PageModule>;

/**
 * 路由级懒加载：页面组件 chunk 与该路由所需翻译模块并行加载。
 * 翻译注入（preloadI18n）在组件渲染前完成，core 模块幂等跳过不重复加载。
 */
function lazyPage(loader: PageLoader, group: keyof typeof FEATURE_GROUPS) {
  const keys = FEATURE_GROUPS[group];
  return lazy(() => Promise.all([loader(), preloadI18n(keys)]).then(([mod]) => mod));
}

// Lazy-loaded pages
const JourneyHome = lazyPage(() => import('@/features/progress/components/path/JourneyHome'), '/');
const LessonRoute = lazyPage(() => import('@/features/strategy-academy/components/LessonRoute'), '/lesson/:lessonId');
const LessonEntry = lazyPage(() => import('@/features/strategy-academy/components/LessonEntry'), '/lesson');
const DrillHub = lazyPage(() => import('@/features/range-trainer/components/DrillHub'), '/drill');
const QuickDrill = lazyPage(() => import('@/features/strategy-academy/components/QuickDrill'), '/quick');
const ProgressPage = lazyPage(() => import('@/features/progress/components/replay/ProgressPage'), '/progress');
const RangeStatsPage = lazyPage(() => import('@/features/progress/components/stats/RangeStatsPage'), '/progress/range');
const GTOStatsPage = lazyPage(() => import('@/features/progress/components/stats/GTOStatsPage'), '/progress/gto');
const LeaderboardPage = lazyPage(() => import('@/features/progress/components/achievement/Leaderboard'), '/leaderboard');
const AcademyHome = lazyPage(() => import('@/features/strategy-academy/components/AcademyHome'), '/academy');
const BasicsIntro = lazyPage(() => import('@/features/strategy-academy/components/BasicsIntro'), '/academy/basics');
const GTOSimulatorHome = lazyPage(() => import('@/features/gto-simulator/components/GTOSimulatorHome'), '/gto-simulator');
const GTOResultPage = lazyPage(() => import('@/features/gto-simulator/components/GTOResultPage'), '/gto-simulator/result/:sessionId');
const GTOSessionPage = lazyPage(() => import('@/features/gto-simulator/components/GTOSessionPage'), '/gto-simulator/session/:scenarioId');
const HandHistoryList = lazyPage(() => import('@/features/hand-history/components/HandHistoryList'), '/hand-history');
const HandImportPage = lazyPage(() => import('@/features/hand-history/components/HandImportPage'), '/hand-history/import');
const HandReplayPage = lazyPage(() => import('@/features/hand-history/components/HandReplayPage'), '/hand-history/:handId');
const TheoryHome = lazyPage(() => import('@/features/theory-academy/components/TheoryHome'), '/theory');
const TheoryChapterView = lazyPage(() => import('@/features/theory-academy/components/TheoryChapterView'), '/theory/chapter/:chapterId');
// 疑难标记复习清单：仅消费 theory.* 文案，故复用 '/theory' 分组（页面本体已在该分组内）
const TheoryFlaggedReview = lazyPage(() => import('@/features/theory-academy/components/TheoryFlaggedReview'), '/theory');
const PuzzleRush = lazyPage(() => import('@/features/puzzle-trainer/components/PuzzleRush'), '/puzzle/rush');
const DailyPuzzle = lazyPage(() => import('@/features/puzzle-trainer/components/DailyPuzzle'), '/puzzle/daily');
const ThemeDrill = lazyPage(() => import('@/features/puzzle-trainer/components/ThemeDrill'), '/puzzle/theme/:themeId');
const HelpHome = lazyPage(() => import('@/features/help-center/components/HelpHome'), '/help');
const HelpArticle = lazyPage(() => import('@/features/help-center/components/HelpArticle'), '/help/article/:articleId');
const OnboardingFlow = lazyPage(() => import('@/features/onboarding/components/OnboardingFlow'), '/onboarding');
const RangeLearnPage = lazyPage(() => import('@/features/range-trainer/components/RangeLearnPage'), '/range-trainer/learn');
const RangeQuizPage = lazyPage(() => import('@/features/range-trainer/components/RangeQuizPage'), '/range-trainer/quiz');
const PotOddsQuizPage = lazyPage(() => import('@/features/pot-odds/components/PotOddsQuizPage'), '/pot-odds/quiz');

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
}

/** 旧深链 → 冻结路由表：保留 query，replace 不留历史 */
function redirect(to: string) {
  return <LazyWrapper><LegacyRedirect to={to} /></LazyWrapper>;
}

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LazyWrapper><ErrorBoundary><JourneyHome /></ErrorBoundary></LazyWrapper> },
      // 课程：/lesson/:lessonId（theory: 前缀转理论章节，其余走 CourseView）/ /lesson（解析下一课后重定向）
      { path: 'lesson/:lessonId', element: <LazyWrapper><ErrorBoundary><LessonRoute /></ErrorBoundary></LazyWrapper> },
      { path: 'lesson', element: <LazyWrapper><LessonEntry /></LazyWrapper> },
      // 训练场 / 速训
      { path: 'drill', element: <LazyWrapper><ErrorBoundary><DrillHub /></ErrorBoundary></LazyWrapper> },
      { path: 'quick', element: <LazyWrapper><QuickDrill /></LazyWrapper> },
      // 进度中心
      { path: 'progress', element: <LazyWrapper><ProgressPage /></LazyWrapper> },
      { path: 'progress/range', element: <LazyWrapper><RangeStatsPage /></LazyWrapper> },
      { path: 'progress/gto', element: <LazyWrapper><GTOStatsPage /></LazyWrapper> },
      { path: 'leaderboard', element: <LazyWrapper><LeaderboardPage /></LazyWrapper> },
      // 设置纸条（浮层与路由同构，关闭即回首页）
      { path: 'settings', element: <LazyWrapper><SettingsRoute /></LazyWrapper> },
      // 帮助
      { path: 'help', element: <LazyWrapper><ErrorBoundary><HelpHome /></ErrorBoundary></LazyWrapper> },
      { path: 'help/article/:articleId', element: <LazyWrapper><ErrorBoundary><HelpArticle /></ErrorBoundary></LazyWrapper> },
      // 次要保留（不进导航）：全部课程 / 理论 / 复盘 / 排行 / 细分统计 / 谜题子模式
      { path: 'academy', element: <LazyWrapper><ErrorBoundary><AcademyHome /></ErrorBoundary></LazyWrapper> },
      // 基础入门：L1 课时的先修前置（完成后进入 l1-basics）
      { path: 'academy/basics', element: <LazyWrapper><BasicsIntro /></LazyWrapper> },
      { path: 'gto-simulator', element: <LazyWrapper><ErrorBoundary><GTOSimulatorHome /></ErrorBoundary></LazyWrapper> },
      { path: 'gto-simulator/result/:sessionId', element: <LazyWrapper><GTOResultPage /></LazyWrapper> },
      { path: 'hand-history', element: <LazyWrapper><HandHistoryList /></LazyWrapper> },
      { path: 'hand-history/import', element: <LazyWrapper><HandImportPage /></LazyWrapper> },
      { path: 'theory', element: <LazyWrapper><ErrorBoundary><TheoryHome /></ErrorBoundary></LazyWrapper> },
      { path: 'theory/chapter/:chapterId', element: <LazyWrapper><TheoryChapterView /></LazyWrapper> },
      { path: 'theory/review', element: <LazyWrapper><TheoryFlaggedReview /></LazyWrapper> },
      { path: 'puzzle/rush', element: <LazyWrapper><PuzzleRush /></LazyWrapper> },
      { path: 'puzzle/daily', element: <LazyWrapper><DailyPuzzle /></LazyWrapper> },
      { path: 'puzzle/theme/:themeId', element: <LazyWrapper><ThemeDrill /></LazyWrapper> },
      // 旧深链重定向（保留 query）
      { path: 'academy/lesson/:lessonId', element: <LazyWrapper><LegacyLessonRedirect /></LazyWrapper> },
      { path: 'academy/quick-drill', element: redirect('/quick') },
      { path: 'academy/tracks', element: redirect('/') },
      { path: 'range-trainer', element: redirect('/drill?mode=range') },
      { path: 'pot-odds', element: redirect('/drill?mode=odds') },
      { path: 'puzzle', element: redirect('/drill?mode=puzzle') },
    ],
  },
  {
    element: <BlankLayout />,
    children: [
      { path: 'onboarding', element: <LazyWrapper><ErrorBoundary><OnboardingFlow /></ErrorBoundary></LazyWrapper> },
      { path: 'range-trainer/learn', element: <LazyWrapper><RangeLearnPage /></LazyWrapper> },
      { path: 'range-trainer/quiz', element: <LazyWrapper><RangeQuizPage /></LazyWrapper> },
      { path: 'pot-odds/quiz', element: <LazyWrapper><PotOddsQuizPage /></LazyWrapper> },
      { path: 'gto-simulator/session/:scenarioId', element: <LazyWrapper><GTOSessionPage /></LazyWrapper> },
      { path: 'hand-history/:handId', element: <LazyWrapper><HandReplayPage /></LazyWrapper> },
    ],
  },
];

export const router = createBrowserRouter(appRoutes, {
  // GitHub Pages 部署在 /dezhou/ 子路径，复用 Vite base 自动适配 dev('/') 与生产('/dezhou/')
  basename: import.meta.env.BASE_URL,
});
