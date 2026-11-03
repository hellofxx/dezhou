import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { useTheoryStore } from '../store';
import { findLevelSummaryByChapterId, isLevelUnlockedByCompleted } from '../utils/theoryMeta';
import { THEORY_PATHS, type TheoryPath } from '../data/theoryPaths';

interface PathCardState {
  path: TheoryPath;
  done: number;
  total: number;
  /** 'open' 有可进入的下一章 / 'locked' 下一章所在 Level 未解锁 / 'done' 全部读完 */
  state: 'open' | 'locked' | 'done';
  nextChapterId: string | undefined;
}

/**
 * 学习路径区：三条静态主题路径的进度与下一章入口，仅标准变体展示。
 *
 * 不新增门禁：章节能否进入完全由 theoryMeta 的既有 Level 解锁判定决定；
 * 调试解锁沿用模块既有旁路（store 用 isDebugUnlockActive，组件内用 unlockAll）。
 */
export function TheoryLearningPaths() {
  const { t } = useTranslation();
  const activeVariant = useTheoryStore((s) => s.progress.activeVariant);
  const completedChapters = useTheoryStore((s) => s.progress.completedChapters);
  const debugUnlock = useDebugModeStore((s) => s.unlockAll);

  // 路径成员全部来自标准变体的章节（含 6-max 增补章），其他变体切换为骨架内容，不展示
  if (activeVariant !== 'standard') return null;

  const completed = new Set(completedChapters);
  const isChapterUnlocked = (chapterId: string): boolean => {
    const level = findLevelSummaryByChapterId(chapterId);
    if (!level) return false;
    return debugUnlock || isLevelUnlockedByCompleted(level.id, completedChapters);
  };

  const cards: PathCardState[] = THEORY_PATHS.map((path) => {
    const total = path.chapterIds.length;
    const done = path.chapterIds.filter((id) => completed.has(id)).length;
    if (total > 0 && done === total) {
      return { path, done, total, state: 'done', nextChapterId: undefined };
    }
    // 首个未完成且所属 Level 已解锁的成员；没有则整条路径暂时锁定
    const nextChapterId = path.chapterIds.find((id) => !completed.has(id) && isChapterUnlocked(id));
    return {
      path,
      done,
      total,
      state: nextChapterId ? 'open' : 'locked',
      nextChapterId,
    };
  });

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.16 }}
      aria-label={t('theory.paths.title')}
    >
      <div className="px-1 mb-3">
        <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
          {t('theory.paths.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('theory.paths.subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const percent = card.total > 0 ? Math.round((card.done / card.total) * 100) : 0;
          return (
            <article
              key={card.path.id}
              data-path-id={card.path.id}
              data-path-state={card.state}
              className="panel flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-[15px] text-[var(--ivory)] leading-tight">
                  {t(`theory.paths.${card.path.id}.title`)}
                </h3>
                <span className="font-numeric text-xs text-[var(--brass-bright)] shrink-0">
                  {t('theory.paths.progress', { done: card.done, total: card.total })}
                </span>
              </div>

              <p className="text-xs text-[var(--ivory-muted)] leading-relaxed flex-1">
                {t(`theory.paths.${card.path.id}.description`)}
              </p>

              <div className="h-1 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--brass-bright)] transition-all"
                  style={{ width: `${percent}%` }}
                  aria-hidden="true"
                />
              </div>

              {card.state === 'done' ? (
                <span className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--poker-success)]">
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('theory.paths.done')}
                </span>
              ) : card.state === 'open' && card.nextChapterId ? (
                <Link
                  to={`/theory/chapter/${card.nextChapterId}`}
                  className={cn(
                    'inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:underline',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded-md'
                  )}
                >
                  {card.done === 0 ? t('theory.paths.start') : t('theory.paths.continue')}
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </Link>
              ) : (
                <span className="inline-flex min-h-11 items-center gap-1.5 text-xs text-[var(--ivory-dim)]">
                  <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                  {t('theory.paths.locked')}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </motion.section>
  );
}
