import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import BlankLayout from '@/layouts/BlankLayout';
import { PageSkeleton } from '@/shared/components/LoadingState';

// Lazy-loaded pages
const Dashboard = lazy(() => import('@/features/progress/components/Dashboard'));
const RangeTrainerHome = lazy(() => import('@/features/range-trainer/components/RangeTrainerHome'));
const SessionResultPage = lazy(() => import('@/features/range-trainer/components/SessionResultPage'));
const RangeLearnPage = lazy(() => import('@/features/range-trainer/components/RangeLearnPage'));
const RangeQuizPage = lazy(() => import('@/features/range-trainer/components/RangeQuizPage'));
const PotOddsPage = lazy(() => import('@/features/pot-odds/components/PotOddsPage'));
const PotOddsQuizPage = lazy(() => import('@/features/pot-odds/components/PotOddsQuizPage'));
const GTOSimulatorHome = lazy(() => import('@/features/gto-simulator/components/GTOSimulatorHome'));
const GTOResultPage = lazy(() => import('@/features/gto-simulator/components/GTOResultPage'));
const GTOSessionPage = lazy(() => import('@/features/gto-simulator/components/GTOSessionPage'));
const HandHistoryList = lazy(() => import('@/features/hand-history/components/HandHistoryList'));
const HandImportPage = lazy(() => import('@/features/hand-history/components/HandImportPage'));
const HandReplayPage = lazy(() => import('@/features/hand-history/components/HandReplayPage'));
const ProgressPage = lazy(() => import('@/features/progress/components/ProgressPage'));
const SettingsPage = lazy(() => import('@/features/progress/components/SettingsPage'));
const RangeStatsPage = lazy(() => import('@/features/progress/components/RangeStatsPage'));
const GTOStatsPage = lazy(() => import('@/features/progress/components/GTOStatsPage'));
const DailyChallengePage = lazy(() => import('@/features/progress/components/DailyChallenge'));
const LeaderboardPage = lazy(() => import('@/features/progress/components/Leaderboard'));
const AcademyHome = lazy(() => import('@/features/strategy-academy/components/AcademyHome'));
const CourseView = lazy(() => import('@/features/strategy-academy/components/CourseView'));
const BasicsIntro = lazy(() => import('@/features/strategy-academy/components/BasicsIntro'));
const ConceptGraphView = lazy(() => import('@/features/strategy-academy/components/ConceptGraphView'));
const LearningTracksView = lazy(() => import('@/features/strategy-academy/components/LearningTracksView'));
const QuickDrill = lazy(() => import('@/features/strategy-academy/components/QuickDrill'));
const LevelCertification = lazy(() => import('@/features/strategy-academy/components/LevelCertification'));
const OnboardingFlow = lazy(() => import('@/features/onboarding/components/OnboardingFlow'));
const PuzzleHome = lazy(() => import('@/features/puzzle-trainer/components/PuzzleHome'));
const PuzzleRush = lazy(() => import('@/features/puzzle-trainer/components/PuzzleRush'));
const DailyPuzzle = lazy(() => import('@/features/puzzle-trainer/components/DailyPuzzle'));
const ThemeDrill = lazy(() => import('@/features/puzzle-trainer/components/ThemeDrill'));

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
      { index: true, element: <LazyWrapper><Dashboard /></LazyWrapper> },
      { path: 'range-trainer', element: <LazyWrapper><RangeTrainerHome /></LazyWrapper> },
      { path: 'range-trainer/result/:sessionId', element: <LazyWrapper><SessionResultPage /></LazyWrapper> },
      { path: 'pot-odds', element: <LazyWrapper><PotOddsPage /></LazyWrapper> },
      { path: 'gto-simulator', element: <LazyWrapper><GTOSimulatorHome /></LazyWrapper> },
      { path: 'gto-simulator/result/:sessionId', element: <LazyWrapper><GTOResultPage /></LazyWrapper> },
      { path: 'hand-history', element: <LazyWrapper><HandHistoryList /></LazyWrapper> },
      { path: 'hand-history/import', element: <LazyWrapper><HandImportPage /></LazyWrapper> },
      { path: 'progress', element: <LazyWrapper><ProgressPage /></LazyWrapper> },
      { path: 'progress/range', element: <LazyWrapper><RangeStatsPage /></LazyWrapper> },
      { path: 'progress/gto', element: <LazyWrapper><GTOStatsPage /></LazyWrapper> },
      { path: 'daily-challenge', element: <LazyWrapper><DailyChallengePage /></LazyWrapper> },
      { path: 'leaderboard', element: <LazyWrapper><LeaderboardPage /></LazyWrapper> },
      { path: 'settings', element: <LazyWrapper><SettingsPage /></LazyWrapper> },
      { path: 'academy', element: <LazyWrapper><AcademyHome /></LazyWrapper> },
      { path: 'academy/basics', element: <LazyWrapper><BasicsIntro /></LazyWrapper> },
      { path: 'academy/concept-graph', element: <LazyWrapper><ConceptGraphView /></LazyWrapper> },
      { path: 'academy/tracks', element: <LazyWrapper><LearningTracksView /></LazyWrapper> },
      { path: 'academy/quick-drill', element: <LazyWrapper><QuickDrill /></LazyWrapper> },
      { path: 'academy/certification/:level', element: <LazyWrapper><LevelCertification /></LazyWrapper> },
      { path: 'academy/lesson/:lessonId', element: <LazyWrapper><CourseView /></LazyWrapper> },
      { path: 'puzzle', element: <LazyWrapper><PuzzleHome /></LazyWrapper> },
      { path: 'puzzle/rush', element: <LazyWrapper><PuzzleRush /></LazyWrapper> },
      { path: 'puzzle/daily', element: <LazyWrapper><DailyPuzzle /></LazyWrapper> },
      { path: 'puzzle/theme/:themeId', element: <LazyWrapper><ThemeDrill /></LazyWrapper> },
    ],
  },
  {
    element: <BlankLayout />,
    children: [
      { path: 'onboarding', element: <LazyWrapper><OnboardingFlow /></LazyWrapper> },
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
