import type { AcademyLearningStage } from '@/shared/types/academyDataSource';

/**
 * 学习旅程图推导（纯函数，无 store / 无路由）。
 *
 * 输入是 registry 提供的学习段快照（AcademyLearningStage，只含 lessonIds，不含课时标题），
 * 输出是渲染直接消费的阶段状态与「下一课」。规则与原型 STAGES 一致：
 * - 解锁：prerequisiteStageIds 全部完成即解锁；无前置视作已解锁；
 *   前置阶段不在当前变体快照里时按「未完成」处理（宁锁不放行，避免跨变体误解锁）。
 * - current：首个「已解锁且未完成」的阶段，全图至多一个。
 * - 完成：课时全部完成；0 课时的阶段不算完成（空阶段不应凭空解锁后继阶段）。
 */

export interface JourneyStageState {
  stage: AcademyLearningStage;
  /** 已完成课时数 */
  done: number;
  /** 课时总数 */
  total: number;
  /** done / total，0–1；total 为 0 时按 0 */
  ratio: number;
  unlocked: boolean;
  current: boolean;
}

/** 阶段是否完成（空阶段不算完成） */
function isStageComplete(
  stage: AcademyLearningStage,
  completed: ReadonlySet<string>,
): boolean {
  return stage.lessonIds.length > 0 && stage.lessonIds.every((id) => completed.has(id));
}

/** 阶段状态列表：顺序与入参一致 */
export function computeStageStates(
  stages: readonly AcademyLearningStage[],
  completed: readonly string[],
): JourneyStageState[] {
  const completedSet = new Set(completed);
  const completeStageIds = new Set(
    stages.filter((stage) => isStageComplete(stage, completedSet)).map((stage) => stage.id),
  );

  let currentAssigned = false;

  return stages.map((stage) => {
    const total = stage.lessonIds.length;
    const done = stage.lessonIds.filter((id) => completedSet.has(id)).length;
    const unlocked = stage.prerequisiteStageIds.every((id) => completeStageIds.has(id));
    const current = !currentAssigned && unlocked && !completeStageIds.has(stage.id);
    if (current) currentAssigned = true;

    return {
      stage,
      done,
      total,
      ratio: total === 0 ? 0 : done / total,
      unlocked,
      current,
    };
  });
}

/**
 * 下一课：按阶段顺序取第一个「已解锁且未完成」的课时。
 * 锁定阶段的课时不可进入，故整段跳过；全部完成返回 null。
 */
export function findNextLesson(
  stages: readonly AcademyLearningStage[],
  completed: readonly string[],
): { stage: AcademyLearningStage; lessonId: string } | null {
  const completedSet = new Set(completed);

  for (const state of computeStageStates(stages, completed)) {
    if (!state.unlocked) continue;
    const lessonId = state.stage.lessonIds.find((id) => !completedSet.has(id));
    if (lessonId !== undefined) return { stage: state.stage, lessonId };
  }

  return null;
}
