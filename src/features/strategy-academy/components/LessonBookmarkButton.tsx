import { useTranslation } from 'react-i18next';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { useAcademyStore } from '../store';

interface LessonBookmarkButtonProps {
  lessonId: string;
  className?: string;
}

/**
 * 课时书签切换按钮（图标按钮，44×44 命中区）。
 *
 * 书签是纯阅读辅助：不参与解锁、不影响掌握度与能力分，也不需要跨模块提交。
 * 状态与写入路径都落在 academy store（bookmarkedLessons / toggleLessonBookmark）。
 */
export function LessonBookmarkButton({ lessonId, className }: LessonBookmarkButtonProps) {
  const { t } = useTranslation();
  const bookmarked = useAcademyStore((s) => s.bookmarkedLessons.includes(lessonId));
  const toggleLessonBookmark = useAcademyStore((s) => s.toggleLessonBookmark);
  const label = bookmarked
    ? t('academy.bookmarks.remove', { defaultValue: '取消收藏' })
    : t('academy.bookmarks.add', { defaultValue: '收藏本课' });

  return (
    <button
      type="button"
      onClick={() => toggleLessonBookmark(lessonId)}
      aria-pressed={bookmarked}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md transition-colors',
        FOCUS_RING,
        bookmarked
          ? 'text-[var(--brass-bright)]'
          : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]',
        className,
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
      ) : (
        <Bookmark className="w-4 h-4" aria-hidden="true" />
      )}
    </button>
  );
}
