import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { BookmarkPlus } from 'lucide-react';
import { useAcademyStore } from '../store';
import { StrategyBookmarksPanel } from './StrategyBookmarksPanel';

/**
 * 收藏课时页（/academy/bookmarks）。
 *
 * 只做壳：返回 / 页标题 / 说明 + 完整书签面板（面板自带空态说明），
 * 空态下补一个「去挑课时」的出口，避免用户停在无路可走的状态。
 * 页标题与面板标题刻意区分（我的收藏 / 收藏课时），避免同页两个同名 h2。
 * 书签是纯阅读辅助，本页不参与解锁与掌握度判定。
 */
export default function StrategyBookmarksPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const count = useAcademyStore((s) => s.bookmarkedLessons.length);

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <section className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-5 md:p-6">
          <BackLink
            onClick={() => navigate('/academy')}
            label={t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
            className="mb-4"
          />
          <h2 className="font-display text-2xl text-[var(--ivory)]">
            {t('academy.bookmarks.pageTitle', { defaultValue: '我的收藏' })}
          </h2>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">
            {t('academy.bookmarks.pageSubtitle', {
              defaultValue: '收藏的课时按收藏顺序排列，点开即可回到正文，也可以在这里取消收藏',
            })}
          </p>
        </section>

        <div className="space-y-3 rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
          <StrategyBookmarksPanel variant="panel" />
          {count === 0 ? (
            <button
              type="button"
              onClick={() => navigate('/academy')}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-[var(--walnut-border)] px-3 text-xs text-[var(--brass-bright)] transition-colors hover:bg-[var(--walnut-raised)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
              {t('academy.bookmarks.browseLessons', { defaultValue: '去挑几课' })}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
