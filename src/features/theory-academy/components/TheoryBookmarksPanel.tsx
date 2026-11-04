import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AcademyBookmarksPanel } from '@/shared/components/academy';
import type { TheoryChapterSummary } from '../types';
import { findChapterSummaryById } from '../utils/theoryMeta';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryBookmarksPanelProps {
  /** 收藏章节 id 列表（store.progress.bookmarkedChapters） */
  bookmarks: readonly string[];
  /** 取消收藏回调（store.toggleBookmark）；strip 变体不渲染移除按钮 */
  onToggle?: (chapterId: string) => void;
  /** strip = 首页横向条；panel = 完整列表（带取消按钮与空态说明） */
  variant?: 'strip' | 'panel';
}

/**
 * 理论学院收藏章节面板（共享 AcademyBookmarksPanel 的薄包装）。
 *
 * 适配职责只有三件：id → 目录摘要（manifest，不触发正文加载，首屏零额外 chunk）、
 * 标题走章节 i18n key、路由 `/theory/chapter/:id` 交给 useNavigate。
 * 收藏本身是纯阅读书签：不参与解锁、不影响掌握度与能力分。
 */
export function TheoryBookmarksPanel({
  bookmarks,
  onToggle,
  variant = 'panel',
}: TheoryBookmarksPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const items = bookmarks
    .map((id) => findChapterSummaryById(id))
    .filter((chapter): chapter is TheoryChapterSummary => chapter !== undefined)
    .map((chapter) => ({
      id: chapter.id,
      title: resolveChapterTitle(t, chapter),
      route: `/theory/chapter/${chapter.id}`,
    }));

  return (
    <AcademyBookmarksPanel
      items={items}
      onNavigate={navigate}
      {...(onToggle ? { onRemove: onToggle } : {})}
      variant={variant}
      labels={{
        title: t('theory.bookmarks.title'),
        empty: t('theory.bookmarks.empty'),
        remove: t('theory.bookmarks.remove'),
      }}
    />
  );
}
