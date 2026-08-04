import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useTheoryStore } from '../store';
import { THEORY_LEVELS } from '../data/levels';
import { getLevelTargetChapter } from '../utils/theoryProgress';

/**
 * 理论学习路径地图：T1-T9 九节点横向链，三态着色（已完成/进行中/锁定）。
 * 教育依据：心理模型（Mental Model）全局方向感 + 目标梯度效应（Goal Gradient Effect）。
 * 纯 CSS flex 实现，移动端 overflow-x-auto 横向滚动。
 */
export function TheoryLearningMap() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);

  return (
    <section className="panel">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold mb-4">
        {t('theory.learningMap')}
      </h2>
      <div className="overflow-x-auto pb-1">
        <div className="flex items-center min-w-max">
          {THEORY_LEVELS.map((level, index) => {
            const unlocked = isTheoryLevelUnlocked(level.id);
            const completed = level.chapters.length > 0 && level.chapters.every((c) => completedChapters.includes(c.id));
            const inProgress = unlocked && !completed;
            const target = getLevelTargetChapter(level, completedChapters);

            return (
              <div key={level.id} className="flex items-center">
                {index > 0 && (
                  <div className="w-6 md:w-10 h-px bg-[var(--walnut-border)] shrink-0" aria-hidden="true" />
                )}
                <button
                  onClick={() => {
                    if (unlocked && target) navigate(`/theory/chapter/${target.id}`);
                  }}
                  disabled={!unlocked}
                  aria-label={`Theory ${level.id.toUpperCase()}：${level.title}${completed ? '（已完成）' : unlocked ? '（进行中）' : '（未解锁）'}`}
                  className={cn(
                    'flex flex-col items-center gap-1.5 px-1 py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                    unlocked ? 'cursor-pointer hover:bg-[var(--walnut-raised)]/40' : 'cursor-not-allowed'
                  )}
                >
                  {/* 节点圆 */}
                  <span
                    className={cn(
                      'w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 shrink-0',
                      completed && 'bg-[var(--poker-success-bg)] border-[var(--poker-success)] text-[var(--poker-success)]',
                      inProgress && 'bg-[var(--brass-glow)] border-[var(--brass-bright)] text-[var(--brass-bright)]',
                      !unlocked && 'bg-transparent border-[var(--walnut-border)] text-[var(--ivory-muted)] opacity-60'
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : unlocked ? (
                      <span className="text-xs font-semibold font-numeric">T{level.level}</span>
                    ) : (
                      <Lock className="w-3.5 h-3.5" />
                    )}
                  </span>
                  {/* 文字标签：移动端隐藏，桌面端显示 */}
                  <span
                    className={cn(
                      'hidden md:block text-[10px] max-w-16 truncate',
                      completed && 'text-[var(--poker-success)]',
                      inProgress && 'text-[var(--brass-bright)]',
                      !unlocked && 'text-[var(--ivory-muted)]'
                    )}
                  >
                    {level.title}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}