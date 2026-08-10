import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2, PlayCircle, ChevronRight, Award } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { LevelInfo } from '../types';
import { ProgressBar } from './ProgressBar';
import {
  resolveLevelTitle,
  resolveLevelDescription,
  resolveLevelUnlock,
} from '../utils/titleKeys';

interface LevelCardProps {
  level: LevelInfo;
  unlocked: boolean;
  completedLessons: string[];
  index: number;
}

export function LevelCard({ level, unlocked, completedLessons, index }: LevelCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const firstIncompleteLesson = level.lessons.find((l) => !completedLessons.includes(l.id));
  const targetLesson = firstIncompleteLesson ?? level.lessons[0];
  // P1E-08: 进度按条目自身口径计算（l4a/l4b 各自独立），
  // 与"N/N 课时完成"文案同源，不再使用 getLevelProgress(level) 的合并口径
  const completedInEntry = completedLessons.filter((id) =>
    level.lessons.some((l) => l.id === id)
  ).length;
  const totalInEntry = level.lessons.length;
  const progress = totalInEntry > 0 ? Math.round((completedInEntry / totalInEntry) * 100) : 0;
  const allCompleted = progress === 100;

  const handleClick = () => {
    if (unlocked && targetLesson) {
      navigate(`/academy/lesson/${targetLesson.id}`);
    }
  };

  // 审计 1.2：级别全部完成后提供认证入口（激活 /academy/certification/:level 死路由）
  const goCertification = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigate(`/academy/certification/${level.level}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
    >
      <button
        onClick={handleClick}
        disabled={!unlocked}
        className={cn(
          'w-full text-left rounded-lg border p-5 transition-all duration-200',
          unlocked
            ? 'bg-[var(--felt)] border-[var(--walnut-border)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 cursor-pointer'
            : 'bg-[var(--felt)]/40 border-[var(--walnut-border)]/40 cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div
            className={cn(
              'w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0',
              unlocked ? 'bg-[var(--walnut-raised)]' : 'bg-[var(--walnut-raised)]/50 grayscale'
            )}
          >
            {unlocked ? level.icon : <Lock className="w-5 h-5 text-[var(--ivory-muted)]" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--brass-deep)] font-medium">
                Level {level.level}
              </span>
              {allCompleted && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--poker-success)]" />
              )}
            </div>
            <h3 className="font-display text-[16px] text-[var(--ivory)] mb-0.5">{resolveLevelTitle(t, level)}</h3>
            <p className="text-xs text-[var(--ivory-muted)] mb-3">{resolveLevelDescription(t, level)}</p>

            {unlocked ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--ivory-dim)]">
                    {completedInEntry}/{totalInEntry} 课时完成
                  </span>
                  <span className="font-numeric text-[var(--brass-bright)]">{progress}%</span>
                </div>
                <ProgressBar value={progress} size="sm" />
                {allCompleted && (
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label={`参加 Level ${level.level} 认证测验`}
                    onClick={goCertification}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') goCertification(e);
                    }}
                    className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline"
                  >
                    <Award className="w-3.5 h-3.5" />
                    参加 Level {level.level} 认证测验
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--ivory-muted)] flex items-center gap-1.5">
                <Lock className="w-3 h-3" />
                {resolveLevelUnlock(t, level)}
              </p>
            )}
          </div>

          {/* Right action */}
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
