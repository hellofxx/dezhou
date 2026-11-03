import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, CircleDashed, Trophy, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import type { TheoryChapterSummary } from '../types';
import { isSupplementalChapter } from '../utils/theoryMeta';
import { summarizeMastery, type MasteryState } from '../utils/theoryMastery';

interface TheoryMasteryCardProps {
  /** 参与统计的章节目录；增补章（supplemental）在本卡内剔除——掌握度只计核心章 */
  chapters: TheoryChapterSummary[];
  /** 章末小测历史最高分（chapterId → 0-100） */
  quizScores: Record<string, number>;
}

const MASTERY_ROWS: Record<MasteryState, { icon: LucideIcon; tone: string }> = {
  mastered: {
    icon: Trophy,
    tone: 'bg-[var(--poker-success)]/12 text-[var(--poker-success)]',
  },
  passing: {
    icon: CheckCircle2,
    tone: 'bg-[var(--brass-bright)]/12 text-[var(--brass-bright)]',
  },
  needsReview: {
    icon: AlertTriangle,
    tone: 'bg-[var(--poker-terra)]/15 text-[var(--poker-terra-bright)]',
  },
  untested: {
    icon: CircleDashed,
    tone: 'bg-[var(--walnut-raised)] text-[var(--ivory-dim)]',
  },
};

const MASTERY_STATE_ORDER: MasteryState[] = ['mastered', 'passing', 'needsReview', 'untested'];

/**
 * 掌握度卡：从既有 quizScores 派生的四项计数 + 复习/继续 CTA。
 *
 * 只读 props，不调用任何解锁门禁、不写 store（PRD §5.27.2：掌握度只展示，不改变解锁）。
 * 统计范围按 core / 增补二分单源（`isSupplementalChapter`）收窄到核心章：
 * 增补章读完只影响 6-max 补强进度，不参与核心掌握度。
 */
export function TheoryMasteryCard({ chapters, quizScores }: TheoryMasteryCardProps) {
  const { t } = useTranslation();
  const coreChapters = chapters.filter((chapter) => !isSupplementalChapter(chapter));
  const summary = summarizeMastery(coreChapters, quizScores);
  const testedCount = summary.total - summary.untested;

  // 有已测章节 → 复习最低分章；全未测 → 继续学习（首个未测章，全部有分时退化为首章）
  const weakestChapter = summary.weakestChapterId
    ? coreChapters.find((chapter) => chapter.id === summary.weakestChapterId)
    : undefined;
  const nextChapter =
    weakestChapter ??
    coreChapters.find((chapter) => quizScores[chapter.id] === undefined) ??
    coreChapters[0];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.13 }}
      aria-label={t('theory.mastery.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('theory.mastery.title')}
      </h2>
      <div className="panel space-y-2.5">
        <p className="text-xs text-[var(--ivory-muted)] leading-relaxed">
          {t('theory.mastery.subtitle')}
        </p>

        <ul className="space-y-2">
          {MASTERY_STATE_ORDER.map((state) => {
            const row = MASTERY_ROWS[state];
            const Icon = row.icon;
            return (
              <li key={state} data-mastery-state={state} className="flex items-center gap-3">
                <span
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                    row.tone
                  )}
                  aria-hidden="true"
                >
                  <Icon className="w-3.5 h-3.5" />
                </span>
                <span className="flex-1 text-xs text-[var(--ivory-muted)]">
                  {t(`theory.mastery.${state}`)}
                </span>
                <span className="font-numeric text-sm text-[var(--ivory)]">{summary[state]}</span>
              </li>
            );
          })}
        </ul>

        {testedCount === 0 && (
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed pt-1 border-t border-[var(--walnut-border)]/60">
            {t('theory.mastery.empty')}
          </p>
        )}

        {nextChapter && (
          <Link
            to={`/theory/chapter/${nextChapter.id}`}
            className="inline-flex min-h-11 items-center gap-1.5 pt-1 text-xs font-semibold text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded-md"
          >
            {weakestChapter ? t('theory.mastery.reviewWeakest') : t('theory.mastery.continue')}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        )}
      </div>
    </motion.section>
  );
}
