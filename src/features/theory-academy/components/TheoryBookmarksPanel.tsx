import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, BookmarkX, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';
import type { TheoryChapterSummary } from '../types';
import { findChapterSummaryById } from '../utils/theoryMeta';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryBookmarksPanelProps {
  /** 收藏章节 id 列表（store.progress.bookmarkedChapters） */
  bookmarks: readonly string[];
  /** 取消收藏回调（store.toggleBookmark）；strip 变体不传则只读展示 */
  onToggle?: (chapterId: string) => void;
  /** strip = 首页横向条；panel = 完整列表（带取消按钮与空态说明） */
  variant?: 'strip' | 'panel';
}

/**
 * 收藏章节面板。
 * 只消费目录摘要层（manifest）：不触发正文加载，首屏渲染零额外 chunk。
 * 收藏本身是纯阅读书签：不参与解锁、不影响掌握度与能力分。
 */
export function TheoryBookmarksPanel({
  bookmarks,
  onToggle,
  variant = 'panel',
}: TheoryBookmarksPanelProps) {
  const { t } = useTranslation();
  const chapters = bookmarks
    .map((id) => findChapterSummaryById(id))
    .filter((chapter): chapter is TheoryChapterSummary => chapter !== undefined);

  if (variant === 'strip') {
    return (
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitionStandard, delay: 0.08 }}
        aria-label={t('theory.bookmarks.title')}
        className="panel"
      >
        <div className="flex items-center gap-2 mb-2">
          <BookmarkCheck className="w-3.5 h-3.5 text-[var(--brass-bright)]" aria-hidden="true" />
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
            {t('theory.bookmarks.title')}
          </h2>
          <span className="font-numeric text-[11px] text-[var(--ivory-muted)]">
            {chapters.length}
          </span>
        </div>
        {chapters.length === 0 ? (
          <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">
            {t('theory.bookmarks.empty')}
          </p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {chapters.map((chapter) => (
              <li key={chapter.id} className="shrink-0">
                <Link
                  to={`/theory/chapter/${chapter.id}`}
                  className="inline-flex min-h-11 max-w-[240px] items-center gap-1.5 rounded-full border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/60 px-3 text-xs text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  <Bookmark className="w-3 h-3 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
                  <span className="truncate">{resolveChapterTitle(t, chapter)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    );
  }

  return (
    <section aria-label={t('theory.bookmarks.title')} className="panel space-y-2">
      <div className="flex items-center gap-2">
        <BookmarkCheck className="w-4 h-4 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
          {t('theory.bookmarks.title')}
        </h2>
        <span className="font-numeric text-[11px] text-[var(--ivory-muted)]">{chapters.length}</span>
      </div>

      {chapters.length === 0 ? (
        <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">
          {t('theory.bookmarks.empty')}
        </p>
      ) : (
        <ul className="space-y-1">
          {chapters.map((chapter) => (
            <li key={chapter.id} className="flex items-center gap-1">
              <Link
                to={`/theory/chapter/${chapter.id}`}
                className="flex min-h-11 flex-1 min-w-0 items-center gap-2 rounded-md px-1.5 text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--felt-raised)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
              >
                <Bookmark className="w-3.5 h-3.5 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
                <span className="truncate">{resolveChapterTitle(t, chapter)}</span>
                <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0 text-[var(--ivory-dim)]" aria-hidden="true" />
              </Link>
              {onToggle && (
                <button
                  type="button"
                  onClick={() => onToggle(chapter.id)}
                  aria-label={`${t('theory.bookmarks.remove')} · ${resolveChapterTitle(t, chapter)}`}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md',
                    'text-[var(--ivory-muted)] hover:text-[var(--poker-terra-bright)] transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                  )}
                >
                  <BookmarkX className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
