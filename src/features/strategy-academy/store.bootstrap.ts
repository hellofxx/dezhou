/**
 * strategy-academy 启动引导：注册成就检查数据源 + 初始 ELO 同步。
 * 依赖倒置（P2-2）：progress store 不再动态 import 本模块，
 * 改为本模块向 achievementRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { useAcademyStore } from './store';
import { useProgressStore } from '@/features/progress/store';

// 成就检查数据源：progress store 的 checkCondition 经注册表查询
registerAchievementSource({
  isLevelLessonsCompleted: (level) => useAcademyStore.getState().isLevelLessonsCompleted(level),
  getCertifications: () => useAcademyStore.getState().certifications,
  areAllLevelsCertified: () => useAcademyStore.getState().areAllLevelsCertified(),
  isTrackCompleted: (trackId) => useAcademyStore.getState().isTrackCompleted(trackId),
});

// P1-2.3: 启动时从本模块 abilityAssessment 同步初始 ELO。
// 仅当 elo.gamesPlayed === 0 时生效（syncEloFromAcademyAbility 内部判定，
// 避免覆盖已累积的答题进度）。延迟到宏任务执行，规避模块加载顺序问题。
if (typeof window !== 'undefined') {
  setTimeout(() => {
    const aa = useAcademyStore.getState().abilityAssessment;
    useProgressStore.getState().syncEloFromAcademyAbility(aa);
  }, 0);
}
