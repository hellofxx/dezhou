import type {
  AcademyLearningStage,
  AcademyLearningStagesSnapshot,
} from '@/shared/types/academyDataSource';
import type { LevelSummary } from '../types';
import { getLessonMeta } from '../data/lessonMeta';

/**
 * 学院学习段（Level）快照投影（纯函数，progress 只读消费）。
 * 目录层 LevelSummary → 跨模块稳定的 AcademyLearningStage，
 * 不读 store、不拼路由、不变更顺序；顺序即目录层 Level 序列顺序。
 */

/** Level 条目 → 学习段；id 缺省时兜底 `l<level>`（与 academyMeta 的同口径兜底一致） */
export function toLearningStage(level: LevelSummary): AcademyLearningStage {
  return {
    id: level.id ?? `l${level.level}`,
    level: level.level,
    title: level.title,
    description: level.description,
    icon: level.icon,
    unlockRequirement: level.unlockRequirement,
    prerequisiteStageIds: level.prerequisiteLevelIds ?? [],
    lessonIds: level.lessons.map((lesson) => lesson.id),
    theoryChapterIds: [
      ...new Set(
        level.lessons.flatMap((lesson) => getLessonMeta(lesson.id).theoryAnchors),
      ),
    ],
  };
}

/** 学习段快照：保持入参顺序（同一入参多次调用返回等价结构，引用稳定性由调用方按变体缓存） */
export function buildLearningStages(
  levels: readonly LevelSummary[],
): AcademyLearningStagesSnapshot {
  return { stages: levels.map(toLearningStage) };
}
