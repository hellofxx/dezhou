import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookMarked } from 'lucide-react';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import type { Lesson } from '../types';
import { ContentBlock } from './content';
import { lessonContentKey } from '../utils/contentKeys';

/**
 * quiz 原文 peek 内容薄件（AcademyPeek 壳由 CourseView 注入）：
 * lesson.content 只读渲染（contentKey 解析，en 不泄漏数据层中文），
 * 末尾附术语表入口（跨院路由先例 AcademyHome 工具区）。
 */
export function LessonQuizPeek({ lesson }: { lesson: Lesson }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 pt-2">
      {lesson.content.map((section, idx) => (
        <ContentBlock
          key={idx}
          section={section}
          contentKey={lessonContentKey(lesson.id, idx)}
        />
      ))}
      <Link
        to="/theory/glossary"
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-xs',
          'text-[var(--brass-text)] transition-colors hover:bg-[var(--walnut-light)]/40 hover:text-[var(--ivory)]',
          FOCUS_RING,
        )}
      >
        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
        {t('academy.courseView.glossaryEntry')}
      </Link>
    </div>
  );
}