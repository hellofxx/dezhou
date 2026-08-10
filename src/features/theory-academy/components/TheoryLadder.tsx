import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronDown, Lock, CheckCircle2, PlayCircle, BookOpen, Swords } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { TheoryChapter, TheoryLevelInfo, TheoryTier } from '../types';
import {
  resolveChapterTitle,
  resolveTheoryLevelTitle,
  resolveTheoryLevelDescription,
  resolveTheoryLevelUnlock,
} from '../utils/titleKeys';

const TIER_LABEL_KEY: Record<TheoryTier, string> = {
  basic: 'theory.tierBasic',
  intermediate: 'theory.tierIntermediate',
  advanced: 'theory.tierAdvanced',
};

const TIER_CLASS: Record<TheoryTier, string> = {
  basic: 'text-[var(--poker-success)] bg-[var(--poker-success)]/12 border-[var(--poker-success)]/30',
  intermediate: 'text-[var(--brass-bright)] bg-[var(--brass-bright)]/10 border-[var(--brass-bright)]/25',
  advanced: 'text-[var(--poker-info)] bg-[var(--poker-info)]/12 border-[var(--poker-info)]/30',
};

interface TheoryLadderProps {
  levels: TheoryLevelInfo[];
  completedChapters: string[];
  quizScores: Record<string, number>;
  isUnlocked: (levelId: string) => boolean;
}

/** 推导当前活跃理论等级：首个解锁且仍有未读章节的等级；全部完成则为 null */
export function findActiveTheoryLevelId(
  levels: TheoryLevelInfo[],
  completedChapters: string[],
  isUnlocked: (levelId: string) => boolean,
): string | null {
  for (const level of levels) {
    if (!isUnlocked(level.id)) continue;
    if (level.chapters.some((c) => !completedChapters.includes(c.id))) return level.id;
  }
  return null;
}

/** 理论进阶阶梯：T1-T9 以黄铜节点 + 发线脊柱纵向呈现，活跃等级自动展开章节 chips */
export function TheoryLadder({ levels, completedChapters, quizScores, isUnlocked }: TheoryLadderProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const activeId = findActiveTheoryLevelId(levels, completedChapters, isUnlocked);
  const [expandedId, setExpandedId] = useState<string | null>(activeId);

  const openChapter = (chapterId: string) => navigate(`/theory/chapter/${chapterId}`);

  const handleHeadClick = (level: TheoryLevelInfo, expanded: boolean) => {
    if (expanded) {
      const target = level.chapters.find((c) => !completedChapters.includes(c.id)) ?? level.chapters[0];
      if (target) openChapter(target.id);
    } else {
      setExpandedId(level.id);
    }
  };

  return (
    <section aria-label={t('theory.ladder.title')}>
      <div className="px-1 mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
          {t('theory.ladder.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('theory.ladder.subtitle')}</p>
      </div>

      <div className="level-ladder space-y-1">
        {levels.map((level, index) => {
          const unlocked = isUnlocked(level.id);
          const completedInLevel = level.chapters.filter((c) => completedChapters.includes(c.id)).length;
          const totalInLevel = level.chapters.length;
          const progress = totalInLevel > 0 ? Math.round((completedInLevel / totalInLevel) * 100) : 0;
          const allCompleted = progress === 100;
          const isActive = level.id === activeId;
          const expanded = level.id === expandedId;

          // 理论→实践桥接（与旧 TheoryLevelCard 口径一致）
          const rec = level.practiceRecommendations;
          const practiceTarget = rec.trackId
            ? `/academy/tracks?track=${rec.trackId}`
            : rec.lessons[0]
              ? `/academy/lesson/${rec.lessons[0].id}`
              : null;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transitionStandard, delay: 0.08 + index * 0.05 }}
              className={cn(
                'level-row',
                unlocked ? 'unlocked' : 'locked',
                allCompleted && 'completed',
                isActive && 'active'
              )}
            >
              {/* 节点列 */}
              <div className="level-node flex flex-col items-center">
                <span className="level-node-badge" aria-hidden="true">
                  {allCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : unlocked ? (
                    <span className="font-numeric text-[11px]">T{level.level}</span>
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
                    {t('theory.ladder.youAreHere')}
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
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded-full border text-[9px] font-semibold tracking-wide',
                            TIER_CLASS[level.tier]
                          )}
                        >
                          {t(TIER_LABEL_KEY[level.tier])}
                        </span>
                        {allCompleted && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-[var(--poker-success)]">
                            <CheckCircle2 className="w-3 h-3" />
                            {t('theory.chapters')} · {t('theory.ladder.chapterDone', { done: completedInLevel, total: totalInLevel })}
                          </span>
                        )}
                      </div>
                      <h3 className="font-display text-[15px] text-[var(--ivory)] leading-tight">
                        {resolveTheoryLevelTitle(t, level)}
                      </h3>
                      <p
                        className={cn(
                          'text-xs mt-1',
                          unlocked ? 'text-[var(--ivory-muted)]' : 'text-[var(--ivory-muted)]/70'
                        )}
                      >
                        {unlocked
                          ? resolveTheoryLevelDescription(t, level)
                          : resolveTheoryLevelUnlock(t, level)}
                      </p>

                      {unlocked && !allCompleted && (
                        <div className="mt-2.5 flex items-center gap-3">
                          <span className="text-[10px] text-[var(--ivory-dim)] font-numeric shrink-0">
                            {t('theory.ladder.chapterDone', { done: completedInLevel, total: totalInLevel })}
                          </span>
                          <div className="h-1 flex-1 max-w-[160px] rounded-full bg-[var(--walnut-raised)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--brass-bright)] transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
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

                {/* 展开的章节 chips */}
                {unlocked && expanded && (
                  <div className="pl-1 pt-3 mt-1 border-t border-[var(--walnut-border)]/50">
                    <ul className="lesson-chip-grid" aria-label={t('theory.ladder.chapterList', { title: resolveTheoryLevelTitle(t, level) })}>
                      {level.chapters.map((chapter) => (
                        <TheoryChapterChip
                          key={chapter.id}
                          chapter={chapter}
                          completed={completedChapters.includes(chapter.id)}
                          isNext={!completedChapters.includes(chapter.id) &&
                            chapter.id === level.chapters.find((c) => !completedChapters.includes(c.id))?.id}
                          score={quizScores[chapter.id]}
                          onOpen={() => openChapter(chapter.id)}
                        />
                      ))}
                    </ul>

                    {allCompleted && practiceTarget && (
                      <button
                        type="button"
                        onClick={() => navigate(practiceTarget)}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        {t('theory.ladder.applyPractice')}
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

interface TheoryChapterChipProps {
  chapter: TheoryChapter;
  completed: boolean;
  isNext: boolean;
  score: number | undefined;
  onOpen: () => void;
}

/** 章节 chip：状态图标 + 标题 + 阅读时长 + 小测分徽章 */
function TheoryChapterChip({ chapter, completed, isNext, score, onOpen }: TheoryChapterChipProps) {
  const { t } = useTranslation();
  const stateLabel = completed
    ? t('theory.ladder.chapterStates.done')
    : isNext
      ? t('theory.ladder.chapterStates.current')
      : t('theory.ladder.chapterStates.locked');

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${stateLabel} · ${resolveChapterTitle(t, chapter)}`}
        className={cn('lesson-chip', completed && 'done', isNext && 'current')}
      >
        <span className="lesson-chip-icon" aria-hidden="true">
          {completed ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : isNext ? (
            <PlayCircle className="w-3 h-3" />
          ) : (
            <BookOpen className="w-3 h-3" />
          )}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate">{resolveChapterTitle(t, chapter)}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          {completed && typeof score === 'number' && (
            <span
              className={cn(
                'quiz-score-badge',
                score >= 80 && 'pass',
                score >= 60 && score < 80 && 'mid',
                score < 60 && 'low'
              )}
            >
              {t('theory.ladder.quizScore', { score })}
            </span>
          )}
          <span className="text-[9px] font-numeric opacity-70 flex items-center gap-1">
            {chapter.duration.replace(/ ?(min|分钟)$/, '')}
          </span>
        </span>
      </button>
    </li>
  );
}
