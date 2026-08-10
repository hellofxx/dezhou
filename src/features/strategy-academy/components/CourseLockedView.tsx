import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Home, ArrowRight, CheckCircle2 } from 'lucide-react';
import { LEVELS } from '../data/courses';
import { resolveLevelTitle } from '../utils/titleKeys';
import type { Lesson } from '../types';

interface CourseLockedViewProps {
  lesson: Lesson;
  levelLocked: boolean;
  /** 前置 Level 条目的 ID 列表 */
  prereqLevelIds: string[];
  /** 缺失的课程级前置 ID 列表 */
  missingPrereqLessonIds: string[];
  completedLessons: string[];
}

export function CourseLockedView({
  lesson,
  levelLocked,
  prereqLevelIds,
  missingPrereqLessonIds,
  completedLessons,
}: CourseLockedViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // 无显式前置时回退到前一个条目标题（如 l4b → "进阶思维·范围与EV"）
  const levelEntry = LEVELS.find((l) => l.lessons.some((x) => x.id === lesson.id));
  const entryIdx = levelEntry ? LEVELS.indexOf(levelEntry) : -1;
  const fallbackTitle = levelEntry && entryIdx > 0 ? LEVELS[entryIdx - 1]?.title : undefined;
  const requiredLevelText =
    prereqLevelIds.length > 0
      ? prereqLevelIds
          .map((id) => LEVELS.find((l) => l.id === id)?.title)
          .filter(Boolean)
          .join('、')
      : fallbackTitle ?? `Level ${Math.max(1, lesson.level - 1)}`;

  // 计算前置 Level 条目完成进度
  const getLevelEntryCompletion = (levelId: string) => {
    const entry = LEVELS.find((l) => l.id === levelId);
    if (!entry) return { completed: 0, total: 0, percent: 0 };
    const total = entry.lessons.length;
    const completed = entry.lessons.filter((l) => completedLessons.includes(l.id)).length;
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  // 找某 Level 第一个未完成课程
  const findFirstIncompleteLesson = (levelId: string): Lesson | undefined => {
    const entry = LEVELS.find((l) => l.id === levelId);
    if (!entry) return undefined;
    return entry.lessons.find((l) => !completedLessons.includes(l.id));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-12">
      <Lock className="w-10 h-10 text-[var(--ivory-muted)]" />
      <div className="text-center space-y-4">
        <p className="text-[var(--ivory)] font-display text-lg">
          {t('academy.courseView.lockedTitle', { defaultValue: '该课程尚未解锁' })}
        </p>

        {levelLocked && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--ivory-muted)]">
              {t('academy.courseView.prereqHint', {
                defaultValue: '请先完成以下前置课程，再来学习本课程。',
              })}
            </p>

            {/* 列出需要的前置 Level 条目 */}
            {prereqLevelIds.length > 0
              ? prereqLevelIds.map((levelId) => {
                  const entry = LEVELS.find((l) => l.id === levelId);
                  if (!entry) return null;
                  const { completed, total, percent } = getLevelEntryCompletion(levelId);
                  const isAllCompleted = completed >= total;
                  const firstIncomplete = findFirstIncompleteLesson(levelId);

                  return (
                    <div
                      key={levelId}
                      className="flex items-center gap-3 rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] px-4 py-3 text-left"
                    >
                      <span className="text-xl shrink-0">{entry.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--ivory)] font-display">
                          {resolveLevelTitle(t, entry)}
                        </p>
                        <p className="text-xs text-[var(--ivory-muted)] mt-0.5">
                          {t('academy.courseView.completed', { defaultValue: '已完成' })}{' '}
                          <span className="font-numeric text-[var(--brass-bright)]">{completed}</span>
                          /<span className="font-numeric">{total}</span>{' '}
                          {t('academy.courseView.lessonUnit', { defaultValue: '课时' })}
                        </p>
                        {/* 细进度条 */}
                        <div className="w-full h-1 rounded-full bg-[var(--walnut)] mt-1.5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[var(--brass-bright)] transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      {isAllCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs text-[var(--success)] shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('academy.courseView.completed', { defaultValue: '已完成' })}
                        </span>
                      ) : firstIncomplete ? (
                        <button
                          onClick={() => navigate(`/academy/lesson/${firstIncomplete.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-xs hover:opacity-90 transition-opacity shrink-0"
                        >
                          {t('academy.courseView.goComplete', { defaultValue: '去完成' })}
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : null}
                    </div>
                  );
                })
              : levelEntry && entryIdx > 0 && (
                  <div className="flex items-center gap-3 rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] px-4 py-3 text-left">
                    <span className="text-xl shrink-0">{LEVELS[entryIdx - 1]?.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--ivory)] font-display">
                        {requiredLevelText}
                      </p>
                      <p className="text-xs text-[var(--ivory-muted)] mt-0.5">
                        {t('academy.courseView.completeLevelFirst', {
                          defaultValue: '请先完成该 Level 的所有课程',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const prevEntry = LEVELS[entryIdx - 1];
                        if (prevEntry) {
                          const firstIncomplete = prevEntry.lessons.find(
                            (l) => !completedLessons.includes(l.id)
                          );
                          if (firstIncomplete) {
                            navigate(`/academy/lesson/${firstIncomplete.id}`);
                          }
                        }
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-xs hover:opacity-90 transition-opacity shrink-0"
                    >
                      {t('academy.courseView.goComplete', { defaultValue: '去完成' })}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
          </div>
        )}

        {/* 课程级前置缺失（prerequisites 字段） */}
        {!levelLocked && missingPrereqLessonIds.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-[var(--ivory-muted)]">
              {t('academy.courseView.missingPrereqHint', {
                defaultValue: '请先完成以下前置课程：',
              })}
            </p>
            {missingPrereqLessonIds.map((id) => (
              <button
                key={id}
                onClick={() => navigate(`/academy/lesson/${id}`)}
                className="flex items-center gap-2 rounded-lg bg-[var(--walnut-raised)] border border-[var(--walnut-border)] px-4 py-2.5 text-left w-full hover:border-[var(--brass-bright)]/50 transition-colors group"
              >
                <span className="text-xs text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors">
                  {id}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] transition-colors ml-auto shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/academy')}
        className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity mt-2"
      >
        <Home className="w-4 h-4" />
        {t('academy.courseView.backToAcademy', { defaultValue: '返回学院' })}
      </button>
    </div>
  );
}