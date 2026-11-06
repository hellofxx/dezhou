import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck, BookOpen, CheckCircle2, Clock, PlayCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { TheoryChapterSummary } from '../types';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryChapterChipProps {
  chapter: TheoryChapterSummary;
  completed: boolean;
  isNext: boolean;
  score: number | undefined;
  /** 是否已收藏（缺省 false） */
  bookmarked?: boolean;
  onOpen: () => void;
  /** 收藏切换；缺省时不渲染收藏按钮（纯展示场景） */
  onToggleBookmark?: () => void;
}

/**
 * 阶梯里的章节 chip：状态图标 + 标题 + 阅读时长 + 小测分徽章（增补章带「可选」标记）。
 * 收藏按钮是 chip 的兄弟节点而非嵌套按钮（HTML 不允许 button 套 button），
 * 因此 <li> 内是「主按钮 + 收藏按钮」两段式结构。
 */
export function TheoryChapterChip({
  chapter,
  completed,
  isNext,
  score,
  bookmarked = false,
  onOpen,
  onToggleBookmark,
}: TheoryChapterChipProps) {
  const { t } = useTranslation();
  const optional = chapter.supplemental === true;
  const title = resolveChapterTitle(t, chapter);
  const stateLabel = completed
    ? t('theory.ladder.chapterStates.done')
    : optional
      ? t('theory.ladder.chapterStates.optional')
      : isNext
        ? t('theory.ladder.chapterStates.current')
        : t('theory.ladder.chapterStates.locked');

  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${stateLabel} · ${title}`}
        className={cn('lesson-chip flex-1 min-w-0', completed && 'done', isNext && 'current')}
      >
        <span className="lesson-chip-icon" aria-hidden="true">
          {completed ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : isNext ? (
            <PlayCircle className="w-3 h-3" />
          ) : (
            <BookOpen className="w-3 h-3" />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate">{title}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {bookmarked && (
            <Bookmark
              className="w-3 h-3 text-[var(--brass-bright)]"
              aria-hidden="true"
            />
          )}
          {optional && !completed && (
            <span className="px-1.5 py-0.5 rounded-full border border-[var(--brass-deep)]/50 text-[9px] font-semibold text-[var(--brass-bright)]">
              {t('theory.ladder.chapterStates.optional')}
            </span>
          )}
          {completed && typeof score === 'number' && (
            <span
              className={cn(
                'quiz-score-badge',
                score >= 80 && 'pass',
                score >= 60 && score < 80 && 'mid',
                score < 60 && 'low',
              )}
            >
              {t('theory.ladder.quizScore', { score })}
            </span>
          )}
          <span className="text-[9px] font-numeric opacity-70 inline-flex items-center gap-1 shrink-0">
            <Clock className="w-2.5 h-2.5" aria-hidden="true" />
            {chapter.duration.replace(/ ?(min|分钟)$/, '')}
          </span>
        </span>
      </button>
      {onToggleBookmark && (
        <button
          type="button"
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          aria-label={`${bookmarked ? t('theory.bookmarks.remove') : t('theory.bookmarks.add')} · ${title}`}
          className={cn(
            'inline-flex min-h-11 min-w-9 items-center justify-center rounded-md transition-colors',
            FOCUS_RING,
            bookmarked
              ? 'text-[var(--brass-bright)]'
              : 'text-[var(--ivory-dim)] hover:text-[var(--ivory)]',
          )}
        >
          {bookmarked ? (
            <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>
      )}
    </li>
  );
}
