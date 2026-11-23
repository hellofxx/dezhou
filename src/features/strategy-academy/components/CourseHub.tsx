import { useCallback, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
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
import { VariantToggle } from './VariantToggle';
import type { PokerVariant } from '@/shared/types/elo';
import { useAcademyStore } from '../store';
import { findLessonSummaryById } from '../utils/academyMeta';
import { buildHubStages, summarizeHubProgress } from '../utils/hubStages';
import { getLessonMeta } from '../data/lessonMeta';
import { buildConceptScores } from '../utils/hubConcepts';
import { buildHubNextAction } from '../utils/hubNextAction';
import { useTheoryLearningSnapshot } from '../hooks/useTheoryLearningSnapshot';
import CourseHubHeader from './hub/CourseHubHeader';
import NextActionCard from './hub/NextActionCard';
import CourseStageCard from './hub/CourseStageCard';
import CourseHubCatalog from './hub/CourseHubCatalog';
import CourseMasteryDualCard, { type MasteryBlock } from './hub/CourseMasteryDualCard';
import CourseCoverageCard from './hub/CourseCoverageCard';

/**
 * 课程枢纽（/lesson）：策略实战 + 理论概念双泳道。
 * 理论数据只经 shared TheoryDataSource 读取；progress 只经公共入口读取。
 */
export default function CourseHub() {
  const { t } = useTranslation();
  const location = useLocation();
  const { stages } = useAcademyLearningStages();
  const { completedLessons } = useAcademyProgressSnapshot();
  const basicsCompleted = useAcademyStore((s) => s.basicsProgress.completed);
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const switchAcademyVariant = useAcademyStore((s) => s.switchVariant);
  const lessonAttempts = useAcademyStore((s) => s.lessonAttempts);
  const academyProgress = useAcademyStore((s) => s.progress);
  const reviewItems = useProgressState((s) => s.reviewItems);
  const theorySnapshot = useTheoryLearningSnapshot();
  const theoryKnown = theorySnapshot !== undefined;
  const completedChapters = theorySnapshot?.completedChapters ?? [];

  // 枢纽是变体切换的唯一命令发出方：一次切换同时驱动策略与理论两院。
  const handleVariantSelect = useCallback(
    (variant: PokerVariant) => {
      switchAcademyVariant(variant);
      getTheoryDataSource()?.switchVariant?.(variant);
    },
    [switchAcademyVariant],
  );

  // 冷启动对齐：理论 store 变体可能落后于策略 canonical 变体，仅在两侧不一致时补一次；
  // 对齐后理论快照会更新但 theoryKnown 仍为 true，依赖不变故不会回环。
  useEffect(() => {
    if (!theoryKnown) return;
    const theory = getTheoryDataSource();
    const theoryVariant = theory?.getActiveVariant?.();
    if (theoryVariant === undefined || theoryVariant === activeVariant) return;
    theory?.switchVariant?.(activeVariant);
  }, [activeVariant, theoryKnown]);

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

  // 覆盖报告：理论章节（关联 / 补充）与实战课时（带理论锚点）的双向映射概览
  const coverage = useMemo(() => {
    const mappedChapters = new Set(hubStages.flatMap((stage) => stage.theoryChapterIds)).size;
    const supplementalChapters = new Set(
      hubStages.flatMap((stage) => stage.supplementalChapterIds),
    ).size;
    const lessonIds = [...new Set(hubStages.flatMap((stage) => stage.lessonIds))];
    const anchoredLessons = lessonIds.filter(
      (id) => getLessonMeta(id).theoryAnchors.length > 0,
    ).length;
    const unavailable =
      activeVariant === 'short-deck' && hubStages.every((stage) => stage.theoryUnavailable);
    return {
      mappedChapters,
      supplementalChapters,
      anchoredLessons,
      totalLessons: lessonIds.length,
      unavailable,
    };
  }, [hubStages, activeVariant]);

  const conceptPracticeRoute = useMemo(() => {
    if (nextAction.kind !== 'concept' || !nextAction.chapterId) return undefined;
    const lessonId = catalog.find((entry) => entry.chapterId === nextAction.chapterId)
      ?.practiceLessonIds?.[0];
    return lessonId ? `/lesson/${lessonId}` : undefined;
  }, [nextAction, catalog]);

  // 阶段锚点回位：#hub-stage-N（执行页/理论页返回枢纽）；短延迟等待阶段卡挂载
  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.slice(1);
    if (!id) return;
    // scrollIntoView 是 JS API，不受 globals.css 的 reduced-motion 兜底约束
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [location.hash]);

  if (stages.length === 0) {
    return <div className="py-6"><PageSkeleton /></div>;
  }

  return (
    <div className="h-full overflow-auto">
      <div className="py-4 space-y-5">
        <div className="panel variant-panel" aria-labelledby="course-hub-variant-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <SectionLabel as="h2" id="course-hub-variant-title">
                {t('variant.selectVariant')}
              </SectionLabel>
              <p className="mt-1 text-xs text-[var(--ivory-muted)]">
                {t(`variant.name.${activeVariant}`)}
              </p>
            </div>
            <VariantToggle active={activeVariant} onSelect={handleVariantSelect} />
          </div>
        </div>
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

        <CourseCoverageCard {...coverage} />

        <CourseHubCatalog />
      </div>
    </div>
  );
}