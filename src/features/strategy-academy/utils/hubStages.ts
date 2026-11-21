import type { AcademyLearningStage } from '@/shared/types/academyDataSource';
import type { TheoryChapterIndexEntry } from '@/shared/types/theoryDataSource';
import { groupLearningStages, journeyGroupIndex } from '@/shared/utils/academyJourneyGroups';
import { computeStageStates } from '@/shared/utils/academyJourneyProgress';

/** 四段固定文案（dashboard 属 core；顺序与 journeyGroupIndex 一致）。 */
const STAGE_META = [
  { titleKey: 'dashboard.path.stage1', subtitleKey: 'dashboard.path.stage1Sub' },
  { titleKey: 'dashboard.path.stage2', subtitleKey: 'dashboard.path.stage2Sub' },
  { titleKey: 'dashboard.path.stage3', subtitleKey: 'dashboard.path.stage3Sub' },
  { titleKey: 'dashboard.path.stage4', subtitleKey: 'dashboard.path.stage4Sub' },
] as const;

export const HUB_STAGE_COUNT = STAGE_META.length;

export interface HubStage {
  id: string;
  index: number;
  level: number;
  titleKey: string;
  subtitleKey: string;
  lessonIds: readonly string[];
  theoryChapterIds: readonly string[];
  supplementalChapterIds: readonly string[];
  doneLessons: number;
  totalLessons: number;
  doneChapters: number;
  totalChapters: number;
  unlocked: boolean;
  current: boolean;
  complete: boolean;
  theoryKnown: boolean;
  theoryUnavailable: boolean;
}

function stageIndex(id: string, fallback: number): number {
  const parsed = Number.parseInt(id.replace('journey-stage-', ''), 10);
  return Number.isFinite(parsed) && parsed >= 1 ? Math.min(parsed, HUB_STAGE_COUNT) : fallback;
}

function theoryLevelIndex(levelId: string): number | null {
  const level = Number.parseInt(levelId.replace(/^t/, ''), 10);
  return Number.isFinite(level) ? journeyGroupIndex(level) : null;
}

export interface BuildHubStagesInput {
  stages: readonly AcademyLearningStage[];
  completedLessons: readonly string[];
  completedChapters: readonly string[];
  catalog?: readonly TheoryChapterIndexEntry[];
  variant: 'standard' | 'short-deck' | 'heads-up';
  basicsCompleted: boolean;
  theoryKnown: boolean;
}

/** 把策略 Level 快照 + 理论目录投影成四段双泳道数据。 */
export function buildHubStages({
  stages,
  completedLessons,
  completedChapters,
  catalog = [],
  variant,
  basicsCompleted,
  theoryKnown,
}: BuildHubStagesInput): HubStage[] {
  const grouped = groupLearningStages(stages);
  const states = new Map(
    computeStageStates(grouped, completedLessons).map((state) => [state.stage.id, state]),
  );
  const completedLessonSet = new Set(completedLessons);
  const completedChapterSet = new Set(completedChapters);
  const anchoredChapterIds = new Set(grouped.flatMap((stage) => stage.theoryChapterIds));
  const theoryUnavailable = variant === 'short-deck' && anchoredChapterIds.size === 0;

  return grouped.map((stage, order) => {
    const index = stageIndex(stage.id, order + 1);
    const state = states.get(stage.id);
    const totalLessons = stage.lessonIds.length;
    const doneLessons = stage.lessonIds.filter((id) => completedLessonSet.has(id)).length;
    const totalChapters = stage.theoryChapterIds.length;
    const doneChapters = stage.theoryChapterIds.filter((id) => completedChapterSet.has(id)).length;
    const supplementalChapterIds = theoryUnavailable
      ? []
      : catalog
          .filter(
            (entry) =>
              !anchoredChapterIds.has(entry.chapterId) &&
              theoryLevelIndex(entry.levelId) === index - 1,
          )
          .map((entry) => entry.chapterId);

    return {
      id: stage.id,
      index,
      level: stage.level,
      titleKey: STAGE_META[index - 1]?.titleKey ?? STAGE_META[0].titleKey,
      subtitleKey: STAGE_META[index - 1]?.subtitleKey ?? STAGE_META[0].subtitleKey,
      lessonIds: stage.lessonIds,
      theoryChapterIds: stage.theoryChapterIds,
      supplementalChapterIds,
      doneLessons,
      totalLessons,
      doneChapters,
      totalChapters,
      unlocked: basicsCompleted && (state?.unlocked ?? false),
      current: basicsCompleted && (state?.current ?? false),
      complete: totalLessons > 0 && doneLessons === totalLessons,
      theoryKnown,
      theoryUnavailable,
    };
  });
}

export interface HubProgressSummary {
  doneLessons: number;
  totalLessons: number;
  doneChapters: number;
  totalChapters: number;
}

export function summarizeHubProgress(stages: readonly HubStage[]): HubProgressSummary {
  return stages.reduce<HubProgressSummary>(
    (summary, stage) => ({
      doneLessons: summary.doneLessons + stage.doneLessons,
      totalLessons: summary.totalLessons + stage.totalLessons,
      doneChapters: summary.doneChapters + stage.doneChapters,
      totalChapters: summary.totalChapters + stage.totalChapters,
    }),
    { doneLessons: 0, totalLessons: 0, doneChapters: 0, totalChapters: 0 },
  );
}