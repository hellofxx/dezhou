import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookMarked } from 'lucide-react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import type { TheoryChapter } from '../types';
import { groupTheorySections } from '../utils/theorySectionGroups';
import { theoryContentKey } from '../utils/contentKeys';
import { TheorySectionRenderer } from './TheorySectionRenderer';

/**
 * quiz 原文 peek 内容（AcademyPeek 的 feature 注入薄件）：
 * 分组只读渲染章节正文（不含 CalcDrill / CTA / 自动要点卡），
 * 末尾附术语表桥 —— 答错回顾概念时的第二入口（Fix 4 词汇表桥）。
 */
export function TheoryQuizPeek({ chapter }: { chapter: TheoryChapter }) {
  const { t } = useTranslation();
  const groups = groupTheorySections(chapter.content);
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.headingOrdinal} className="space-y-4">
          {group.entries.map(({ section, rawIndex }) => (
            <TheorySectionRenderer
              key={rawIndex}
              section={section}
              contentKey={theoryContentKey(chapter.id, rawIndex)}
              chapterOrder={chapter.order}
              sectionOrdinal={group.headingOrdinal}
            />
          ))}
        </div>
      ))}
      <Link
        to="/theory/glossary"
        className={`inline-flex min-h-11 items-center gap-1.5 text-xs text-[var(--brass-bright)] hover:underline rounded ${FOCUS_RING}`}
      >
        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
        {t('theory.chapterView.glossaryEntry')}
      </Link>
    </div>
  );
}