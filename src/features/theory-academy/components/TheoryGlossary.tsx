import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Tags } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { TheoryChapterSummary, TheoryGlossaryTerm } from '../types';
import { findChapterSummaryById, findLevelSummaryByChapterId } from '../utils/theoryMeta';
import { resolveChapterTitle } from '../utils/titleKeys';

/** 术语类别（与 theory.glossary.categories.* 一一对应） */
export type GlossaryCategory = 'math' | 'preflop' | 'postflop' | 'psychology' | 'other';

export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = [
  'math',
  'preflop',
  'postflop',
  'psychology',
  'other',
];

/**
 * 术语归类：数据层没有类别字段（TheoryGlossaryTerm 只有 id / key / 别名 / 相关章），
 * 因此按「首个相关章节所属 Level」推导：T1-T2 数学与赔率、T3-T4 翻前、T5-T6 翻后、
 * T8 心理与资金，其余（T7 读牌、T9 综合、无相关章）归入其他。
 * 推导是纯函数并对外导出，便于测试锁定；若数据层后续补 category 字段，替换本函数即可。
 */
export function resolveGlossaryCategory(term: TheoryGlossaryTerm): GlossaryCategory {
  const firstChapterId = term.relatedChapterIds?.[0];
  if (!firstChapterId) return 'other';
  const level = findLevelSummaryByChapterId(firstChapterId);
  if (!level) return 'other';
  if (level.level <= 2) return 'math';
  if (level.level <= 4) return 'preflop';
  if (level.level <= 6) return 'postflop';
  if (level.level === 8) return 'psychology';
  return 'other';
}

/** key 缺失时退回 key 尾段，避免渲染整串 key 面字 */
function resolveKey(t: TFunction, key: string): string {
  return t(key, { defaultValue: key.split('.').pop() ?? key });
}

interface TheoryGlossaryProps {
  terms: readonly TheoryGlossaryTerm[];
  /** 初始类别（缺省全部）；首页入口可按推荐维度预选 */
  initialCategory?: GlossaryCategory | 'all';
  className?: string;
}

/**
 * 术语表面板：搜索输入 + 类别页签 + 术语卡（别名 / 释义 / 相关章节）。
 * 数据只读；不写 store、不参与解锁。搜索在已解析文本上做大小写不敏感的包含匹配，
 * 因此中英文术语与缩写都能命中（别名一并纳入匹配面）。
 */
export function TheoryGlossary({
  terms,
  initialCategory = 'all',
  className,
}: TheoryGlossaryProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GlossaryCategory | 'all'>(initialCategory);

  const decorated = useMemo(
    () =>
      terms.map((term) => {
        const name = resolveKey(t, term.termKey);
        const definition = resolveKey(t, term.definitionKey);
        const aliases = (term.aliases ?? []).map((alias) => resolveKey(t, alias));
        const related = (term.relatedChapterIds ?? [])
          .map((id) => findChapterSummaryById(id))
          .filter((chapter): chapter is TheoryChapterSummary => chapter !== undefined);
        return {
          term,
          name,
          definition,
          aliases,
          related,
          category: resolveGlossaryCategory(term),
          haystack: [name, definition, ...aliases].join(' ').toLowerCase(),
        };
      }),
    [terms, t],
  );

  const needle = query.trim().toLowerCase();
  const visible = decorated.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!needle) return true;
    return item.haystack.includes(needle);
  });

  return (
    <section aria-label={t('theory.glossary.title')} className={cn('space-y-3', className)}>
      <div>
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
          {t('theory.glossary.title')}
        </h2>
        <p className="text-[11px] text-[var(--ivory-dim)] mt-1 leading-relaxed">
          {t('theory.glossary.subtitle')}
        </p>
      </div>

      <div className="relative">
        <Search
          className="w-4 h-4 text-[var(--ivory-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t('theory.glossary.searchPlaceholder')}
          placeholder={t('theory.glossary.searchPlaceholder')}
          className="w-full min-h-11 rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 pl-9 pr-3 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        />
      </div>

      <div role="group" aria-label={t('theory.glossary.allCategories')} className="flex flex-wrap gap-1.5">
        {(['all', ...GLOSSARY_CATEGORIES] as const).map((key) => {
          const active = category === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(key)}
              className={cn(
                'inline-flex min-h-11 items-center gap-1 rounded-full border px-2.5 text-[11px] transition-colors',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                active
                  ? 'border-[var(--brass)]/60 bg-[var(--brass)]/15 text-[var(--brass-bright)]'
                  : 'border-[var(--walnut-border)] text-[var(--ivory-muted)] hover:text-[var(--ivory)]',
              )}
            >
              {key === 'all'
                ? t('theory.glossary.allCategories')
                : t(`theory.glossary.categories.${key}`)}
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="text-xs text-[var(--ivory-dim)] py-3">{t('theory.glossary.empty')}</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li
              key={item.term.id}
              className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt-deep)]/50 p-3"
            >
              <div className="flex items-start gap-2">
                <Tags className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[var(--ivory)] leading-snug">{item.name}</p>
                  {item.aliases.length > 0 && (
                    <p className="text-[10px] text-[var(--ivory-muted)] mt-0.5 font-mono">
                      {item.aliases.join(' / ')}
                    </p>
                  )}
                  <p className="text-xs text-[var(--ivory-dim)] leading-relaxed mt-1">
                    {item.definition}
                  </p>
                  {item.related.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--ivory-muted)]">
                        {t('theory.glossary.relatedChapters')}
                      </span>
                      {item.related.map((chapter) => (
                        <Link
                          key={chapter.id}
                          to={`/theory/chapter/${chapter.id}`}
                          className="inline-flex items-center gap-1 text-[11px] text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
                        >
                          <BookOpen className="w-2.5 h-2.5" aria-hidden="true" />
                          {resolveChapterTitle(t, chapter)}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
