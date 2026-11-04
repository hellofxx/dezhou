import { useTranslation } from 'react-i18next';
import { BookMarked, ExternalLink } from 'lucide-react';
import type { TFunction } from 'i18next';
import { Link } from 'react-router-dom';
import type { TheoryBibliographyEntry } from '../types';
import { findChapterSummaryById } from '../utils/theoryMeta';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryBibliographyProps {
  entries: readonly TheoryBibliographyEntry[];
}

/** key 缺失时退回 key 尾段（如 `theory.book.title.mop` → `mop`），避免渲染整串 key 面字 */
function resolveKey(t: TFunction, key: string): string {
  const fallback = key.split('.').pop() ?? key;
  return t(key, { defaultValue: fallback });
}

/**
 * 参考书目（只读展示）。
 * 条目数据来自 data/bibliography.ts（内容侧维护），本组件不做任何检索/写入。
 * 书目指向的是公开出版物，站内不复制原文：只列出处与引用章节，供读者自行延伸阅读。
 */
export function TheoryBibliography({ entries }: TheoryBibliographyProps) {
  const { t } = useTranslation();

  return (
    <section aria-label={t('theory.bibliography.title')} className="space-y-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
          {t('theory.bibliography.title')}
        </h2>
        <span className="font-numeric text-[11px] text-[var(--ivory-muted)]">
          {t('theory.bibliography.books', { count: entries.length })}
        </span>
      </div>
      <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed">
        {t('theory.bibliography.subtitle')}
      </p>

      {entries.length === 0 ? (
        <p className="text-xs text-[var(--ivory-dim)]">{t('theory.bibliography.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => {
            const related = (entry.relatedChapterIds ?? [])
              .map((id) => findChapterSummaryById(id))
              .filter((chapter) => chapter !== undefined);
            return (
              <li
                key={entry.id}
                className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/50 p-3"
              >
                <div className="flex items-start gap-2">
                  <BookMarked
                    className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--ivory)] leading-snug">
                      {resolveKey(t, entry.titleKey)}
                      {entry.year !== undefined && (
                        <span className="font-numeric text-[11px] text-[var(--ivory-muted)]">
                          {' '}
                          · {entry.year}
                        </span>
                      )}
                    </p>
                    {entry.authorKey && (
                      <p className="text-[11px] text-[var(--ivory-muted)] mt-0.5">
                        {resolveKey(t, entry.authorKey)}
                      </p>
                    )}
                    {entry.noteKey && (
                      <p className="text-[11px] text-[var(--ivory-dim)] leading-relaxed mt-1">
                        {resolveKey(t, entry.noteKey)}
                      </p>
                    )}
                    {related.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ivory-muted)]">
                          {t('theory.bibliography.citedIn')}
                        </span>
                        {related.map((chapter) => (
                          <Link
                            key={chapter.id}
                            to={`/theory/chapter/${chapter.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
                          >
                            {resolveChapterTitle(t, chapter)}
                            <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
