import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, ShieldCheck, Target } from 'lucide-react';
import { ProgressRing } from '@/shared/components/data-display/ProgressRing';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import { hubFrom } from '@/shared/utils/courseBack';
import { getLessonMeta } from '../../data/lessonMeta';
import type { HubStage } from '../../utils/hubStages';

interface CourseStageCardProps {
  stage: HubStage;
  chapterLabels: Readonly<Record<string, string>>;
  lessonLabels: Readonly<Record<string, string>>;
  completedLessonIds: ReadonlySet<string>;
  completedChapterIds: ReadonlySet<string>;
  drillLessonIds: ReadonlySet<string>;
  nextLessonId?: string;
  /** 闭环步骤③（自查）仅标准变体显示，链接实战地图评估区锚点 */
  showCheckStep?: boolean;
}

function orderUnread<T extends string>(ids: readonly T[], done: ReadonlySet<string>): T[] {
  return [...ids.filter((id) => !done.has(id)), ...ids.filter((id) => done.has(id))];
}

function chipClass(done: boolean, highlight = false): string {
  return cn(
    'inline-flex min-h-11 items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors',
    FOCUS_RING,
    done
      ? 'border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 text-[var(--ivory-muted)]'
      : 'border-[var(--brass)]/40 bg-[var(--brass-glow)] text-[var(--ivory)] hover:border-[var(--brass)]',
    highlight && 'ring-1 ring-[var(--brass-bright)]/60',
  );
}

/** 双泳道迷你环：理论 / 实战各自播报；理论不可用或未就绪时占位，不伪造数据 */
function StageRing({
  lane,
  done,
  total,
  known,
  unavailable,
  icon,
}: {
  lane: string;
  done: number;
  total: number;
  known: boolean;
  unavailable?: boolean;
  icon: React.ReactNode;
}) {
  const { t } = useTranslation();

  if (!known || unavailable) {
    return (
      <div className="flex flex-col items-center gap-0.5">
        <ProgressRing
          value={0}
          size={40}
          variant="academy"
          status="idle"
          ariaLabel={t('academy.courseHub.loop.ringUnknown', { lane })}
        />
        <span
          className="inline-flex items-center gap-0.5 text-[11px] text-[var(--ivory-dim)]"
          aria-hidden="true"
        >
          {icon}—
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <ProgressRing
        value={total > 0 ? done / total : 0}
        size={40}
        variant="academy"
        ariaLabel={t('academy.courseHub.loop.ringAria', { lane, done, total })}
        center={
          <span className="font-numeric text-[11px] text-[var(--ivory)]">
            {done}/{total}
          </span>
        }
      />
      <span className="text-[var(--brass-text)]" aria-hidden="true">
        {icon}
      </span>
    </div>
  );
}

function Lane({
  title,
  step,
  icon,
  ids,
  doneIds,
  labels,
  route,
  emptyText,
  unavailable,
  known,
  nextId,
  drillIds,
  stageIndex,
  subtitleFor,
}: {
  title: string;
  step: string;
  icon: React.ReactNode;
  ids: readonly string[];
  doneIds: ReadonlySet<string>;
  labels: Readonly<Record<string, string>>;
  route: (id: string) => string;
  emptyText: string;
  unavailable: boolean;
  known: boolean;
  nextId?: string;
  drillIds?: ReadonlySet<string>;
  stageIndex: number;
  subtitleFor?: (id: string) => string | undefined;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const ordered = orderUnread(ids, doneIds);
  const visible = expanded ? ordered : ordered.slice(0, 2);
  // 阶段锚点回位：执行页返回枢纽时带 stageIndex（§来源感知返回）
  const linkState = hubFrom(stageIndex);

  return (
    <div className="min-w-0">
      <h4 className="m-0 mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ivory-muted)]">
        <span className="font-numeric text-[var(--brass-text)]" aria-hidden="true">
          {step}
        </span>
        <span className="text-[var(--brass-text)]" aria-hidden="true">
          {icon}
        </span>
        {title}
        <span className="font-numeric text-[var(--ivory-dim)]">
          {known ? `${doneIds.size}/${ids.length}` : '—'}
        </span>
      </h4>
      {unavailable ? (
        <p className="m-0 text-xs leading-relaxed text-[var(--ivory-muted)]">{emptyText}</p>
      ) : ids.length === 0 ? (
        <p className="m-0 text-xs text-[var(--ivory-muted)]">{emptyText}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {visible.map((id) => {
              const done = doneIds.has(id);
              const subtitle = subtitleFor?.(id);
              return (
                <Link
                  key={id}
                  to={route(id)}
                  state={linkState}
                  className={cn(
                    chipClass(done, id === nextId),
                    subtitle && 'flex-col items-start justify-center gap-0.5',
                  )}
                  aria-current={id === nextId ? 'step' : undefined}
                >
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <span className="truncate">{labels[id] ?? id}</span>
                    {drillIds?.has(id) ? (
                      <span className="rounded-sm border border-[var(--brass)]/40 px-1 text-[9px] uppercase tracking-wider text-[var(--brass-text)]">
                        {t('academy.courseHub.lanes.drillBadge')}
                      </span>
                    ) : null}
                  </span>
                  {subtitle ? (
                    <span className="max-w-full truncate text-[11px] font-normal text-[var(--ivory-muted)]">
                      {subtitle}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
          {ordered.length > 2 ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-expanded={expanded}
              className={cn(
                'mt-2 inline-flex min-h-11 items-center gap-1 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)]',
                FOCUS_RING,
              )}
            >
              {expanded ? t('academy.courseHub.lanes.collapse') : t('academy.courseHub.lanes.viewAll')}
              <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden="true" />
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}

export default function CourseStageCard({
  stage,
  chapterLabels,
  lessonLabels,
  completedLessonIds,
  completedChapterIds,
  drillLessonIds,
  nextLessonId,
  showCheckStep = false,
}: CourseStageCardProps) {
  const { t } = useTranslation();
  const doneLessons = new Set(stage.lessonIds.filter((id) => completedLessonIds.has(id)));
  const doneChapters = new Set(stage.theoryChapterIds.filter((id) => completedChapterIds.has(id)));
  // 课时级配对：实战 chip 展示首个理论锚点章标题（无锚点 / 未标注章降级不显示）
  const anchorTitleFor = useCallback(
    (lessonId: string): string | undefined => {
      const anchorId = getLessonMeta(lessonId).theoryAnchors[0];
      const anchorTitle = anchorId ? chapterLabels[anchorId] : undefined;
      return anchorTitle
        ? t('academy.courseHub.lanes.anchorPrefix', { title: anchorTitle })
        : undefined;
    },
    [chapterLabels, t],
  );

  return (
    <section
      id={`hub-stage-${stage.index}`}
      className="panel overflow-hidden"
      aria-labelledby={`hub-stage-${stage.index}-title`}
      data-hub-stage={stage.index}
      data-hub-theory-ratio={stage.totalChapters ? stage.doneChapters / stage.totalChapters : 0}
      data-hub-practice-ratio={stage.totalLessons ? stage.doneLessons / stage.totalLessons : 0}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="m-0 font-numeric text-[9px] uppercase tracking-[0.2em] text-[var(--brass-text)]">
            {String(stage.index).padStart(2, '0')}
          </p>
          <h3 id={`hub-stage-${stage.index}-title`} className="mt-1 font-display text-[17px] text-[var(--ivory)]">
            {t(stage.titleKey)}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--ivory-muted)]">{t(stage.subtitleKey)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)]">
            {stage.complete
              ? t('academy.courseHub.status.done')
              : stage.current
                ? t('academy.courseHub.status.current')
                : t('academy.courseHub.status.locked')}
          </span>
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label={t('academy.courseHub.loop.ringsLabel')}
          >
            <StageRing
              lane={t('academy.courseHub.lanes.theory')}
              icon={<BookOpen className="h-3 w-3" />}
              done={stage.doneChapters}
              total={stage.totalChapters}
              known={stage.theoryKnown}
              unavailable={stage.theoryUnavailable}
            />
            <StageRing
              lane={t('academy.courseHub.lanes.practice')}
              icon={<Target className="h-3 w-3" />}
              done={stage.doneLessons}
              total={stage.totalLessons}
              known
            />
          </div>
        </div>
      </div>

      <div className={cn('mt-4 grid gap-4', stage.unlocked ? 'md:grid-cols-2' : 'opacity-60')}>
        <Lane
          title={t('academy.courseHub.lanes.theory')}
          step="01"
          icon={<BookOpen className="w-3.5 h-3.5" />}
          ids={stage.theoryChapterIds}
          doneIds={doneChapters}
          labels={chapterLabels}
          route={(id) => `/theory/chapter/${id}`}
          emptyText={stage.theoryUnavailable ? t('academy.courseHub.theoryUnavailable') : t('academy.courseHub.lanes.emptyTheory')}
          unavailable={stage.theoryUnavailable}
          known={stage.theoryKnown}
          stageIndex={stage.index}
        />
        <Lane
          title={t('academy.courseHub.lanes.practice')}
          step="02"
          icon={<Target className="w-3.5 h-3.5" />}
          ids={stage.lessonIds}
          doneIds={doneLessons}
          labels={lessonLabels}
          route={(id) => `/lesson/${id}`}
          emptyText={t('academy.courseHub.lanes.emptyPractice')}
          unavailable={false}
          known
          nextId={nextLessonId}
          drillIds={drillLessonIds}
          stageIndex={stage.index}
          subtitleFor={anchorTitleFor}
        />
      </div>

      {showCheckStep ? (
        <div className={cn('mt-3 border-t border-[var(--walnut-border)]/50 pt-2', !stage.unlocked && 'opacity-60')}>
          <Link
            to="/academy#assessment"
            className={cn(
              'inline-flex min-h-11 items-center gap-1.5 rounded-md px-1 text-xs text-[var(--ivory-muted)] transition-colors hover:text-[var(--brass-bright)]',
              FOCUS_RING,
            )}
          >
            <span className="font-numeric text-[var(--brass-text)]" aria-hidden="true">
              03
            </span>
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--brass-text)]" aria-hidden="true" />
            {t('academy.courseHub.loop.check')}
            <span className="text-[var(--ivory-dim)]">· {t('academy.courseHub.loop.checkHint')}</span>
            <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      {stage.supplementalChapterIds.length > 0 ? (
        <details className="mt-3 border-t border-[var(--walnut-border)]/50 pt-2">
          <summary className={cn('flex min-h-11 cursor-pointer items-center gap-1 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)]', FOCUS_RING)}>
            {t('academy.courseHub.supplemental.title')}
            <span className="font-numeric">({stage.supplementalChapterIds.length})</span>
          </summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {stage.supplementalChapterIds.map((id) => (
              <Link
                key={id}
                to={`/theory/chapter/${id}`}
                state={hubFrom(stage.index)}
                className={chipClass(false)}
              >
                {chapterLabels[id] ?? id}
              </Link>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}