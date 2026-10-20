import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Clock, Target } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { transitionStandard } from '@/shared/utils/motion';
import { ProgressBar } from '@/shared/components/business/ProgressBar';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import { getChapterDifficulty } from '../utils/theoryMeta';
import {
  resolveChapterSubtitle,
  resolveChapterTitle,
  resolveTheoryLevelTitle,
} from '../utils/titleKeys';
import { resolveTheoryObjectives } from '../utils/contentKeys';

interface TheoryChapterHeaderProps {
  chapter: TheoryChapter;
  level: TheoryLevelInfo;
  completedChapters: string[];
  chapterCompleted: boolean;
  bestScore?: number;
}

/** 章节页头部：Level/章节标题 + 难度/完成态 + 学习目标卡 */
export function TheoryChapterHeader({
  chapter,
  level,
  completedChapters,
  chapterCompleted,
  bestScore,
}: TheoryChapterHeaderProps) {
  const { t } = useTranslation();
  const completedInLevel = level.chapters.filter((item) =>
    completedChapters.includes(item.id),
  ).length;
  const progress =
    level.chapters.length > 0
      ? Math.round((completedInLevel / level.chapters.length) * 100)
      : 0;
  const difficulty = getChapterDifficulty(chapter.level);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionStandard}
        className="mb-6"
      >
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="course-level inline-flex items-center gap-1.5 rounded-full bg-[var(--walnut-raised)] px-3 py-1 text-xs font-medium text-[var(--brass-bright)]">
            {level.icon} T{level.level} · {resolveTheoryLevelTitle(t, level)}
          </span>
          <span className="font-numeric text-xs text-[var(--ivory-muted)]">
            {t('theory.chapterView.chapterOf', {
              current: chapter.order,
              total: level.chapters.length,
            })}
          </span>
          <div className="flex-1 min-w-[160px]">
            <ProgressBar
              label={t('theory.chapterView.chapterOf', {
                current: chapter.order,
                total: level.chapters.length,
              })}
              value={progress}
              size="sm"
            />
          </div>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[22px] md:text-[26px] leading-tight text-[var(--ivory)] mb-1">
              {resolveChapterTitle(t, chapter)}
            </h1>
            <p className="text-sm text-[var(--ivory-dim)]">{resolveChapterSubtitle(t, chapter)}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--ivory-muted)] shrink-0 pt-1">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {chapter.duration}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide',
                difficulty < 0.35
                  ? 'bg-[var(--poker-success-bg)] text-[var(--poker-success)]'
                  : difficulty < 0.6
                    ? 'bg-[var(--poker-warning-bg)] text-[var(--poker-warning)]'
                    : 'bg-[var(--poker-danger-bg)] text-[var(--poker-danger)]',
              )}
            >
              {difficulty < 0.35
                ? t('theory.difficultyBasic')
                : difficulty < 0.6
                  ? t('theory.difficultyMid')
                  : t('theory.difficultyAdvanced')}
            </span>
            {chapterCompleted && (
              <span className="inline-flex items-center gap-1 text-[var(--poker-success)]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('theory.chapterView.completed')}
              </span>
            )}
            {chapterCompleted && typeof bestScore === 'number' && (
              <span className="font-numeric text-[var(--brass-bright)]">
                {t('theory.chapterView.bestScore', { score: bestScore })}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {chapter.objectives && chapter.objectives.length > 0 && (
        <div className="panel border-[var(--poker-frost)]/40 bg-[var(--poker-frost-bg)] max-w-3xl mx-auto">
          <h2 className="text-sm font-semibold text-[var(--poker-frost)] mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 shrink-0" />
            {t('theory.objectives')}
          </h2>
          <ul className="space-y-1">
            {resolveTheoryObjectives(t, chapter.id, chapter.objectives).map((objective, index) => (
              <li
                key={index}
                className="text-sm text-[var(--ivory-dim)] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[var(--poker-frost)] mt-0.5 shrink-0">•</span>
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
