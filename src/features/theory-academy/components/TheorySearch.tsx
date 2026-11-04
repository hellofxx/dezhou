import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useNavigate } from 'react-router-dom';
import { AcademySearchShell } from '@/shared/components/academy';
import type { AcademySearchItem, AcademySearchSection } from '@/shared/types/academy';
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

/** 结果行跳转目标（理论侧路由字符串，共享壳不持有路由） */
const CHAPTER_ROUTE_PREFIX = '/theory/chapter/';
const GLOSSARY_ROUTE = '/theory/glossary';
const BIBLIOGRAPHY_ROUTE = '/theory/bibliography';

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
 * 展示层用两院共享 `AcademySearchShell`（输入框 / 分区 / 空态），本组件只做理论侧适配：
 * 命中集合、分区标题与路由在这里算好传入，共享壳不持有路由也不加载数据。
 * 只读：不写 store、不改任何解锁状态；结果一律以理论侧路由呈现。
 */
export function TheorySearch({ onNavigate, className }: TheorySearchProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const chapterItems: AcademySearchItem[] = chapterHits.map((chapter) => ({
    id: chapter.id,
    title: resolveChapterTitle(t, chapter),
    subtitle: resolveChapterSubtitle(t, chapter),
    route: `${CHAPTER_ROUTE_PREFIX}${chapter.id}`,
  }));

  const glossaryItems: AcademySearchItem[] = glossaryHits.map((term) => ({
    id: term.id,
    title: resolveKey(t, term.termKey),
    subtitle: resolveKey(t, term.definitionKey),
    route: GLOSSARY_ROUTE,
  }));

  const bibliographyItems: AcademySearchItem[] = bibliographyHits.map((entry) => ({
    id: entry.id,
    title: resolveKey(t, entry.titleKey),
    subtitle: typeof entry.year === 'number' ? String(entry.year) : undefined,
    route: BIBLIOGRAPHY_ROUTE,
  }));

  const fullTextItems: AcademySearchItem[] = fullTextHits.map((hit) => {
    const summary = findChapterSummaryById(hit.chapterId);
    return {
      id: hit.chapterId,
      title: summary ? resolveChapterTitle(t, summary) : hit.chapterId,
      subtitle: `…${hit.snippet}…`,
      route: `${CHAPTER_ROUTE_PREFIX}${hit.chapterId}`,
    };
  });

  const sections: AcademySearchSection[] = [
    { id: 'chapters', title: t('theory.search.categories.chapters'), items: chapterItems },
    { id: 'glossary', title: t('theory.search.categories.glossary'), items: glossaryItems },
    {
      id: 'bibliography',
      title: t('theory.search.categories.bibliography'),
      items: bibliographyItems,
    },
    { id: 'fullText', title: t('theory.search.categories.chapters'), items: fullTextItems },
  ];

  return (
    <div className={className}>
      <AcademySearchShell
        query={query}
        onQueryChange={setQuery}
        placeholder={t('theory.search.placeholder')}
        sections={sections}
        // 全文索引在途时先报「正在载入」，避免目录层无命中就提前下「没有匹配」结论
        emptyTitle={loading ? t('theory.search.fullTextLoading') : t('theory.search.noResults')}
        resultAriaLabel={(item) => `${t('theory.search.open')} · ${item.title}`}
        onNavigate={(route) => {
          onNavigate?.();
          navigate(route);
        }}
      />
      {needle.length === 0 && (
        <p className="mt-3 text-xs text-[var(--ivory-dim)]">{t('theory.search.placeholder')}</p>
      )}
    </div>
  );
}
