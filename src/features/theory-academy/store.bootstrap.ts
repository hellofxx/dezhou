/**
 * theory-academy 启动引导：注册成就检查数据源。
 * 依赖倒置（P2-2）：progress store 不再动态 import 本模块，
 * 改为本模块向 achievementRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { useTheoryStore } from './store';
import { isLevelFullyCompleted } from './utils/theoryProgress';

// 成就检查数据源（仅 theory 专用可选方法；academy 类方法返回安全缺省值）
registerAchievementSource({
  isLevelLessonsCompleted: () => false,
  getCertifications: () => ({}),
  areAllLevelsCertified: () => false,
  isTrackCompleted: () => false,
  getCompletedChapters: () => useTheoryStore.getState().progress.completedChapters,
  isTheoryLevelFullyCompleted: (level) => {
    const completed = useTheoryStore.getState().progress.completedChapters;
    for (let lv = 1; lv <= level; lv++) {
      if (!isLevelFullyCompleted(`t${lv}`, completed)) return false;
    }
    return true;
  },
});
