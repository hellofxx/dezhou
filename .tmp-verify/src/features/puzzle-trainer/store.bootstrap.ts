/**
 * puzzle-trainer 启动引导：注册成就检查数据源。
 * 依赖倒置（P2-2）：progress store 不再 import 本模块，
 * 改为本模块向 achievementRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { usePuzzleStore } from './store';

// 成就检查数据源：progress store 的 checkCondition 经注册表查询
registerAchievementSource({
  isLevelLessonsCompleted: () => false,
  getCertifications: () => ({}),
  areAllLevelsCertified: () => false,
  isTrackCompleted: () => false,
  hasPuzzleHistory: () => usePuzzleStore.getState().history.length > 0,
  hasCompletedDailyPuzzle: () => Object.keys(usePuzzleStore.getState().dailyCompleted).length > 0,
  isDailyPuzzleCompleted: (dateKey) => Boolean(usePuzzleStore.getState().dailyCompleted[dateKey]),
});