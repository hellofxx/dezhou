import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, CheckCircle2, Clock, Target } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';
import { ProgressBar } from '@/shared/components/business/ProgressBar';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import { getChapterDifficulty } from '../utils/theoryMeta';
import {
  resolveChapterSubtitle,
  resolveChapterTitle,
  resolveTheoryLevelTitle,
} from '../utils/titleKeys';
import { resolveTheoryObjectives } from '../utils/contentKeys';

interface TheoryChapterHeaderProps {
  chapter: TheoryChapter;
  level: TheoryLevelInfo;
  completedChapters: string[];
  chapterCompleted: boolean;
  bestScore?: number;
  /** 本章是否已收藏（缺省 false，收藏按钮仍可点） */
  bookmarked?: boolean;
  /** 收藏切换回调；缺省时不渲染收藏按钮（纯展示场景） */
  onToggleBookmark?: () => void;
  /** 内容最近校对日期（ISO 8601，来自 data/contentOps.ts）；无记录时不渲染 */
  lastReviewed?: string;
  /**
   * 报告内容问题入口插槽。
   * 实际组件（assessment 侧的 ContentIssueReport）在后续批次接入，本组件只预留摆放位置，
   * 不引入任何评估侧依赖。
   */
  reportSlot?: ReactNode;
}

/** 章节页头部：Level/章节标题 + 难度/完成态 + 收藏 / 校对日期 / 报告入口 + 学习目标卡 */
export function TheoryChapterHeader({
  chapter,
  level,
  completedChapters,
  chapterCompleted,
  bestScore,
  bookmarked = false,
  onToggleBookmark,
  lastReviewed,
  reportSlot,
}: TheoryChapterHeaderProps) {
  const { t } = useTranslation();
  const completedInLevel = level.chapters.filter((item) =>
    completedChapters.includes(item.id),
  ).length;
  const progress =
    level.chapters.length > 0
      ? Math.round((completedInLevel / level.chapters.length) * 100)
      : 0;
  const difficulty = getChapterDifficulty(chapter.level);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionStandard}
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)]">
            {level.icon} T{level.level} · {resolveTheoryLevelTitle(t, level)}
          </span>
          <span className="font-numeric text-xs text-[var(--ivory-muted)]">
            {t('theory.chapterView.chapterOf', {
              current: chapter.order,
              total: level.chapters.length,
            })}
          </span>
          <div className="flex-1 min-w-[160px]">
            <ProgressBar
              label={t('theory.chapterView.chapterOf', {
                current: chapter.order,
                total: level.chapters.length,
              })}
              value={progress}
              size="sm"
            />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-display text-[22px] md:text-[26px] leading-tight text-[var(--ivory)] mb-1">
              {resolveChapterTitle(t, chapter)}
            </h2>
            <p className="text-sm text-[var(--ivory-dim)]">{resolveChapterSubtitle(t, chapter)}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--ivory-muted)] shrink-0 pt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {chapter.duration}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide',
                difficulty < 0.35
                  ? 'bg-[var(--poker-success-bg)] text-[var(--poker-success)]'
                  : difficulty < 0.6
                    ? 'bg-[var(--poker-warning-bg)] text-[var(--poker-warning)]'
                    : 'bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
              )}
            >
              {difficulty < 0.35
                ? t('theory.difficultyBasic')
                : difficulty < 0.6
                  ? t('theory.difficultyMid')
                  : t('theory.difficultyAdvanced')}
            </span>
            {chapterCompleted && (
              <span className="inline-flex items-center gap-1 text-[var(--poker-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('theory.chapterView.completed')}
              </span>
            )}
            {chapterCompleted && typeof bestScore === 'number' && (
              <span className="font-numeric text-[var(--brass-bright)]">
                {t('theory.chapterView.bestScore', { score: bestScore })}
              </span>
            )}
          </div>
        </div>

        {/* 阅读工具行：收藏 / 最近校对 / 报告问题（插槽待评估侧组件接入） */}
        {(onToggleBookmark || lastReviewed || reportSlot) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--ivory-muted)]">
            {onToggleBookmark && (
              <button
                type="button"
                onClick={onToggleBookmark}
                aria-pressed={bookmarked}
                aria-label={bookmarked ? t('theory.bookmarks.remove') : t('theory.bookmarks.add')}
                className={cn(
                  'inline-flex min-h-11 items-center gap-1.5 rounded px-1.5 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                  bookmarked
                    ? 'text-[var(--brass-bright)]'
                    : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]',
                )}
              >
                {bookmarked ? (
                  <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Bookmark className="w-4 h-4" aria-hidden="true" />
                )}
                {bookmarked ? t('theory.bookmarks.remove') : t('theory.bookmarks.add')}
              </button>
            )}
            {lastReviewed && (
              <span className="font-numeric">
                {t('theory.contentMeta.lastReviewed', { date: lastReviewed })}
              </span>
            )}
            {reportSlot}
          </div>
        )}
      </motion.div>

      {chapter.objectives && chapter.objectives.length > 0 && (
        <div className="panel border-[var(--poker-frost)]/40 bg-[var(--poker-frost-bg)] max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold text-[var(--poker-frost)] mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 shrink-0" />
            {t('theory.objectives')}
          </h2>
          <ul className="space-y-1">
            {resolveTheoryObjectives(t, chapter.id, chapter.objectives).map((objective, index) => (
              <li
                key={index}
                className="text-sm text-[var(--ivory-dim)] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[var(--poker-frost)] mt-0.5 shrink-0">•</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
