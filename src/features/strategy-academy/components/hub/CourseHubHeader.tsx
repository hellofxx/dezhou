import { useTranslation } from 'react-i18next';
import { BookOpen, Target } from 'lucide-react';
import { ProgressRing } from '@/shared/components/data-display/ProgressRing';
import type { HubProgressSummary, HubStage } from '../../utils/hubStages';

interface CourseHubHeaderProps {
  summary: HubProgressSummary;
  currentStage: HubStage | undefined;
  theoryKnown: boolean;
  basicsCompleted: boolean;
}

export default function CourseHubHeader({
  summary,
  currentStage,
  theoryKnown,
  basicsCompleted,
}: CourseHubHeaderProps) {
  const { t } = useTranslation();
  const ratio = summary.totalLessons === 0 ? 0 : summary.doneLessons / summary.totalLessons;
  const title = basicsCompleted
    ? currentStage
      ? t(currentStage.titleKey)
      : t('academy.courseHub.pathTitle')
    : t('academy.courseHub.basicsFirstTitle');

  return (
    <section className="panel relative overflow-hidden" aria-labelledby="course-hub-title">
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--brass),transparent)]"
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="m-0 font-numeric text-[9px] uppercase tracking-[0.2em] text-[var(--brass-text)]">
            {t('academy.courseHub.eyebrow')}
          </p>
          <h2 id="course-hub-title" className="mt-2 font-display text-[22px] tracking-wide text-[var(--ivory)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">
            {basicsCompleted
              ? t('academy.courseHub.summary', {
                  done: summary.doneLessons,
                  total: summary.totalLessons,
                })
              : t('academy.courseHub.basicsFirstSub')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/50 px-2.5 py-1 text-[var(--ivory-dim)]">
              <BookOpen className="w-3.5 h-3.5 text-[var(--brass-text)]" aria-hidden="true" />
              {t('academy.courseHub.lanes.theory')}
              <span className="font-numeric text-[var(--ivory)]">
                {theoryKnown ? `${summary.doneChapters}/${summary.totalChapters}` : '—'}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-sm border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/50 px-2.5 py-1 text-[var(--ivory-dim)]">
              <Target className="w-3.5 h-3.5 text-[var(--brass-text)]" aria-hidden="true" />
              {t('academy.courseHub.lanes.practice')}
              <span className="font-numeric text-[var(--ivory)]">
                {summary.doneLessons}/{summary.totalLessons}
              </span>
            </span>
          </div>
        </div>
        <ProgressRing
          value={ratio}
          size={76}
          variant="academy"
          ariaLabel={t('academy.courseHub.ringAria', { pct: Math.round(ratio * 100) })}
          center={
            <span className="font-numeric text-base font-semibold text-[var(--brass-bright)]">
              {Math.round(ratio * 100)}%
            </span>
          }
        />
      </div>
    </section>
  );
}