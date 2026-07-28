/**
 * puzzle-trainer 模块公共 API。
 *
 * 路由级组件以 default export 形式被 routes.tsx 懒加载，
 * 因此这里只导出非路由级的可复用类型与工具。
 */
export { PuzzleCard } from './components/PuzzleCard';
export { PuzzleResult } from './components/PuzzleResult';

export { usePuzzleEngine } from './hooks/usePuzzleEngine';
export { usePuzzleStore, getBestRecord } from './store';

export {
  PUZZLE_BANK,
  PUZZLE_THEMES,
  getAllPuzzles,
  getPuzzlesByTheme,
  getThemeMeta,
} from './data/puzzleBank';
export type { PuzzleThemeMeta } from './data/puzzleBank';
export { getDailyPuzzles, getDailyKey, DAILY_PUZZLE_COUNT } from './data/dailyPuzzles';
export {
  getRushQuestions,
  RUSH_DURATIONS,
  RUSH_INITIAL_LIVES,
  RUSH_STREAK_THRESHOLD,
  RUSH_STREAK_BONUS,
} from './data/rushQuestions';

export {
  getDateSeed,
  seededRandom,
  pickBySeed,
  shuffleBySeed,
  getDailyCompletionCount,
} from './utils/dateSeed';

export type {
  PuzzleTheme,
  PuzzleDifficulty,
  PuzzleOption,
  PuzzleQuestion,
  PuzzleMode,
  PuzzleSessionStatus,
  PuzzleAnswerRecord,
  PuzzleEngineState,
  UsePuzzleEngineOptions,
  PuzzleBestRecord,
  DailyCompletionMap,
} from './types';
