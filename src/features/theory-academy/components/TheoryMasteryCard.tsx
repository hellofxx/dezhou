import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  TrendingUp,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import type {
  TheoryChapterAttempt,
  TheoryChapterSummary,
  TheoryCheckpointAttempt,
  TheoryLevelSummary,
} from '../types';
import { getCoreChaptersOfLevel, isSupplementalChapter } from '../utils/theoryMeta';
import { summarizeMastery, type MasteryState } from '../utils/theoryMastery';

interface TheoryMasteryCardProps {
  /** 参与统计的章节目录；增补章（supplemental）在本卡内剔除——掌握度只计核心章 */
  chapters: TheoryChapterSummary[];
  /** 章末小测历史最高分（chapterId → 0-100） */
  quizScores: Record<string, number>;
  /**
   * 章末小测尝试记录（可选）：传入时掌握度按**首次成绩**口径统计，
   * 省略时退化为 quizScores（历史最高分），与旧调用方兼容。
   */
  chapterAttempts?: Record<string, TheoryChapterAttempt>;
  /** 已完成章节 id（可选）：与 levels 一起决定检查点入口开放条件 */
  completedChapters?: readonly string[];
  /** Level 序列（可选）：传入时渲染已读完 Level 的检查点入口 */
  levels?: TheoryLevelSummary[];
  /** checkpoints 记录（可选）：用于在检查点入口旁显示历史最佳 */
  checkpoints?: Record<string, TheoryCheckpointAttempt>;
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
 * 掌握度卡：从既有 quizScores / chapterAttempts 派生的四项计数 + 复习/继续 CTA + 检查点入口。
 *
 * 只读 props，不调用任何解锁门禁、不写 store（PRD §5.27.2：掌握度只展示，不改变解锁）。
 * 统计范围按 core / 增补二分单源（`isSupplementalChapter`）收窄到核心章：
 * 增补章读完只影响 6-max 补强进度，不参与核心掌握度。
 * 成绩口径：有 chapterAttempts 时取首次成绩（重考不改掌握度），仅展示练习最佳作为参考。
 */
export function TheoryMasteryCard({
  chapters,
  quizScores,
  chapterAttempts,
  completedChapters,
  levels,
  checkpoints,
}: TheoryMasteryCardProps) {
  const { t } = useTranslation();
  const coreChapters = chapters.filter((chapter) => !isSupplementalChapter(chapter));
  const summary = summarizeMastery(coreChapters, quizScores, chapterAttempts);
  const testedCount = summary.total - summary.untested;

  // 练习口径最佳：只统计本卡范围内的章节（重考刷分不改变掌握度，但值得展示）
  const practiceBest = coreChapters.reduce((best, chapter) => {
    const attempt = chapterAttempts?.[chapter.id];
    if (!attempt) return best;
    return Math.max(best, attempt.bestScore);
  }, 0);
  const hasPractice = coreChapters.some((chapter) => chapterAttempts?.[chapter.id] !== undefined);

  // 已读完的 Level → 检查点入口（形成性自查，不解锁下一级）
  const checkpointLevels = (levels ?? []).filter((level) => {
    const core = getCoreChaptersOfLevel(level);
    if (core.length === 0) return false;
    return completedChapters
      ? core.every((chapter) => completedChapters.includes(chapter.id))
      : core.every((chapter) => quizScores[chapter.id] !== undefined);
  });

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

        {hasPractice && (
          <div className="flex items-center gap-3 pt-1.5 border-t border-[var(--walnut-border)]/60">
            <span
              className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-[var(--poker-info)]/12 text-[var(--poker-info)]"
              aria-hidden="true"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <span className="flex-1 text-xs text-[var(--ivory-muted)]">
              {t('theory.quiz.bestScoreLabel')}
              <span className="block text-[10px] text-[var(--ivory-dim)]">
                {t('theory.quiz.practiceOnly')}
              </span>
            </span>
            <span className="font-numeric text-sm text-[var(--ivory)]">{practiceBest}</span>
          </div>
        )}

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

        {checkpointLevels.length > 0 && (
          <ul className="space-y-1 pt-1.5 border-t border-[var(--walnut-border)]/60">
            {checkpointLevels.map((level) => {
              const record = checkpoints?.[level.id];
              return (
                <li key={level.id}>
                  <Link
                    to={`/theory/checkpoint/${level.id}`}
                    className="inline-flex min-h-11 w-full items-center gap-1.5 text-xs text-[var(--poker-info)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded-md"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      T{level.level} · {t('theory.level.checkpointEntry')}
                    </span>
                    {record && (
                      <span className="ml-auto font-numeric text-[10px] text-[var(--ivory-muted)]">
                        {t('theory.checkpoint.bestScore', { score: record.bestScore })}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
