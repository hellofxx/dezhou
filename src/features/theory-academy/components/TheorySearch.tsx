import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Link } from 'react-router-dom';
import { BookOpen, FileSearch, Loader2, Search } from 'lucide-react';
import type { TheoryChapterSummary, TheoryLevelInfo } from '../types';
import {
  getChapterSummariesByVariant,
  findChapterSummaryById,
} from '../utils/theoryMeta';
import { resolveChapterSubtitle, resolveChapterTitle } from '../utils/titleKeys';
import { loadTheoryLevelsForVariant } from '../data/levels/loaders';
import {
  getTheoryBibliographyEntries,
  getTheoryGlossaryTerms,
} from './theoryOptionalSources';

/** 全文命中（章节 id + 命中片段） */
interface FullTextHit {
  chapterId: string;
  snippet: string;
}

/** key 缺失时退回 key 尾段，避免渲染整串 key 面字 */
function resolveKey(t: TFunction, key: string): string {
  return t(key, { defaultValue: key.split('.').pop() ?? key });
}

/** 在正文 / 小测文本里找命中片段（大小写不敏感，片段取命中点左右各 40 字） */
function buildFullTextHits(levels: readonly TheoryLevelInfo[], needle: string): FullTextHit[] {
  const hits: FullTextHit[] = [];
  for (const level of levels) {
    for (const chapter of level.chapters) {
      const haystack = [
        chapter.title,
        chapter.subtitle,
        ...chapter.content.map((section) => section.content),
        ...chapter.quiz.map((question) => `${question.question} ${question.explanation}`),
      ].join('\n');
      const index = haystack.toLowerCase().indexOf(needle);
      if (index === -1) continue;
      const start = Math.max(0, index - 40);
      hits.push({
        chapterId: chapter.id,
        snippet: haystack.slice(start, Math.min(haystack.length, index + needle.length + 40)),
      });
    }
  }
  return hits;
}

interface TheorySearchProps {
  /** 点击结果后的回调（在对话框内使用时用于关闭弹层） */
  onNavigate?: () => void;
  className?: string;
}

/**
 * 理论学院检索（v1）。
 *
 * 分层检索：
 * 1. 目录层：章节标题 / 副标题（manifest 摘要，零额外加载）+ 术语表 + 参考书目（静态数据）
 * 2. 全文层：目录层无命中且关键词 ≥2 字时才按需加载标准变体全文（loadTheoryLevelsForVariant 内部缓存，
 *    同一会话只加载一次），避免首屏把全部正文 chunk 拉进来
 *
 * 只读：不写 store、不改任何解锁状态；结果一律以路由链接呈现。
 */
export function TheorySearch({ onNavigate, className }: TheorySearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [fullText, setFullText] = useState<TheoryLevelInfo[] | null>(null);
  const [loading, setLoading] = useState(false);
  // 全文索引只请求一次（ref 不进依赖数组，避免 effect 自触发 cleanup 取消在途请求）
  const requestedRef = useRef(false);

  const needle = query.trim().toLowerCase();

  const chapters = getChapterSummariesByVariant('standard');
  const glossaryTerms = getTheoryGlossaryTerms();
  const bibliography = getTheoryBibliographyEntries();

  const chapterHits = useMemo(() => {
    if (!needle) return [] as TheoryChapterSummary[];
    return chapters.filter((chapter) => {
      const title = resolveChapterTitle(t, chapter).toLowerCase();
      const subtitle = resolveChapterSubtitle(t, chapter).toLowerCase();
      return title.includes(needle) || subtitle.includes(needle);
    });
  }, [chapters, needle, t]);

  const glossaryHits = useMemo(() => {
    if (!needle) return [];
    return glossaryTerms.filter((term) => {
      const names = [term.termKey, ...(term.aliases ?? [])]
        .map((key) => resolveKey(t, key))
        .join(' ');
      const definition = resolveKey(t, term.definitionKey);
      return `${names} ${definition}`.toLowerCase().includes(needle);
    });
  }, [glossaryTerms, needle, t]);

  const bibliographyHits = useMemo(() => {
    if (!needle) return [];
    return bibliography.filter((entry) => {
      const text = [entry.titleKey, entry.authorKey, entry.noteKey]
        .filter((key): key is string => typeof key === 'string')
        .map((key) => resolveKey(t, key))
        .join(' ');
      return text.toLowerCase().includes(needle);
    });
  }, [bibliography, needle, t]);

  const catalogEmpty =
    chapterHits.length === 0 && glossaryHits.length === 0 && bibliographyHits.length === 0;

  // 全文兜底加载：目录层无命中且关键词够长才触发（同一会话只发一次请求）
  useEffect(() => {
    if (!needle || needle.length < 2 || !catalogEmpty || requestedRef.current) return;
    requestedRef.current = true;
    setLoading(true);
    void loadTheoryLevelsForVariant('standard')
      .then((levels) => setFullText(levels))
      .catch(() => setFullText([]))
      .finally(() => setLoading(false));
  }, [needle, catalogEmpty]);

  const fullTextHits = useMemo(() => {
    if (!needle || needle.length < 2 || !fullText) return [] as FullTextHit[];
    return buildFullTextHits(fullText, needle);
  }, [fullText, needle]);

  const totalCount = chapterHits.length + glossaryHits.length + bibliographyHits.length + fullTextHits.length;

  return (
    <section aria-label={t('theory.search.title')} className={className}>
      <div className="relative">
        <Search
          className="w-4 h-4 text-[var(--ivory-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          aria-hidden="true"
        />
        <input
          type="search"
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={t('theory.search.placeholder')}
          placeholder={t('theory.search.placeholder')}
          className="w-full min-h-11 rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 pl-9 pr-3 text-sm text-[var(--ivory)] placeholder:text-[var(--ivory-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
        />
      </div>

      {needle.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--ivory-dim)]">{t('theory.search.placeholder')}</p>
      ) : (
        <div className="mt-3 space-y-4">
          <p aria-live="polite" className="font-numeric text-[11px] text-[var(--ivory-muted)]">
            {t('theory.search.results', { count: totalCount })}
          </p>

          {chapterHits.length > 0 && (
            <ResultGroup title={t('theory.search.categories.chapters')} count={chapterHits.length}>
              {chapterHits.map((chapter) => (
                <ResultLink
                  key={chapter.id}
                  to={`/theory/chapter/${chapter.id}`}
                  label={resolveChapterTitle(t, chapter)}
                  hint={resolveChapterSubtitle(t, chapter)}
                  openLabel={t('theory.search.open')}
                  onNavigate={onNavigate}
                />
              ))}
            </ResultGroup>
          )}

          {glossaryHits.length > 0 && (
            <ResultGroup title={t('theory.search.categories.glossary')} count={glossaryHits.length}>
              {glossaryHits.map((term) => (
                <li key={term.id} className="text-xs text-[var(--ivory-dim)] leading-relaxed">
                  <span className="text-[var(--ivory)]">{resolveKey(t, term.termKey)}</span>
                  {' · '}
                  {resolveKey(t, term.definitionKey)}
                </li>
              ))}
            </ResultGroup>
          )}

          {bibliographyHits.length > 0 && (
            <ResultGroup
              title={t('theory.search.categories.bibliography')}
              count={bibliographyHits.length}
            >
              {bibliographyHits.map((entry) => (
                <li key={entry.id} className="text-xs text-[var(--ivory-dim)] leading-relaxed">
                  {resolveKey(t, entry.titleKey)}
                  {typeof entry.year === 'number' && (
                    <span className="font-numeric text-[var(--ivory-muted)]"> · {entry.year}</span>
                  )}
                </li>
              ))}
            </ResultGroup>
          )}

          {loading && (
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              {t('theory.search.fullTextLoading')}
            </p>
          )}

          {fullTextHits.length > 0 && (
            <ResultGroup title={t('theory.search.categories.chapters')} count={fullTextHits.length}>
              {fullTextHits.map((hit) => {
                const summary = findChapterSummaryById(hit.chapterId);
                return (
                  <ResultLink
                    key={hit.chapterId}
                    to={`/theory/chapter/${hit.chapterId}`}
                    label={summary ? resolveChapterTitle(t, summary) : hit.chapterId}
                    hint={`…${hit.snippet}…`}
                    openLabel={t('theory.search.open')}
                    onNavigate={onNavigate}
                  />
                );
              })}
            </ResultGroup>
          )}

          {totalCount === 0 && !loading && (
            <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-dim)]">
              <FileSearch className="w-3.5 h-3.5" aria-hidden="true" />
              {t('theory.search.noResults')}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** 结果分组（标题 + 计数 + 列表） */
function ResultGroup({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--brass-text)] font-semibold mb-1">
        {title}
        <span className="ml-1.5 font-numeric text-[var(--ivory-muted)]">{count}</span>
      </p>
      <ul className="space-y-1">{children}</ul>
    </div>
  );
}

/** 章节结果行（整行可点，跳转后回调关闭弹层） */
function ResultLink({
  to,
  label,
  hint,
  openLabel,
  onNavigate,
}: {
  to: string;
  label: string;
  hint: string;
  openLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <li>
      <Link
        to={to}
        onClick={onNavigate}
        aria-label={`${openLabel} · ${label}`}
        className="flex min-h-11 items-start gap-2 rounded-md px-1.5 py-1.5 hover:bg-[var(--felt-raised)]/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
      >
        <BookOpen className="w-3.5 h-3.5 text-[var(--brass-bright)] shrink-0 mt-0.5" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-xs text-[var(--ivory)] truncate">{label}</span>
          <span className="block text-[11px] text-[var(--ivory-muted)] line-clamp-2">{hint}</span>
        </span>
      </Link>
    </li>
  );
}
