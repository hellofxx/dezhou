import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, CalendarClock, Flag, FlagOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import { toLocalDateString } from '@/shared/utils/spacedRepetition';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { resolveChapterTitle, resolveTheoryLevelTitle } from '../utils/titleKeys';
import {
  buildFlaggedReviewEntries,
  resolveFlaggedQuestionText,
  type FlaggedReviewEntry,
} from '../utils/flaggedReviewModel';

/**
 * 疑难标记复习清单页（/theory/review）：
 * 把 progress.flaggedQuestions 从「只有一个计数」升级为可复习出口 ——
 * 逐条列出题干、所属章节/Level、SRS 队列状态，每条可跳转章节或取消标记。
 *
 * 职责边界（刻意）：本页只做清单与导航，不判分、不入队、不调 recordAnswer / updateElo /
 * addReviewItem；判分与间隔调度归章末小测（TheoryChapterView），已在队列的题在此只读展示。
 * 脏 id（存档残留的已删题）在派生层已静默跳过，页面不会白屏。
 */
export default function TheoryFlaggedReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const flaggedQuestions = useTheoryStore((s) => s.progress.flaggedQuestions);
  const toggleFlagQuestion = useTheoryStore((s) => s.toggleFlagQuestion);
  const reviewItems = useProgressStore((s) => s.reviewItems);

  const entries = useMemo(
    () => buildFlaggedReviewEntries(flaggedQuestions, reviewItems),
    [flaggedQuestions, reviewItems],
  );

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <button
          onClick={() => navigate('/theory')}
          aria-label={t('theory.flagged.backAria')}
          className="inline-flex min-h-11 items-center gap-1.5 px-2 rounded text-xs text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('theory.title')}
        </button>

        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionStandard}
        >
          <h1 className="font-display text-[22px] md:text-[26px] leading-tight text-[var(--ivory)] mb-1">
            {t('theory.flagged.title')}
          </h1>
          <p className="text-sm text-[var(--ivory-dim)] max-w-2xl">{t('theory.flagged.subtitle')}</p>
        </motion.div>

        {entries.length === 0 ? (
          <EmptyState
            icon={<Flag className="w-6 h-6" />}
            title={t('theory.flagged.emptyTitle')}
            description={t('theory.flagged.emptyDescription')}
            action={{ label: t('theory.flagged.emptyCta'), onClick: () => navigate('/theory') }}
          />
        ) : (
          <>
            <p className="font-numeric text-xs text-[var(--brass-bright)]" aria-live="polite">
              {t('theory.flagged.count', { count: entries.length })}
            </p>
            <ul className="space-y-3" aria-label={t('theory.flagged.listAria')}>
              {entries.map((entry) => (
                <li key={entry.questionId}>
                  <FlaggedRow entry={entry} onUnflag={toggleFlagQuestion} />
                </li>
              ))}
            </ul>
            <p className="text-xs text-[var(--ivory-muted)] px-1">{t('theory.flagged.gradingNote')}</p>
          </>
        )}
      </div>
    </div>
  );
}

/** 单条疑难条目：题干 + 章节归属 + SRS 状态 + 跳转/取消标记 */
function FlaggedRow({
  entry,
  onUnflag,
}: {
  entry: FlaggedReviewEntry;
  onUnflag: (questionId: string) => void;
}) {
  const { t } = useTranslation();
  const questionText = resolveFlaggedQuestionText(t, entry);

  return (
    <article className="panel space-y-2.5">
      <div className="flex flex-wrap items-center gap-2 text-[11px]">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-2.5 py-0.5 font-medium text-[var(--brass-bright)]">
          {entry.level.icon} T{entry.level.level} · {resolveTheoryLevelTitle(t, entry.level)}
        </span>
        <span className="text-[var(--ivory-dim)]">{resolveChapterTitle(t, entry.chapter)}</span>
        {/* 清单跨变体，而 T1-T9 编号在三变体各自独立，故显式标注变体避免混淆 */}
        <span className="text-[var(--ivory-dim)]/80">· {t(`variant.name.${entry.variant}`)}</span>
      </div>

      <h2 className="font-display text-[15px] leading-snug text-[var(--ivory)]">{questionText}</h2>

      <SrsStatus entry={entry} />

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Link
          to={entry.route}
          aria-label={t('theory.flagged.gotoChapterAria', { chapter: resolveChapterTitle(t, entry.chapter) })}
          className="inline-flex min-h-11 items-center gap-1.5 px-3 rounded-lg border border-[var(--walnut-border)] text-xs font-semibold text-[var(--brass-bright)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        >
          {t('theory.flagged.gotoChapter')}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <button
          onClick={() => onUnflag(entry.questionId)}
          aria-label={t('theory.flagged.unflagAria', { question: questionText })}
          className={cn(
            'inline-flex min-h-11 items-center gap-1.5 px-3 rounded-lg border text-xs',
            'border-[var(--walnut-border)]/50 text-[var(--ivory-muted)]',
            'hover:text-[var(--ivory)] hover:border-[var(--brass)]/40 transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
          )}
        >
          <FlagOff className="w-3.5 h-3.5" />
          {t('theory.flagged.unflag')}
        </button>
      </div>
    </article>
  );
}

/** SRS 队列状态行：已入队显示上次/下次复习日期；未入队说明入队条件（不重复入队，仅提示） */
function SrsStatus({ entry }: { entry: FlaggedReviewEntry }) {
  const { t } = useTranslation();
  if (!entry.inSrsQueue) {
    return (
      <p className="text-[11px] text-[var(--ivory-muted)]">{t('theory.flagged.srsNotQueued')}</p>
    );
  }
  return (
    <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--poker-frost)]">
      <span className="inline-flex items-center gap-1.5">
        <CalendarClock className="w-3.5 h-3.5 shrink-0" />
        {t('theory.flagged.srsInQueue')}
      </span>
      {entry.lastReviewedAt !== undefined ? (
        <span className="font-numeric">
          {t('theory.flagged.srsLastReviewed', { date: toLocalDateString(entry.lastReviewedAt) })}
        </span>
      ) : null}
      {entry.nextReviewDate ? (
        <span className="font-numeric">
          {t('theory.flagged.srsNextReview', { date: entry.nextReviewDate })}
        </span>
      ) : null}
    </p>
  );
}
