import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, BookMarked, CheckCircle2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { ProgressBar } from '@/shared/components/data-display/ProgressBar';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import type { TheoryLevelInfo } from '../types';
import { resolveChapterTitle, resolveTheoryLevelTitle } from '../utils/titleKeys';

interface TheoryChapterRailProps {
  level: TheoryLevelInfo;
  currentChapterId: string;
  completedChapters: string[];
}

/**
 * 章节页学习导轨（xl 起显示）：本级章节列表 + 完成进度 + 返回目录。
 * 只接收展示数据，不读 store；章节切换走真实路由。
 */
export function TheoryChapterRail({
  level,
  currentChapterId,
  completedChapters,
}: TheoryChapterRailProps) {
  const { t } = useTranslation();
  const current = level.chapters.find((chapter) => chapter.id === currentChapterId);
  const completedInLevel = level.chapters.filter((chapter) =>
    completedChapters.includes(chapter.id),
  ).length;
  const progress =
    level.chapters.length > 0 ? Math.round((completedInLevel / level.chapters.length) * 100) : 0;

  return (
    <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brass-text)]">
        <span aria-hidden="true">{level.icon}</span>
        <span className="font-numeric">T{level.level}</span>
        <span className="truncate">{resolveTheoryLevelTitle(t, level)}</span>
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[var(--ivory-muted)]">
        <span className="font-numeric">
          {t('theory.chapterView.chapterOf', {
            current: current?.order ?? 0,
            total: level.chapters.length,
          })}
        </span>
        <span className="font-numeric">{progress}%</span>
      </div>
      <ProgressBar
        className="mt-1.5"
        size="sm"
        value={progress}
        label={t('theory.chapterView.railTitle')}
      />

      <SectionLabel as="h2" className="mt-4">
        {t('theory.chapterView.railTitle')}
      </SectionLabel>
      <nav aria-label={t('theory.chapterView.railTitle')} className="mt-2">
        <ol className="space-y-0.5">
          {level.chapters.map((chapter) => {
            const isCurrent = chapter.id === currentChapterId;
            const done = completedChapters.includes(chapter.id);
            return (
              <li key={chapter.id}>
                <Link
                  to={`/theory/chapter/${chapter.id}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-2 py-2 text-xs transition-colors',
                    FOCUS_RING,
                    isCurrent
                      ? 'bg-[var(--brass-glow)] font-medium text-[var(--brass-text)]'
                      : 'text-[var(--ivory-dim)] hover:bg-[var(--walnut-light)]/40 hover:text-[var(--ivory)]',
                  )}
                >
                  <span className="w-4 shrink-0 text-center" aria-hidden="true">
                    {done ? (
                      <CheckCircle2 className="mx-auto h-3.5 w-3.5 text-[var(--poker-success)]" />
                    ) : (
                      <span className="font-numeric text-[10px]">
                        {String(chapter.order).padStart(2, '0')}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{resolveChapterTitle(t, chapter)}</span>
                  {chapter.supplemental === true && (
                    <span className="shrink-0 rounded-full border border-[var(--brass-deep)]/50 px-1.5 py-0.5 text-[9px] font-semibold text-[var(--brass-text)]">
                      {t('theory.ladder.chapterStates.optional')}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* 词汇表桥（Fix 4）：阅读中遇到生词的第二入口 */}
      <Link
        to="/theory/glossary"
        className={cn(
          'mt-3 flex min-h-11 items-center gap-1.5 border-t border-[var(--walnut-border)]/60 px-2 pt-2 text-xs text-[var(--ivory-muted)] transition-colors hover:text-[var(--ivory)]',
          FOCUS_RING,
        )}
      >
        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
        {t('theory.chapterView.glossaryEntry')}
      </Link>
      <Link
        to="/theory"
        className={cn(
          'mt-1 flex min-h-11 items-center gap-1.5 px-2 text-xs text-[var(--ivory-muted)] transition-colors hover:text-[var(--ivory)]',
          FOCUS_RING,
        )}
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        {t('theory.chapterView.backToChapters')}
      </Link>
    </div>
  );
}
