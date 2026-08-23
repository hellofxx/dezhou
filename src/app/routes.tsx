import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import BlankLayout from '@/layouts/BlankLayout';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { ErrorBoundary } from '@/shared/components/business/ErrorBoundary';
import { preloadI18n, preloadFeature } from '@/i18n/preload';
import { FEATURE_GROUPS } from '@/i18n/moduleRegistry';

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

/**
 * 特殊路由懒加载：支持 preloadFeature（用于 academy-course 动态注入）。
 * group 收窄为字面量类型：当前仅课程路由需要额外 preloadFeature 分流
 * （ academy-course 课程内容加载失败会 reject，路由层须有 ErrorBoundary 兜底防白屏）。
 */
function lazyPageWithFeature(loader: PageLoader, group: '/academy/lesson/:lessonId') {
  return lazy(() => Promise.all([
    loader(),
    preloadFeature(group)
  ]).then(([mod]) => mod));
}

// Lazy-loaded pages
const Dashboard = lazyPage(() => import('@/features/progress/components/dashboard/Dashboard'), '/');
const RangeTrainerHome = lazyPage(() => import('@/features/range-trainer/components/RangeTrainerHome'), '/range-trainer');
const RangeLearnPage = lazyPage(() => import('@/features/range-trainer/components/RangeLearnPage'), '/range-trainer/learn');
const RangeQuizPage = lazyPage(() => import('@/features/range-trainer/components/RangeQuizPage'), '/range-trainer/quiz');
const PotOddsPage = lazyPage(() => import('@/features/pot-odds/components/PotOddsPage'), '/pot-odds');
const PotOddsQuizPage = lazyPage(() => import('@/features/pot-odds/components/PotOddsQuizPage'), '/pot-odds/quiz');
const GTOSimulatorHome = lazyPage(() => import('@/features/gto-simulator/components/GTOSimulatorHome'), '/gto-simulator');
const GTOResultPage = lazyPage(() => import('@/features/gto-simulator/components/GTOResultPage'), '/gto-simulator/result/:sessionId');
const GTOSessionPage = lazyPage(() => import('@/features/gto-simulator/components/GTOSessionPage'), '/gto-simulator/session/:scenarioId');
const HandHistoryList = lazyPage(() => import('@/features/hand-history/components/HandHistoryList'), '/hand-history');
const HandImportPage = lazyPage(() => import('@/features/hand-history/components/HandImportPage'), '/hand-history/import');
const HandReplayPage = lazyPage(() => import('@/features/hand-history/components/HandReplayPage'), '/hand-history/:handId');
const ProgressPage = lazyPage(() => import('@/features/progress/components/replay/ProgressPage'), '/progress');
const SettingsPage = lazyPage(() => import('@/features/progress/components/settings/SettingsPage'), '/settings');
const RangeStatsPage = lazyPage(() => import('@/features/progress/components/stats/RangeStatsPage'), '/progress/range');
const GTOStatsPage = lazyPage(() => import('@/features/progress/components/stats/GTOStatsPage'), '/progress/gto');
const LeaderboardPage = lazyPage(() => import('@/features/progress/components/achievement/Leaderboard'), '/leaderboard');
const AcademyHome = lazyPage(() => import('@/features/strategy-academy/components/AcademyHome'), '/academy');
const CourseView = lazyPageWithFeature(() => import('@/features/strategy-academy/components/CourseView'), '/academy/lesson/:lessonId');
const BasicsIntro = lazyPage(() => import('@/features/strategy-academy/components/BasicsIntro'), '/academy/basics');
const ConceptGraphView = lazyPage(() => import('@/features/strategy-academy/components/ConceptGraphView'), '/academy/concept-graph');
const LearningTracksView = lazyPage(() => import('@/features/strategy-academy/components/LearningTracksView'), '/academy/tracks');
const QuickDrill = lazyPage(() => import('@/features/strategy-academy/components/QuickDrill'), '/academy/quick-drill');
const LevelCertification = lazyPage(() => import('@/features/strategy-academy/components/LevelCertification'), '/academy/certification/:level');
const OnboardingFlow = lazyPage(() => import('@/features/onboarding/components/OnboardingFlow'), '/onboarding');
const PuzzleHome = lazyPage(() => import('@/features/puzzle-trainer/components/PuzzleHome'), '/puzzle');
const PuzzleRush = lazyPage(() => import('@/features/puzzle-trainer/components/PuzzleRush'), '/puzzle/rush');
const DailyPuzzle = lazyPage(() => import('@/features/puzzle-trainer/components/DailyPuzzle'), '/puzzle/daily');
const ThemeDrill = lazyPage(() => import('@/features/puzzle-trainer/components/ThemeDrill'), '/puzzle/theme/:themeId');
const TheoryHome = lazyPage(() => import('@/features/theory-academy/components/TheoryHome'), '/theory');
const TheoryChapterView = lazyPage(() => import('@/features/theory-academy/components/TheoryChapterView'), '/theory/chapter/:chapterId');
const HelpHome = lazyPage(() => import('@/features/help-center/components/HelpHome'), '/help');
const HelpArticle = lazyPage(() => import('@/features/help-center/components/HelpArticle'), '/help/article/:articleId');

function LazyWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <LazyWrapper><ErrorBoundary><Dashboard /></ErrorBoundary></LazyWrapper> },
      { path: 'range-trainer', element: <LazyWrapper><RangeTrainerHome /></LazyWrapper> },
      { path: 'pot-odds', element: <LazyWrapper><PotOddsPage /></LazyWrapper> },
      { path: 'gto-simulator', element: <LazyWrapper><ErrorBoundary><GTOSimulatorHome /></ErrorBoundary></LazyWrapper> },
      { path: 'gto-simulator/result/:sessionId', element: <LazyWrapper><GTOResultPage /></LazyWrapper> },
      { path: 'hand-history', element: <LazyWrapper><HandHistoryList /></LazyWrapper> },
      { path: 'hand-history/import', element: <LazyWrapper><HandImportPage /></LazyWrapper> },
      { path: 'progress', element: <LazyWrapper><ProgressPage /></LazyWrapper> },
      { path: 'progress/range', element: <LazyWrapper><RangeStatsPage /></LazyWrapper> },
      { path: 'progress/gto', element: <LazyWrapper><GTOStatsPage /></LazyWrapper> },
      { path: 'leaderboard', element: <LazyWrapper><LeaderboardPage /></LazyWrapper> },
      { path: 'settings', element: <LazyWrapper><SettingsPage /></LazyWrapper> },
      { path: 'academy', element: <LazyWrapper><ErrorBoundary><AcademyHome /></ErrorBoundary></LazyWrapper> },
      { path: 'academy/basics', element: <LazyWrapper><BasicsIntro /></LazyWrapper> },
      { path: 'academy/concept-graph', element: <LazyWrapper><ConceptGraphView /></LazyWrapper> },
      { path: 'academy/tracks', element: <LazyWrapper><LearningTracksView /></LazyWrapper> },
      { path: 'academy/quick-drill', element: <LazyWrapper><QuickDrill /></LazyWrapper> },
      { path: 'academy/certification/:level', element: <LazyWrapper><LevelCertification /></LazyWrapper> },
      { path: 'academy/lesson/:lessonId', element: <LazyWrapper><ErrorBoundary><CourseView /></ErrorBoundary></LazyWrapper> },
      { path: 'theory', element: <LazyWrapper><ErrorBoundary><TheoryHome /></ErrorBoundary></LazyWrapper> },
      { path: 'theory/chapter/:chapterId', element: <LazyWrapper><TheoryChapterView /></LazyWrapper> },
      { path: 'puzzle', element: <LazyWrapper><PuzzleHome /></LazyWrapper> },
      { path: 'puzzle/rush', element: <LazyWrapper><PuzzleRush /></LazyWrapper> },
      { path: 'puzzle/daily', element: <LazyWrapper><DailyPuzzle /></LazyWrapper> },
      { path: 'puzzle/theme/:themeId', element: <LazyWrapper><ThemeDrill /></LazyWrapper> },
      { path: 'help', element: <LazyWrapper><ErrorBoundary><HelpHome /></ErrorBoundary></LazyWrapper> },
      { path: 'help/article/:articleId', element: <LazyWrapper><ErrorBoundary><HelpArticle /></ErrorBoundary></LazyWrapper> },
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
], {
  // GitHub Pages 部署在 /dezhou/ 子路径，复用 Vite base 自动适配 dev('/') 与生产('/dezhou/')
  basename: import.meta.env.BASE_URL,
});
