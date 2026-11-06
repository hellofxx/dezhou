import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { RefreshCw, Search } from 'lucide-react';
import { AcademySearchShell } from '@/shared/components/academy';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { AcademySearchItem, AcademySearchSection } from '@/shared/types/academy';
import { useAcademyStore } from '../store';
import {
  findLessonSummaryById,
  findLevelSummaryByLessonId,
  getVariantLessonSummaries,
} from '../utils/academyMeta';
import {
  resolveLessonSubtitle,
  resolveLessonTitle,
  resolveLevelTitle,
} from '../utils/titleKeys';
import {
  SEARCH_MAX_RESULTS,
  SEARCH_MIN_QUERY_LENGTH,
  getCachedLessonSearchIndex,
  loadLessonSearchIndex,
  searchLessonIndex,
} from '../utils/searchIndex';

type FullTextStatus = 'idle' | 'loading' | 'error';

/**
 * 策略学院搜索页（P5 升级版）：
 * - 标题/副标题即时结果来自 manifest，空查询与 1 字符查询不加载正文
 * - 查询 ≥ SEARCH_MIN_QUERY_LENGTH 时懒加载当前变体课时（标准全量 / 变体专属），
 *   异步补"正文/小测命中"分区；切换变体后索引按变体重取
 * - 加载失败降级为标题结果 + 重试入口；查询变化时用请求序号丢弃过期结果
 */
export default function StrategySearchPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const [query, setQuery] = useState('');
  const [loadStatus, setLoadStatus] = useState<FullTextStatus>('idle');
  const [retryToken, setRetryToken] = useState(0);
  const requestRef = useRef(0);

  const normalized = query.trim().toLowerCase();
  const wantsFullText = normalized.length >= SEARCH_MIN_QUERY_LENGTH;

  useEffect(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    if (!wantsFullText) {
      setLoadStatus('idle');
      return;
    }
    if (getCachedLessonSearchIndex(activeVariant)) {
      setLoadStatus('idle');
      return;
    }
    setLoadStatus('loading');
    let cancelled = false;
    void loadLessonSearchIndex(activeVariant)
      .then(() => {
        if (!cancelled && requestRef.current === requestId) setLoadStatus('idle');
      })
      .catch(() => {
        if (!cancelled && requestRef.current === requestId) setLoadStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [wantsFullText, normalized, activeVariant, retryToken]);

  const readyIndex = wantsFullText ? getCachedLessonSearchIndex(activeVariant) : null;
  const fullTextHits = useMemo(
    () => (readyIndex ? searchLessonIndex(readyIndex, normalized) : []),
    [readyIndex, normalized],
  );

  const instantItems = useMemo<AcademySearchItem[]>(
    () =>
      getVariantLessonSummaries(activeVariant).flatMap((lesson) => {
        const title = resolveLessonTitle(t, lesson);
        const subtitle = resolveLessonSubtitle(t, lesson);
        if (normalized && !`${title} ${subtitle}`.toLowerCase().includes(normalized)) return [];
        return [{ id: lesson.id, title, subtitle, route: `/academy/lesson/${lesson.id}` }];
      }),
    [activeVariant, normalized, t],
  );

  const fullTextItems = useMemo<AcademySearchItem[]>(() => {
    if (fullTextHits.length === 0) return [];
    const instantIds = new Set(instantItems.map((item) => item.id));
    return fullTextHits
      .filter((hit) => !instantIds.has(hit.lessonId))
      .slice(0, SEARCH_MAX_RESULTS)
      .map((hit) => {
        const summary = findLessonSummaryById(hit.lessonId);
        const level = findLevelSummaryByLessonId(hit.lessonId);
        const levelTitle = level ? resolveLevelTitle(t, level) : '';
        return {
          id: `full-${hit.lessonId}`,
          title: summary ? resolveLessonTitle(t, summary) : hit.title,
          subtitle: levelTitle ? `${levelTitle} · ${hit.snippet}` : hit.snippet,
          route: `/academy/lesson/${hit.lessonId}`,
        };
      });
  }, [fullTextHits, instantItems, t]);

  const sections: AcademySearchSection[] = [];
  if (instantItems.length > 0) {
    sections.push({ id: 'lessons', title: t('academy.search.lessons'), items: instantItems });
  }
  if (fullTextItems.length > 0) {
    sections.push({
      id: 'lesson-content',
      title: t('academy.search.contentHits'),
      items: fullTextItems,
    });
  }

  const isLoading = wantsFullText && !readyIndex && loadStatus === 'loading';
  const isError = wantsFullText && !readyIndex && loadStatus === 'error';
  const hasInstant = instantItems.length > 0;

  const emptyTitle = isError
    ? t('academy.search.loadFailed')
    : isLoading && !hasInstant
      ? t('academy.search.loadingFullText')
      : t('academy.search.emptyTitle');
  const emptyHint = !isError && !isLoading ? t('academy.search.emptyHint') : undefined;

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        <section className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-5 md:p-6">
          <BackLink
            onClick={() => navigate('/academy')}
            label={t('academy.search.backToAcademy')}
            className="mb-4"
          />
          <h2 className="font-display text-2xl text-[var(--ivory)]">
            {t('academy.search.title')}
          </h2>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">{t('academy.search.subtitle')}</p>
        </section>

        <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
          <AcademySearchShell
            query={query}
            onQueryChange={setQuery}
            placeholder={t('academy.search.placeholder')}
            sections={sections}
            emptyTitle={emptyTitle}
            emptyHint={emptyHint}
            onNavigate={(route) => navigate(route)}
          />

          {isLoading && hasInstant ? (
            <p
              role="status"
              aria-live="polite"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-[var(--ivory-muted)]"
            >
              <Search className="h-3.5 w-3.5" aria-hidden="true" />
              {t('academy.search.loadingFullText')}
            </p>
          ) : null}

          {isError ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {hasInstant ? (
                <p className="text-xs text-[var(--ivory-muted)]">
                  {t('academy.search.loadFailed')}
                </p>
              ) : null}
              <button
                type="button"
                data-testid="academy-search-retry"
                onClick={() => setRetryToken((token) => token + 1)}
                className={`inline-flex min-h-9 items-center gap-1.5 rounded-md border border-[var(--walnut-border)] px-2.5 text-xs text-[var(--ivory-dim)] transition-colors hover:text-[var(--brass-bright)] ${FOCUS_RING}`}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {t('academy.search.retryFullText')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
