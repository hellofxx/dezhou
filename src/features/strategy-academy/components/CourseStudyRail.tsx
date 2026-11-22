import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BookMarked, CheckCircle2, Clock, HelpCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { ProgressBar } from '@/shared/components/data-display/ProgressBar';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import type { Lesson, LevelSummary } from '../types';
import { resolveLessonTitle, resolveLevelTitle } from '../utils/titleKeys';

interface CourseStudyRailProps {
  lesson: Lesson;
  levelEntry: LevelSummary;
  completedLessons: string[];
}

/**
 * 课时页学习导轨（xl 起显示）：本 Level 课程列表 + 完成进度 + 课时元信息。
 * 只接收展示数据，不读 store；课时切换走真实路由。
 */
export function CourseStudyRail({ lesson, levelEntry, completedLessons }: CourseStudyRailProps) {
  const { t } = useTranslation();
  const currentIndex = levelEntry.lessons.findIndex((item) => item.id === lesson.id);
  const completedInLevel = levelEntry.lessons.filter((item) =>
    completedLessons.includes(item.id),
  ).length;
  const progress =
    levelEntry.lessons.length > 0
      ? Math.round((completedInLevel / levelEntry.lessons.length) * 100)
      : 0;

  return (
    <div className="walnut-panel rounded-lg border border-[var(--walnut-border)] p-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[var(--brass-text)]">
        <span aria-hidden="true">{levelEntry.icon}</span>
        <span className="font-numeric">L{levelEntry.level}</span>
        <span className="truncate">{resolveLevelTitle(t, levelEntry)}</span>
      </p>
      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-[var(--ivory-muted)]">
        <span className="font-numeric">
          {t('academy.courseView.lessonOf', {
            current: currentIndex >= 0 ? currentIndex + 1 : 0,
            total: levelEntry.lessons.length,
          })}
        </span>
        <span className="font-numeric">
          {completedInLevel}/{levelEntry.lessons.length}
        </span>
      </div>
      <ProgressBar
        className="mt-1.5"
        size="sm"
        value={progress}
        label={t('academy.courseView.railTitle')}
      />

      <SectionLabel as="h2" className="mt-4">
        {t('academy.courseView.railTitle')}
      </SectionLabel>
      <nav aria-label={t('academy.courseView.railTitle')} className="mt-2">
        <ol className="space-y-0.5">
          {levelEntry.lessons.map((item) => {
            const isCurrent = item.id === lesson.id;
            const done = completedLessons.includes(item.id);
            return (
              <li key={item.id}>
                <Link
                  to={`/lesson/${item.id}`}
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
                        {String(item.order).padStart(2, '0')}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{resolveLessonTitle(t, item)}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--walnut-border)]/60 pt-2 text-[11px] text-[var(--ivory-muted)]">
        <span className="inline-flex items-center gap-1 font-numeric">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {lesson.duration}
        </span>
        <span className="inline-flex items-center gap-1">
          <HelpCircle className="h-3 w-3" aria-hidden="true" />
          {t('academy.courseView.quizCount', { count: lesson.quiz.length })}
        </span>
      </div>

      {/* 词汇表桥：跨院路由先例 AcademyHome 工具区（/theory/glossary） */}
      <Link
        to="/theory/glossary"
        className={cn(
          'mt-3 flex items-center gap-2 rounded-md px-2 py-2 text-xs transition-colors',
          'text-[var(--ivory-dim)] hover:bg-[var(--walnut-light)]/40 hover:text-[var(--ivory)]',
          FOCUS_RING,
        )}
      >
        <BookMarked className="h-3.5 w-3.5 shrink-0 text-[var(--brass-text)]" aria-hidden="true" />
        {t('academy.courseView.glossaryEntry')}
      </Link>
    </div>
  );
}
