import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useTheory } from '../hooks/useTheory';
import { useTheoryStore } from '../store';
import { getTotalChapterCount } from '../utils/theoryProgress';
import { TheoryLevelCard } from './TheoryLevelCard';
import { TheoryLearningMap } from './TheoryLearningMap';
import { getTheoryLevelsByVariant } from '../data/levels/variants';
import { VariantToggle } from '@/shared/components/VariantToggle';
import type { TheoryTier } from '../types';

const TIER_ORDER: TheoryTier[] = ['basic', 'intermediate', 'advanced'];

export default function TheoryHome() {
  const { t } = useTranslation();
  const { progress, getLevelProgress, getTotalProgress } = useTheory();
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const activeVariant = useTheoryStore((s) => s.progress.activeVariant);
  const switchVariant = useTheoryStore((s) => s.switchVariant);

  // P2 变体支持：按当前变体过滤 Level 列表（standard 为主课程体系）
  const levels = getTheoryLevelsByVariant(activeVariant);

  const totalProgress = getTotalProgress();
  const totalChapters = getTotalChapterCount();
  const completedCount = progress.completedChapters.length;

  const tierLabel: Record<TheoryTier, string> = {
    basic: t('theory.tierBasic'),
    intermediate: t('theory.tierIntermediate'),
    advanced: t('theory.tierAdvanced'),
  };

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="panel"
        >
          <div className="flex items-center gap-6">
            <div className="flex-1">
              {/* 顶栏 H1 已显示页名，内容区不重复大标题；eyebrow 携带与策略学院的定位区分 */}
              <p className="section-eyebrow mb-2">Theory Academy · {t('theory.positioning')}</p>
              <p className="text-sm text-[var(--ivory-dim)] max-w-sm">
                {t('theory.subtitle')}
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-2">
              <ProgressRing value={totalProgress} />
              <p className="text-xs text-[var(--ivory-muted)] font-numeric">
                {completedCount}/{totalChapters} {t('theory.chapters')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* 学习路径地图：全局方向感 + 目标梯度效应（仅标准变体展示，变体课程体系尚在填充中） */}
        {activeVariant === 'standard' && <TheoryLearningMap />}

        {/* P2 变体切换器 */}
        <div className="flex items-center justify-between gap-4 px-1">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
            {t('variant.select_variant')}
          </h2>
          <VariantToggle active={activeVariant} onSelect={switchVariant} />
        </div>

        {/* Tiered level list */}
        {TIER_ORDER.map((tier) => {
          const tierLevels = levels.filter((l) => l.tier === tier);
          if (tierLevels.length === 0) return null;
          return (
            <section key={tier} className="space-y-3">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold px-1">
                {tierLabel[tier]}
              </h2>
              {tierLevels.map((level, index) => (
                <TheoryLevelCard
                  key={level.id}
                  level={level}
                  unlocked={isTheoryLevelUnlocked(level.id)}
                  progress={getLevelProgress(level.id)}
                  completedChapters={progress.completedChapters}
                  quizScores={progress.quizScores}
                  index={index}
                />
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative w-[76px] h-[76px]" role="img" aria-label={`总进度 ${value}%`}>
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r={radius} fill="none" stroke="var(--walnut-raised)" strokeWidth="6" />
        <circle
          cx="38"
          cy="38"
          r={radius}
          fill="none"
          stroke="var(--brass-bright)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-numeric text-sm text-[var(--ivory)]">
        {value}%
      </span>
    </div>
  );
}
