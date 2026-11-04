import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AcademyBookmarksPanel } from '@/shared/components/academy';
import { useAcademyStore } from '../store';
import type { LessonSummary } from '../types';
import { findLessonSummaryById } from '../utils/academyMeta';
import { resolveLessonTitle } from '../utils/titleKeys';

interface StrategyBookmarksPanelProps {
  /** strip = 首页横向条；panel = 完整列表（带取消按钮与空态说明） */
  variant?: 'strip' | 'panel';
}

/**
 * 策略学院收藏课时面板（共享 AcademyBookmarksPanel 的薄包装）。
 *
 * 适配职责只有三件：lessonId → manifest 摘要（不触发正文加载，首屏零额外 chunk）、
 * 标题走课时 i18n key、路由 `/academy/lesson/:id` 交给 useNavigate。
 * 失效 id（已下线课时）在映射阶段丢弃，面板不感知业务目录。
 * 收藏本身是纯阅读书签：不参与解锁、不影响掌握度与能力分。
 */
export function StrategyBookmarksPanel({ variant = 'panel' }: StrategyBookmarksPanelProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const bookmarkedLessons = useAcademyStore((s) => s.bookmarkedLessons);
  const toggleLessonBookmark = useAcademyStore((s) => s.toggleLessonBookmark);

  const items = bookmarkedLessons
    .map((id) => findLessonSummaryById(id))
    .filter((lesson): lesson is LessonSummary => lesson !== undefined)
    .map((lesson) => ({
      id: lesson.id,
      title: resolveLessonTitle(t, lesson),
      route: `/academy/lesson/${lesson.id}`,
    }));

  return (
    <AcademyBookmarksPanel
      items={items}
      onNavigate={navigate}
      {...(variant === 'panel' ? { onRemove: toggleLessonBookmark } : {})}
      variant={variant}
      labels={{
        title: t('academy.bookmarks.title', { defaultValue: '收藏课时' }),
        empty: t('academy.bookmarks.empty', {
          defaultValue: '还没有收藏。把想反复读的课时存下来，随时回到这里',
        }),
        remove: t('academy.bookmarks.remove', { defaultValue: '取消收藏' }),
      }}
    />
  );
}
