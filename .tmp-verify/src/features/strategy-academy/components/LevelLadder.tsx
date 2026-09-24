import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Lock, CheckCircle2, Award, PlayCircle, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { LevelInfo } from '../types';
import { ProgressBar } from './ProgressBar';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';
import {
  resolveLevelTitle,
  resolveLevelDescription,
  resolveLevelUnlock,
  resolveLessonTitle,
} from '../utils/titleKeys';

interface LevelLadderProps {
  levels: LevelInfo[];
  completedLessons: string[];
  isUnlocked: (levelId: string) => boolean;
}

/**
 * 推导"当前活跃等级"：首个解锁且仍有未完成课程的等级；全部完成则 null。
 * Hero 的"继续学习"与阶梯默认展开共用此推导，避免口径分叉。
 */
export function findActiveLevelId(
  levels: LevelInfo[],
  completedLessons: string[],
  isUnlocked: (levelId: string) => boolean
): string | null {
  for (const level of levels) {
    const id = level.id ?? String(level.level);
    if (!isUnlocked(id)) continue;
    if (level.lessons.some((l) => !completedLessons.includes(l.id))) return id;
  }
  return null;
}

/** 课程阶梯：8 级课程以黄铜铆钉节点 + 发线脊柱呈现，活跃等级自动展开 */
export function LevelLadder({ levels, completedLessons, isUnlocked }: LevelLadderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeId = findActiveLevelId(levels, completedLessons, isUnlocked);
  const [expandedId, setExpandedId] = useState<string | null>(activeId);

  const openLevel = (level: LevelInfo) => {
    const target = level.lessons.find((l) => !completedLessons.includes(l.id)) ?? level.lessons[0];
    if (target) navigate(`/academy/lesson/${target.id}`);
  };

  const handleHeadClick = (level: LevelInfo, expanded: boolean) => {
    if (expanded) {
      openLevel(level);
    } else {
      setExpandedId(level.id ?? String(level.level));
    }
  };

  return (
    <section aria-label={t('academy.path.title')}>
      <div className="flex items-end justify-between gap-4 px-1 mb-3">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
            {t('academy.path.title')}
          </h2>
          <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.path.subtitle')}</p>
        </div>
      </div>

      <div className="level-ladder space-y-1">
        {levels.map((level, index) => {
          const id = level.id ?? String(level.level);
          const unlocked = isUnlocked(id);
          const completedInEntry = level.lessons.filter((l) => completedLessons.includes(l.id)).length;
          const totalInEntry = level.lessons.length;
          const progress = totalInEntry > 0 ? Math.round((completedInEntry / totalInEntry) * 100) : 0;
          const allCompleted = progress === 100;
          const isActive = id === activeId;
          const expanded = id === expandedId;

          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.standard, delay: 0.1 + index * 0.05 }}
              className={cn(
                'level-row',
                unlocked ? 'unlocked' : 'locked',
                allCompleted && 'completed',
                isActive && 'active'
              )}
            >
              {/* 节点列：黄铜铆钉 + 发线脊柱 */}
              <div className="level-node flex flex-col items-center">
                <span className="level-node-badge" aria-hidden="true">
                  {allCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : unlocked ? (
                    <span className="font-numeric text-[11px]">{level.level}</span>
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                </span>
                {isActive && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="level-you-here"
                  >
                    {t('academy.path.youAreHere')}
                  </motion.span>
                )}
              </div>

              {/* 行主体 */}
              <div className="flex-1 min-w-0 pb-1">
                <button
                  type="button"
                  onClick={() => handleHeadClick(level, expanded)}
                  disabled={!unlocked}
                  aria-expanded={unlocked ? expanded : undefined}
                  className="level-row-head w-full text-left"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'text-xl leading-none mt-0.5 shrink-0',
                        unlocked ? 'opacity-100' : 'opacity-40 grayscale'
                      )}
                      aria-hidden="true"
                    >
                      {level.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="level-kicker">
                          {t('academy.path.levelLabel', { n: level.level })}
                        </span>
                        {allCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--poker-success)]">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('academy.path.allComplete')}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[15px] text-[var(--ivory)] leading-tight">
                        {resolveLevelTitle(t, level)}
                      </h3>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          unlocked ? 'text-[var(--ivory-muted)]' : 'text-[var(--ivory-muted)]/70'
                        )}
                      >
                        {unlocked
                          ? resolveLevelDescription(t, level)
                          : resolveLevelUnlock(t, level)}
                      </p>

                      {unlocked && !allCompleted && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="text-[10px] text-[var(--ivory-dim)] font-numeric shrink-0">
                            {t('academy.path.lessonDone', { done: completedInEntry, total: totalInEntry })}
                          </span>
                          <ProgressBar value={progress} size="sm" className="max-w-[160px]" />
                        </div>
                      )}
                    </div>

                    {unlocked && (
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 text-[var(--ivory-muted)] mt-1 shrink-0 transition-transform duration-200',
                          expanded && 'rotate-180 text-[var(--brass-bright)]'
                        )}
                      />
                    )}
                  </div>
                </button>

                {/* 展开的课程 chips */}
                {unlocked && expanded && (
                  <div className="pl-1 pt-3 mt-1 border-t border-[var(--walnut-border)]/50">
                    <ul className="lesson-chip-grid" aria-label={t('academy.path.lessonList', { title: resolveLevelTitle(t, level) })}>
                      {level.lessons.map((lesson) => {
                        const done = completedLessons.includes(lesson.id);
                        const isNext = !done && lesson.id === level.lessons.find((l) => !completedLessons.includes(l.id))?.id;
                        const stateLabel = done
                          ? t('academy.path.lessonStates.done')
                          : isNext
                            ? t('academy.path.lessonStates.current')
                            : t('academy.path.lessonStates.locked');
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              onClick={() => navigate(`/academy/lesson/${lesson.id}`)}
                              aria-label={`${stateLabel} · ${resolveLessonTitle(t, lesson)}`}
                              className={cn('lesson-chip', done && 'done', isNext && 'current')}
                            >
                              <span className="lesson-chip-icon" aria-hidden="true">
                                {done ? (
                                  <CheckCircle2 className="w-3 h-3" />
                                ) : isNext ? (
                                  <PlayCircle className="w-3 h-3" />
                                ) : (
                                  <CircleDot className="w-3 h-3" />
                                )}
                              </span>
                              <span className="flex-1 min-w-0">
                                <span className="block truncate">{resolveLessonTitle(t, lesson)}</span>
                              </span>
                              <span className="flex items-center gap-1 text-[9px] font-numeric opacity-70 shrink-0">
                                <Clock className="w-2.5 h-2.5" />
                                {lesson.duration.replace(/ ?(min|分钟)$/, '')}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>

                    {allCompleted && (
                      <button
                        type="button"
                        onClick={() => navigate(`/academy/certification/${level.level}`)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline"
                      >
                        <Award className="w-3.5 h-3.5" />
                        {t('academy.path.certification')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// 未解锁课时的小圆点状态图标（锁定态为空心点，避免与等级锁图标混淆）
function CircleDot(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={props.className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}
