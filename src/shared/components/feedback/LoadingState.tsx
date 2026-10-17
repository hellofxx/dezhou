/**
 * Unified loading state components.
 * Use in React.lazy Suspense fallbacks and loading states.
 *
 * 无障碍：外层 role="status" + aria-live="polite" 提供加载播报（sr-only 文案取 common.ui.loading），
 * 骨架图形本身 aria-hidden，避免读屏把占位块当内容。
 */

import { useTranslation } from 'react-i18next';

/** Page-level skeleton placeholder */
export function PageSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite" className="max-w-5xl mx-auto">
      <span className="sr-only">{t('common.ui.loading')}</span>
      <div aria-hidden="true" className="animate-pulse space-y-4 p-6">
        <div className="h-8 bg-[var(--walnut-raised)]/40 rounded w-1/3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-[var(--walnut-raised)]/40 rounded-lg" />
          ))}
        </div>
        <div className="h-64 bg-[var(--walnut-raised)]/40 rounded-lg" />
      </div>
    </div>
  );
}

/** Component-level skeleton placeholder */
export function ComponentSkeleton() {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t('common.ui.loading')}</span>
      <div aria-hidden="true" className="animate-pulse space-y-3 p-4">
        <div className="h-5 bg-[var(--walnut-raised)]/40 rounded w-1/2" />
        <div className="h-4 bg-[var(--walnut-raised)]/30 rounded w-3/4" />
        <div className="h-4 bg-[var(--walnut-raised)]/30 rounded w-2/3" />
      </div>
    </div>
  );
}

/** List loading skeleton */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  const { t } = useTranslation();

  return (
    <div role="status" aria-live="polite">
      <span className="sr-only">{t('common.ui.loading')}</span>
      <div aria-hidden="true" className="animate-pulse space-y-2 p-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-md bg-[var(--walnut-raised)]/40 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[var(--walnut-raised)]/40 rounded w-1/3" />
              <div className="h-3 bg-[var(--walnut-raised)]/30 rounded w-1/2" />
            </div>
            <div className="h-4 w-12 bg-[var(--walnut-raised)]/30 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
