import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, PlayCircle, ChevronRight, Swords } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { TheoryLevelInfo } from '../types';

interface TheoryLevelCardProps {
  level: TheoryLevelInfo;
  unlocked: boolean;
  progress: number; // 0-100
  completedChapters: string[];
  index: number;
}

/** 理论 Level 卡片：进度、锁定态与继续学习入口（视觉与 strategy-academy LevelCard 对齐） */
export function TheoryLevelCard({ level, unlocked, progress, completedChapters, index }: TheoryLevelCardProps) {
  const navigate = useNavigate();

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
  // 有推荐轨道则跳学习轨道页，否则跳到首个推荐实践课程
  const rec = level.practiceRecommendations;
  const practiceTarget = rec.trackId
    ? '/academy/tracks'
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
      transition={{ duration: 0.3, delay: index * 0.06 }}
    >
      <button
        onClick={handleClick}
        disabled={!unlocked}
        aria-label={`理论 Level ${level.level}：${level.title}${unlocked ? '' : '（未解锁）'}`}
        className={cn(
          'w-full text-left rounded-lg border p-5 transition-all duration-200',
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
              {allCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
            </div>
            <h3 className="font-display text-[16px] text-[var(--ivory)] mb-0.5">{level.title}</h3>
            <p className="text-xs text-[var(--ivory-muted)] mb-3">{level.description}</p>

            {unlocked ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
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
                {allCompleted && practiceTarget && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`${level.title} 已完成，去实践应用`}
                    onClick={goPractice}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') goPractice(e);
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    去实践应用
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--ivory-muted)] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                {level.unlockRequirement}
              </p>
            )}
          </div>

          {unlocked && (
            <div className="shrink-0 self-center">
              {allCompleted ? (
                <ChevronRight className="w-5 h-5 text-[var(--ivory-muted)]" />
              ) : (
                <PlayCircle className="w-6 h-6 text-[var(--brass-bright)]" />
              )}
            </div>
          )}
        </div>
      </button>
    </motion.div>
  );
}
