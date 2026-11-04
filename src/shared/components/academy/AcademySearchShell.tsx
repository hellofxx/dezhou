import { BookOpen, FileSearch, Search } from 'lucide-react';
import type { AcademySearchItem, AcademySearchSection } from '@/shared/types/academy';

export interface AcademySearchShellProps {
  /** 受控查询串 */
  query: string;
  onQueryChange: (query: string) => void;
  placeholder: string;
  /** 输入框与 section 的可访问名（缺省用 placeholder） */
  ariaLabel?: string;
  /** 分区结果（空数组的分区不渲染；分区顺序即渲染顺序） */
  sections: AcademySearchSection[];
  /** 全部为空时的标题（如"没有匹配结果"） */
  emptyTitle: string;
  /** 全部为空时的下一步提示 */
  emptyHint?: string;
  /** 点击结果后的回调（共享层不持有路由） */
  onNavigate: (route: string) => void;
  /** 结果行可访问名（缺省用条目 title） */
  resultAriaLabel?: (item: AcademySearchItem) => string;
}

/**
 * 学院搜索壳（理论 / 策略共用，DESIGN.md §5 搜索输入 + 推荐项）。
 *
 * 纯展示：不加载数据、不做匹配、不读 store；命中集合与分区标题由各院适配器算好传入。
 * 空分区自动隐藏，所有分区皆空且用户已输入时展示空态，避免空查询下误报"无结果"。
 */
export function AcademySearchShell({
  query,
  onQueryChange,
  placeholder,
  ariaLabel,
  sections,
  emptyTitle,
  emptyHint,
  onNavigate,
  resultAriaLabel,
}: AcademySearchShellProps) {
  const accessibleName = ariaLabel ?? placeholder;
  const visibleSections = sections.filter((section) => section.items.length > 0);
  const showEmptyState = visibleSections.length === 0 && query.trim().length > 0;

  return (
    <section aria-label={accessibleName} className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ivory-muted)]"
          aria-hidden="true"
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          aria-label={accessibleName}
          placeholder={placeholder}
          className="w-full min-h-11 rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 pl-9 pr-3 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        />
      </div>

      {visibleSections.map((section) => (
        <div key={section.id}>
          <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brass-text)]">
            {section.title}
            <span className="ml-1.5 font-numeric text-[var(--ivory-muted)]">
              {section.items.length}
            </span>
          </h3>
          <ul className="space-y-1">
            {section.items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.route)}
                  aria-label={resultAriaLabel?.(item) ?? item.title}
                  className="flex w-full min-h-11 items-start gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-[var(--felt-raised)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                >
                  <BookOpen
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--brass-bright)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-[var(--ivory)]">{item.title}</span>
                    {item.subtitle ? (
                      <span className="block line-clamp-2 text-[11px] text-[var(--ivory-muted)]">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {showEmptyState ? (
        <div role="status" className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-dim)]">
            <FileSearch className="h-3.5 w-3.5" aria-hidden="true" />
            {emptyTitle}
          </p>
          {emptyHint ? (
            <p className="text-[11px] leading-relaxed text-[var(--ivory-muted)]">{emptyHint}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
