import type { AcademyLearningStage } from '@/shared/types/academyDataSource';

/**
 * 旅程展示分组（对照基准图「四段进阶」）：
 * Level 序号按 1 / 2–3 / 4 / 5+ 归并为四段，先修按段顺序串行。
 * 仅影响首页展示；解锁与进度仍由课程完成态推导，不改学院门禁。
 */
const GROUP_COUNT = 4;

export function journeyGroupIndex(level: number): number {
  if (level <= 1) return 0;
  if (level <= 3) return 1;
  if (level <= 4) return 2;
  return 3;
}

export function groupLearningStages(
  stages: readonly AcademyLearningStage[],
): AcademyLearningStage[] {
  const buckets: AcademyLearningStage[][] = Array.from({ length: GROUP_COUNT }, () => []);
  for (const stage of stages) {
    const index = journeyGroupIndex(stage.level);
    buckets[index]?.push(stage);
  }

  const groups: AcademyLearningStage[] = [];
  let previousId: string | null = null;
  buckets.forEach((members, index) => {
    const first = members[0];
    if (!first) return;
    const id = `journey-stage-${index + 1}`;
    groups.push({
      id,
      level: first.level,
      title: first.title,
      description: first.description,
      icon: first.icon,
      unlockRequirement: first.unlockRequirement,
      prerequisiteStageIds: previousId === null ? [] : [previousId],
      lessonIds: members.flatMap((member) => member.lessonIds),
      theoryChapterIds: [
        ...new Set(members.flatMap((member) => member.theoryChapterIds)),
      ],
    });
    previousId = id;
  });
  return groups;
}
