import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import type { TheoryLevelSummary } from '../types';
import { getSupplementalChaptersOfLevel } from '../utils/theoryMeta';
import { loadTheoryLevelById } from '../data/levels/loaders';

interface TheorySupplementalCardProps {
  levels: TheoryLevelSummary[];
  completedChapters: string[];
  isUnlocked: (levelId: string) => boolean;
}

/**
 * 6-max 补强卡（仅标准变体）：增补章不计入核心进度，故单独统计 done/total。
 *
 * 三态 CTA：仍有「未完成且已解锁」的增补章 → 可点链接直达；候选全部锁定 → 锁定提示；
 * 全部读完 → 完成态。增补章完成与否不影响任何 Level 解锁（判定见 theoryMeta）。
 */
export function TheorySupplementalCard({
  levels,
  completedChapters,
  isUnlocked,
}: TheorySupplementalCardProps) {
  const { t } = useTranslation();

  // 按 Level 展开成有序候选（标准变体只有 7 章增补，扁平化成本可忽略）
  const candidates = levels.flatMap((level) =>
    getSupplementalChaptersOfLevel(level).map((chapter) => ({ chapter, levelId: level.id })),
  );
  if (candidates.length === 0) return null;

  const total = candidates.length;
  const done = candidates.filter((item) => completedChapters.includes(item.chapter.id)).length;
  const next = candidates.find(
    (item) => !completedChapters.includes(item.chapter.id) && isUnlocked(item.levelId),
  );
  const allDone = done === total;
  const percent = Math.round((done / total) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.11 }}
      aria-label={t('theory.supplemental.title')}
      onPointerEnter={() => next && void loadTheoryLevelById(next.levelId)}
      onFocus={() => next && void loadTheoryLevelById(next.levelId)}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('theory.supplemental.title')}
      </h2>
      <div className="panel space-y-2.5">
        <div className="flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-md bg-[var(--walnut-raised)] flex items-center justify-center text-[var(--brass-bright)] shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <p className="flex-1 text-xs text-[var(--ivory-muted)] leading-relaxed">
            {t('theory.supplemental.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--ivory-dim)] font-numeric shrink-0">
            {t('theory.supplemental.progress', { done, total })}
          </span>
          <div className="h-1 flex-1 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--brass-bright)] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {allDone ? (
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--poker-success)]">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            {t('theory.supplemental.allDone')}
          </p>
        ) : next ? (
          <Link
            to={`/theory/chapter/${next.chapter.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] hover:gap-2.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 rounded-sm"
          >
            {t('theory.supplemental.cta')}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </Link>
        ) : (
          <p className="inline-flex items-center gap-1.5 text-xs text-[var(--ivory-dim)]">
            <Lock className="w-3.5 h-3.5" aria-hidden="true" />
            {t('theory.supplemental.lockedHint')}
          </p>
        )}
      </div>
    </motion.section>
  );
}
