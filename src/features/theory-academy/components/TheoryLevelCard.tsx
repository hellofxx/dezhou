import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, PlayCircle, ChevronDown, ChevronUp, Swords } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { TheoryLevelInfo } from '../types';
import { TheoryChapterList } from './TheoryChapterList';
import {
  resolveTheoryLevelTitle,
  resolveTheoryLevelDescription,
  resolveTheoryLevelUnlock,
} from '../utils/titleKeys';

interface TheoryLevelCardProps {
  level: TheoryLevelInfo;
  unlocked: boolean;
  progress: number; // 0-100
  completedChapters: string[];
  quizScores: Record<string, number>;
  index: number;
}

/**
 * 理论 Level 卡片：进度、锁定态与继续学习入口（视觉与 strategy-academy LevelCard 对齐）。
 * 已解锁 Level 可展开章节列表，支持已完成章节的自由回访复习。
 * 外层为 div role="button"（而非原生 button），以保证内部展开切换/章节行按钮的 HTML 合法性。
 */
export function TheoryLevelCard({ level, unlocked, progress, completedChapters, quizScores, index }: TheoryLevelCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const firstIncomplete = level.chapters.find((c) => !completedChapters.includes(c.id));
  const targetChapter = firstIncomplete ?? level.chapters[0];
  const allCompleted = progress === 100;
  const completedCount = level.chapters.filter((c) => completedChapters.includes(c.id)).length;

  const handleClick = () => {
    if (unlocked && targetChapter) {
      navigate(`/theory/chapter/${targetChapter.id}`);
    }
  };

  // Level 全部完成后的常驻“去实践”入口（复用 practiceRecommendations，不依赖完成当次会话）：
  // 有推荐轨道则携带 ?track= 跳学习轨道页（P1F-04，供 LearningTracksView 滚动高亮），
  // 否则跳到首个推荐实践课程
  const rec = level.practiceRecommendations;
  const practiceTarget = rec.trackId
    ? `/academy/tracks?track=${rec.trackId}`
    : rec.lessons[0]
      ? `/academy/lesson/${rec.lessons[0].id}`
      : null;

  const goPractice = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (practiceTarget) navigate(practiceTarget);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: typeof window !== 'undefined' && window.innerWidth < 768 ? 0 : index * 0.06 }}
    >
      <div
        role="button"
        tabIndex={unlocked ? 0 : -1}
        aria-disabled={!unlocked}
        aria-expanded={unlocked ? expanded : undefined}
        aria-describedby={unlocked ? `theory-level-progress-${level.id}` : undefined}
        onClick={handleClick}
        onKeyDown={(e) => {
          // 仅响应卡片自身的键盘事件，忽略内部按钮（展开切换/章节行）冒泡
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={t('theory.levelCard.levelAria', {
          level: level.level,
          title: resolveTheoryLevelTitle(t, level),
          locked: unlocked ? '' : t('theory.levelCard.lockedSuffix'),
        })}
        className={cn(
          'w-full text-left rounded-lg border p-5 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
          unlocked
            ? 'bg-[var(--felt)] border-[var(--walnut-border)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 cursor-pointer'
            : 'bg-[var(--felt)]/40 border-[var(--walnut-border)]/40 cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0',
              unlocked ? 'bg-[var(--walnut-raised)]' : 'bg-[var(--walnut-raised)]/50 grayscale'
            )}
          >
            {unlocked ? level.icon : <Lock className="w-5 h-5 text-[var(--ivory-muted)]" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--brass-deep)] font-medium">
                Theory {level.id.toUpperCase()}
              </span>
              {allCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--poker-success)]" />}
            </div>
            <h3 className="font-display text-[16px] text-[var(--ivory)] mb-0.5">{resolveTheoryLevelTitle(t, level)}</h3>
            <p className="text-xs text-[var(--ivory-muted)] mb-3">{resolveTheoryLevelDescription(t, level)}</p>

            {unlocked ? (
              <div className="space-y-1.5">
                <div
                  id={`theory-level-progress-${level.id}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-[var(--ivory-dim)]">
                    {completedCount}/{level.chapters.length} 章完成
                  </span>
                  <span className="font-numeric text-[var(--brass-bright)]">{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--brass-bright)] transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {!allCompleted && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                    className="mt-2 inline-flex min-h-11 items-center gap-2 px-4 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {t('theory.continueLearning')}
                  </button>
                )}
                {allCompleted && practiceTarget && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={t('theory.levelCard.doneAria', {
                      title: resolveTheoryLevelTitle(t, level),
                    })}
                    onClick={goPractice}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') goPractice(e);
                    }}
                    className="mt-1 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    去实践应用
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--ivory-muted)] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                {resolveTheoryLevelUnlock(t, level)}
              </p>
            )}
          </div>

          {unlocked && (
            <div className="shrink-0 self-center flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExpanded((v) => !v);
                }}
                aria-label={
                  expanded
                    ? t('theory.levelCard.collapseAria', { title: resolveTheoryLevelTitle(t, level) })
                    : t('theory.levelCard.expandAria', { title: resolveTheoryLevelTitle(t, level) })
                }
                aria-expanded={expanded}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 text-[var(--ivory-muted)] hover:text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
              >
                {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>

        {/* 章节列表：展开后任意章节可直达（已完成章节回访复习） */}
        {unlocked && expanded && (
          <TheoryChapterList
            chapters={level.chapters}
            completedChapters={completedChapters}
            quizScores={quizScores}
          />
        )}
      </div>
    </motion.div>
  );
}