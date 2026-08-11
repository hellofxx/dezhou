import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Circle } from 'lucide-react';
import type { TheoryChapter } from '../types';
import { resolveChapterTitle } from '../utils/titleKeys';

interface TheoryChapterListProps {
  chapters: TheoryChapter[];
  completedChapters: string[];
  quizScores: Record<string, number>;
}

/**
 * Level 卡片内的章节列表：已解锁 Level 展开后可直达任意章节（已完成章节自由回访复习）。
 * 已完成章节显示绿色对勾与历史最高分；点击行导航到章节页（与 URL 门禁口径一致，不新增章节级门禁）。
 */
export function TheoryChapterList({ chapters, completedChapters, quizScores }: TheoryChapterListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ul className="mt-4 pt-3 border-t border-[var(--walnut-border)] space-y-1">
      {chapters.map((chapter) => {
        const completed = completedChapters.includes(chapter.id);
        const score = quizScores[chapter.id];
        return (
          <li key={chapter.id}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/theory/chapter/${chapter.id}`);
              }}
              // hover 预取章节页 chunk（与路由层 lazy 复用同一 chunk，提前 fetch 减少点击等待）
              onMouseEnter={() => {
                void import('./TheoryChapterView');
              }}
              aria-label={t('theory.chapterList.chapterAria', {
                order: chapter.order,
                title: resolveChapterTitle(t, chapter),
                revisitable: completed ? t('theory.chapterList.revisitable') : '',
              })}
              className="w-full flex min-h-11 items-center gap-2.5 px-2.5 py-2 rounded-md text-left text-xs transition-colors hover:bg-[var(--walnut-raised)]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
            >
              {completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--poker-success)] shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-[var(--ivory-muted)] shrink-0" />
              )}
              <span className="text-[var(--ivory-muted)] shrink-0">{t('theory.chapterList.chapterOrder', { order: chapter.order })}</span>
              <span className="flex-1 min-w-0 truncate text-[var(--ivory)]">{resolveChapterTitle(t, chapter)}</span>
              <span className="text-[var(--ivory-muted)] shrink-0">{chapter.duration}</span>
              {completed && typeof score === 'number' && (
                <span className="font-numeric text-[var(--brass-bright)] shrink-0">{score}{t('theory.chapterList.scoreSuffix')}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
