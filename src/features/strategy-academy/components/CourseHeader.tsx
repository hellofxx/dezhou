import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, HelpCircle, Zap } from 'lucide-react';
import type { Lesson, LevelSummary } from '../types';
import {
  resolveLevelTitle,
  resolveLessonSubtitle,
  resolveLessonTitle,
} from '../utils/titleKeys';
import { LessonBookmarkButton } from './LessonBookmarkButton';
import { ProgressBar } from '@/shared/components/data-display/ProgressBar';

interface CourseHeaderProps {
  lesson: Lesson;
  /** 课程所属 LevelInfo 条目（本土课为 undefined） */
  levelEntry?: LevelSummary | undefined;
  isLocalLesson: boolean;
  isDrill: boolean;
  /** 变体内的课时序号（getLessonProgressSummary） */
  progress: { percent: number; current: number; total: number };
  completedLessons: string[];
  onBack: () => void;
  /**
   * 阅读工具行插槽（内容校对日期 / 内容纠错入口等由内容运营侧提供，本组件不感知数据来源）。
   * 缺省时不渲染该行。
   */
  toolbarSlot?: ReactNode;
}

/**
 * 课程页头部：返回 / Level 徽标 / 课时进度 / 标题副标题 + 时长题量 / 书签切换。
 * 纯展示组件：门禁、阶段切换、完成态都在 CourseView，这里不读 store（书签按钮自带 store 订阅）。
 */
export function CourseHeader({
  lesson,
  levelEntry,
  isLocalLesson,
  isDrill,
  progress,
  completedLessons,
  onBack,
  toolbarSlot,
}: CourseHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
      </button>
      {levelEntry ? (
        <div className="flex items-center gap-3 mb-4">
          <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)]">
            {levelEntry.icon} L{levelEntry.level} · {resolveLevelTitle(t, levelEntry)}
          </span>
          <span className="font-numeric text-xs text-[var(--ivory-muted)]">
            {t('academy.courseView.lessonOf', {
              defaultValue: '第 {{current}}/{{total}} 课',
              current: levelEntry.lessons.findIndex((l) => l.id === lesson.id) + 1,
              total: levelEntry.lessons.length,
            })}
          </span>
          <div className="flex-1">
            <ProgressBar
              label={t('academy.courseView.lessonOf', {
                defaultValue: '第 {{current}}/{{total}} 课',
                current: levelEntry.lessons.findIndex((l) => l.id === lesson.id) + 1,
                total: levelEntry.lessons.length,
              })}
              value={
                levelEntry.lessons.length > 0
                  ? Math.round(
                      (levelEntry.lessons.filter(
                        (l) => completedLessons.includes(l.id) && l.order < (lesson.order ?? 0)
                      ).length /
                        levelEntry.lessons.length) *
                        100
                    )
                  : 0
              }
              size="sm"
            />
          </div>
        </div>
      ) : isLocalLesson ? (
        <div className="flex items-center gap-3 mb-4">
          <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)] whitespace-nowrap">
            {t('academy.courseView.localLessonBadge', { defaultValue: '本土课 · L7 扩展' })}
          </span>
          <span className="font-numeric text-xs text-[var(--ivory-muted)]">
            {lesson.order
              ? t('academy.courseView.lessonOrder', {
                  defaultValue: '第 {{order}} 课',
                  order: lesson.order,
                })
              : ''}
          </span>
        </div>
      ) : (
        <ProgressBar
          value={progress.percent}
          size="sm"
          className="mb-4"
          label={t('academy.courseView.lessonOf', {
            defaultValue: '第 {{current}}/{{total}} 课',
            current: progress.current,
            total: progress.total,
          })}
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] text-[var(--ivory)] leading-tight">
            {resolveLessonTitle(t, lesson)}
          </h2>
          <p className="text-sm text-[var(--ivory-muted)] mt-1">{resolveLessonSubtitle(t, lesson)}</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--ivory-muted)] shrink-0 pt-1">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lesson.duration}
          </span>
          {isDrill ? (
            <span className="flex items-center gap-1 text-[var(--brass-bright)]">
              <Zap className="w-3.5 h-3.5" />
              Drill
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              {t('academy.courseView.quizCount', {
                defaultValue: '{{count}} 题',
                count: lesson.quiz.length,
              })}
            </span>
          )}
          <LessonBookmarkButton lessonId={lesson.id} />
        </div>
      </div>
      {toolbarSlot ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-[var(--ivory-muted)]">
          {toolbarSlot}
        </div>
      ) : null}
    </div>
  );
}
