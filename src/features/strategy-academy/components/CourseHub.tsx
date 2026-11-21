import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useAcademyLearningStages,
  useAcademyProgressSnapshot,
  useProgressState,
  getTodayReviewItems,
} from '@/features/progress';
import { getTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import { isTheoryReviewItem } from '@/shared/utils/academySrs';
import { summarizeMastery } from '@/shared/utils/academyMastery';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { useAcademyStore } from '../store';
import { findLessonSummaryById } from '../utils/academyMeta';
import { buildHubStages, summarizeHubProgress } from '../utils/hubStages';
import { buildConceptScores } from '../utils/hubConcepts';
import { buildHubNextAction } from '../utils/hubNextAction';
import { useTheoryLearningSnapshot } from '../hooks/useTheoryLearningSnapshot';
import CourseHubHeader from './hub/CourseHubHeader';
import NextActionCard from './hub/NextActionCard';
import CourseStageCard from './hub/CourseStageCard';
import CourseHubCatalog from './hub/CourseHubCatalog';
import CourseMasteryDualCard, { type MasteryBlock } from './hub/CourseMasteryDualCard';

/**
 * 课程枢纽（/lesson）：策略实战 + 理论概念双泳道。
 * 理论数据只经 shared TheoryDataSource 读取；progress 只经公共入口读取。
 */
export default function CourseHub() {
  const { t } = useTranslation();
  const { stages } = useAcademyLearningStages();
  const { completedLessons } = useAcademyProgressSnapshot();
  const basicsCompleted = useAcademyStore((s) => s.basicsProgress.completed);
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const lessonAttempts = useAcademyStore((s) => s.lessonAttempts);
  const academyProgress = useAcademyStore((s) => s.progress);
  const reviewItems = useProgressState((s) => s.reviewItems);
  const theorySnapshot = useTheoryLearningSnapshot();
  const theoryKnown = theorySnapshot !== undefined;
  const completedChapters = theorySnapshot?.completedChapters ?? [];

  const catalog = useMemo(
    () => getTheoryDataSource()?.getChapterCatalog?.(activeVariant) ?? [],
    [activeVariant, theorySnapshot],
  );

  const hubStages = useMemo(
    () =>
      buildHubStages({
        stages,
        completedLessons,
        completedChapters,
        catalog,
        variant: activeVariant,
        basicsCompleted,
        theoryKnown,
      }),
    [stages, completedLessons, completedChapters, catalog, activeVariant, basicsCompleted, theoryKnown],
  );

  const summary = useMemo(() => summarizeHubProgress(hubStages), [hubStages]);
  const currentStage = hubStages.find((stage) => stage.current) ?? undefined;
  const completedLessonSet = useMemo(() => new Set(completedLessons), [completedLessons]);
  const completedChapterSet = useMemo(() => new Set(completedChapters), [completedChapters]);

  const conceptScores = useMemo(
    () =>
      buildConceptScores(
        hubStages.flatMap((stage) => stage.theoryChapterIds),
        theorySnapshot,
      ),
    [hubStages, theorySnapshot],
  );

  const todayReviews = useMemo(() => getTodayReviewItems(reviewItems), [reviewItems]);
  const dueReviewCounts = useMemo(() => {
    const theory = todayReviews.filter(isTheoryReviewItem).length;
    return { theory, generic: todayReviews.length - theory };
  }, [todayReviews]);

  const nextAction = useMemo(
    () =>
      buildHubNextAction({
        stages: hubStages,
        completedLessons,
        completedChapters,
        conceptScores,
        dueReviewCounts,
        theoryReady: theoryKnown,
        basicsCompleted,
      }),
    [hubStages, completedLessons, completedChapters, conceptScores, dueReviewCounts, theoryKnown, basicsCompleted],
  );

  const chapterLabels = useMemo(() => {
    const ids = new Set(
      hubStages.flatMap((stage) => [...stage.theoryChapterIds, ...stage.supplementalChapterIds]),
    );
    return Object.fromEntries(
      [...ids].map((id) => [id, t(`theory.chapterTitle.${id}`, { defaultValue: id })]),
    );
  }, [hubStages, t]);

  const lessonLabels = useMemo(() => {
    const ids = new Set(hubStages.flatMap((stage) => stage.lessonIds));
    return Object.fromEntries(
      [...ids].map((id) => [id, findLessonSummaryById(id)?.title ?? id]),
    );
  }, [hubStages]);

  const drillLessonIds = useMemo(
    () =>
      new Set(
        hubStages
          .flatMap((stage) => stage.lessonIds)
          .filter((id) => findLessonSummaryById(id)?.type === 'drill'),
      ),
    [hubStages],
  );

  const strategyMastery = useMemo<MasteryBlock>(() => {
    const ids = [...new Set(hubStages.flatMap((stage) => stage.lessonIds))].filter(
      (id) => findLessonSummaryById(id)?.type !== 'drill',
    );
    const scores: Record<string, number | undefined> = {};
    for (const id of ids) {
      scores[id] = lessonAttempts[id]?.firstScore ?? academyProgress.quizScores[id];
    }
    const summary = summarizeMastery(ids.map((id) => ({ id })), scores);
    const weakestId = summary.weakestId;
    return {
      summary,
      weakestId,
      weakestTitle: weakestId ? findLessonSummaryById(weakestId)?.title : undefined,
    };
  }, [hubStages, lessonAttempts, academyProgress]);

  const theoryMastery = useMemo<MasteryBlock | undefined>(() => {
    if (!theoryKnown) return undefined;
    const ids = [...new Set(hubStages.flatMap((stage) => stage.theoryChapterIds))];
    if (ids.length === 0) return undefined;
    const summary = summarizeMastery(ids.map((id) => ({ id })), conceptScores);
    const weakestId = summary.weakestId;
    return {
      summary,
      weakestId,
      weakestTitle: weakestId
        ? t(`theory.chapterTitle.${weakestId}`, { defaultValue: weakestId })
        : undefined,
    };
  }, [hubStages, conceptScores, theoryKnown, t]);

  const conceptPracticeRoute = useMemo(() => {
    if (nextAction.kind !== 'concept' || !nextAction.chapterId) return undefined;
    const lessonId = catalog.find((entry) => entry.chapterId === nextAction.chapterId)
      ?.practiceLessonIds?.[0];
    return lessonId ? `/lesson/${lessonId}` : undefined;
  }, [nextAction, catalog]);

  if (stages.length === 0) {
    return <div className="py-6"><PageSkeleton /></div>;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-5">
        <CourseHubHeader
          summary={summary}
          currentStage={currentStage}
          theoryKnown={theoryKnown}
          basicsCompleted={basicsCompleted}
        />
        <NextActionCard action={nextAction} secondaryRoute={conceptPracticeRoute} />

        <section aria-labelledby="course-hub-path-title">
          <SectionLabel as="h2" id="course-hub-path-title" className="mb-2">
            {t('academy.courseHub.pathTitle')}
          </SectionLabel>
          <div className="space-y-3">
            {hubStages.map((stage) => (
              <CourseStageCard
                key={stage.id}
                stage={stage}
                chapterLabels={chapterLabels}
                lessonLabels={lessonLabels}
                completedLessonIds={completedLessonSet}
                completedChapterIds={completedChapterSet}
                drillLessonIds={drillLessonIds}
                nextLessonId={nextAction.kind === 'practice' ? nextAction.targetId : undefined}
              />
            ))}
          </div>
        </section>

        <CourseMasteryDualCard strategy={strategyMastery} theory={theoryMastery} />

        <CourseHubCatalog />
      </div>
    </div>
  );
}