import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark, BookmarkCheck, BookmarkX, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { transitionStandard } from '@/shared/utils/motion';

/** 通用书签条目：章节 / 课时由各院适配器解析成可读标题与路由后传入。 */
export interface AcademyBookmarkItem {
  id: string;
  title: string;
  route: string;
}

export interface AcademyBookmarksLabels {
  title: string;
  empty: string;
  remove: string;
}

export interface AcademyBookmarksPanelProps {
  /** 已收藏条目（顺序即渲染顺序；失效 id 由调用方过滤，本组件不感知业务目录） */
  items: AcademyBookmarkItem[];
  /** 点击条目跳转（共享层不持有路由实例） */
  onNavigate: (route: string) => void;
  /** 取消收藏；仅 panel 变体渲染移除按钮，strip 保持只读轻量 */
  onRemove?: (id: string) => void;
  /** strip = 首页横向书签条；panel = 完整列表（含移除按钮与空态说明） */
  variant?: 'strip' | 'panel';
  labels: AcademyBookmarksLabels;
  /** section 可访问名（缺省用 labels.title） */
  ariaLabel?: string;
}

/**
 * 学院书签面板（理论章节 / 策略课时共用）。
 *
 * 只消费调用方解析好的条目：不读 store、不查目录、不拼路由；
 * 书签是纯阅读书签，不参与解锁、不影响掌握度与能力分。
 * 渲染为 button + onNavigate（与 AcademySearchShell 一致，共享层不引 router）。
 */
export function AcademyBookmarksPanel({
  items,
  onNavigate,
  onRemove,
  variant = 'panel',
  labels,
  ariaLabel,
}: AcademyBookmarksPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const accessibleName = ariaLabel ?? labels.title;
  const count = items.length;

  if (variant === 'strip') {
    return (
      <motion.section
        initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...transitionStandard, delay: 0.08 }}
        aria-label={accessibleName}
        className="panel"
      >
        <div className="flex items-center gap-2 mb-2">
          <BookmarkCheck className="w-3.5 h-3.5 text-[var(--brass-bright)]" aria-hidden="true" />
          <SectionLabel as="h2" count={count}>
            {labels.title}
          </SectionLabel>
        </div>
        {count === 0 ? (
          <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">{labels.empty}</p>
        ) : (
          <ul className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {items.map((item) => (
              <li key={item.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  className="inline-flex min-h-11 max-w-[240px] items-center gap-1.5 rounded-full border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/60 px-3 text-xs text-[var(--ivory)] hover:border-[var(--brass)]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  <Bookmark
                    className="w-3 h-3 text-[var(--brass-bright)] shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.section>
    );
  }

  return (
    <section aria-label={accessibleName} className="panel space-y-2">
      <div className="flex items-center gap-2">
        <BookmarkCheck className="w-4 h-4 text-[var(--brass-bright)] shrink-0" aria-hidden="true" />
        <SectionLabel as="h2" count={count}>
          {labels.title}
        </SectionLabel>
      </div>

      {count === 0 ? (
        <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">{labels.empty}</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onNavigate(item.route)}
                className="flex min-h-11 flex-1 min-w-0 items-center gap-2 rounded-md px-1.5 text-left text-xs text-[var(--ivory-dim)] hover:text-[var(--ivory)] hover:bg-[var(--felt-raised)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
              >
                <Bookmark
                  className="w-3.5 h-3.5 text-[var(--brass-bright)] shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate">{item.title}</span>
                <ChevronRight
                  className="w-3.5 h-3.5 ml-auto shrink-0 text-[var(--ivory-dim)]"
                  aria-hidden="true"
                />
              </button>
              {onRemove ? (
                <button
                  type="button"
                  onClick={() => onRemove(item.id)}
                  aria-label={`${labels.remove} · ${item.title}`}
                  className={cn(
                    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md',
                    'text-[var(--ivory-muted)] hover:text-[var(--poker-terra-bright)] transition-colors',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                  )}
                >
                  <BookmarkX className="w-4 h-4" aria-hidden="true" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
