/**
 * strategy-academy 启动引导：注册成就检查数据源 + 初始 ELO 同步。
 * 依赖倒置（P2-2）：progress store 不再动态 import 本模块，
 * 改为本模块向 achievementRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import { useAcademyStore } from './store';
import { useProgressStore } from '@/features/progress/store';
import { LEVELS } from './data/courses';
import { findLessonById } from './utils/courseProgress';

// 成就检查数据源：progress store 的 checkCondition 经注册表查询
registerAchievementSource({
  isLevelLessonsCompleted: (level) => useAcademyStore.getState().isLevelLessonsCompleted(level),
  getCertifications: () => useAcademyStore.getState().certifications,
  areAllLevelsCertified: () => useAcademyStore.getState().areAllLevelsCertified(),
  isTrackCompleted: (trackId) => useAcademyStore.getState().isTrackCompleted(trackId),
});

// 学院课程数据源（P3 依赖倒置）：progress 的每日训练计划 / 进步回放经注册表查询，
// 消除 progress → strategy-academy 的直接 import（每日训练计划的「下一课」逻辑回迁本模块）。
registerAcademyDataSource({
  findNextLesson: (completedLessons) => {
    for (const level of LEVELS) {
      for (const lesson of level.lessons) {
        if (!completedLessons.includes(lesson.id)) {
          return { id: lesson.id, title: lesson.title, level: level.level };
        }
      }
    }
    return null;
  },
  getLessonMeta: (lessonId) => {
    const lesson = findLessonById(lessonId);
    return lesson ? { id: lesson.id, title: lesson.title, level: lesson.level } : undefined;
  },
  getAcademyProgressSnapshot: () => useAcademyStore.getState().progress,
  getFirstAttemptScoresSnapshot: () => useAcademyStore.getState().firstAttemptScores,
  getLastAttemptScoresSnapshot: () => useAcademyStore.getState().lastAttemptScores,
  subscribe: (listener) => useAcademyStore.subscribe(listener),
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
