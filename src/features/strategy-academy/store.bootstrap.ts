/**
 * strategy-academy 启动引导：注册成就检查数据源 + 初始 ELO 同步。
 * 依赖倒置（P2-2）：progress store 不再动态 import 本模块，
 * 改为本模块向 achievementRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { registerAcademyDataSource } from '@/shared/stores/academyDataSourceRegistry';
import type { AcademyLessonAttemptSnapshot } from '@/shared/types/academyDataSource';
import type { LessonAttemptRecord } from './types';
import { useAcademyStore } from './store';
import { useProgressStore } from '@/features/progress/store';
import {
  findLessonSummaryById,
  getLevelSummaries,
} from './utils/academyMeta';

// 成就检查数据源：progress store 的 checkCondition 经注册表查询（T7/B4 idempotency）
registerAchievementSource({
  id: 'strategy-academy',
  isLevelLessonsCompleted: (level) => useAcademyStore.getState().isLevelLessonsCompleted(level),
  getCertifications: () => useAcademyStore.getState().certifications,
  areAllLevelsCertified: () => useAcademyStore.getState().areAllLevelsCertified(),
  isTrackCompleted: (trackId) => useAcademyStore.getState().isTrackCompleted(trackId),
});

// 学院课程数据源（P3 依赖倒置）：progress 的每日训练计划 / 进步回放经注册表查询，
// 消除 progress → strategy-academy 的直接 import（每日训练计划的「下一课」逻辑回迁本模块）。
let cachedAttemptsSource: Record<string, LessonAttemptRecord> | undefined;
let cachedAttemptsSnapshot: Record<string, AcademyLessonAttemptSnapshot> = {};

/** lessonAttempts → 进步回放快照；按源对象引用缓存，保证 useSyncExternalStore 快照稳定。 */
function getLessonAttemptsSnapshot(): Record<string, AcademyLessonAttemptSnapshot> {
  const attempts = useAcademyStore.getState().lessonAttempts;
  if (attempts !== cachedAttemptsSource) {
    cachedAttemptsSource = attempts;
    cachedAttemptsSnapshot = Object.fromEntries(
      Object.entries(attempts).map(([lessonId, record]) => [
        lessonId,
        {
          firstScore: record.firstScore,
          lastScore: record.lastScore,
          attempts: record.attempts,
        },
      ]),
    );
  }
  return cachedAttemptsSnapshot;
}

registerAcademyDataSource({
  findNextLesson: (completedLessons) => {
    for (const level of getLevelSummaries()) {
      for (const lesson of level.lessons) {
        if (!completedLessons.includes(lesson.id)) {
          return { id: lesson.id, title: lesson.title, level: level.level };
        }
      }
    }
    return null;
  },
  getLessonMeta: (lessonId) => {
    const lesson = findLessonSummaryById(lessonId);
    return lesson ? { id: lesson.id, title: lesson.title, level: lesson.level } : undefined;
  },
  getAcademyProgressSnapshot: () => useAcademyStore.getState().progress,
  getLessonAttemptsSnapshot,
  subscribe: (listener) => useAcademyStore.subscribe(listener),
});

/**
 * P0：初始 ELO 种子改由 progress 的 onboarding.initialAbility（新手定位问项）投射。
 * emotionalControl 无 onboarding 对应问项，固定 50；仅 standard.gamesPlayed === 0 时写入。
 * 延迟到宏任务执行，规避模块加载顺序问题。
 */
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useProgressStore
      .getState()
      .seedEloFromOnboardingAbility(useProgressStore.getState().onboarding.initialAbility);
  }, 0);
}
