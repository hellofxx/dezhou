import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, Flame, Target } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { useTheoryStore } from '../store';
import { getTotalChapterCount } from '../utils/theoryProgress';
import { getTheoryLevelsByVariant } from '../data/levels/variants';
import type { PokerVariant } from '@/shared/types/elo';
import { VariantToggle } from '@/shared/components/VariantToggle';
import { TheoryResume } from './TheoryResume';
import { TheoryLadder, findActiveTheoryLevelId } from './TheoryLadder';

export default function TheoryHome() {
  const { t } = useTranslation();
  // THY-10：改用选择器订阅，避免整 store 订阅导致无关状态变化触发重渲染
  const progress = useTheoryStore((s) => s.progress);
  const getTotalProgress = useTheoryStore((s) => s.getTotalProgress);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const activeVariant = useTheoryStore((s) => s.progress.activeVariant);
  const switchVariant = useTheoryStore((s) => s.switchVariant);

  const levels = getTheoryLevelsByVariant(activeVariant);
  const totalProgress = getTotalProgress();
  const totalChapters = getTotalChapterCount(activeVariant);

  // 当前变体序列内已读章节（跨变体独立统计）
  const variantChapterIds = new Set(levels.flatMap((l) => l.chapters.map((c) => c.id)));
  const completedCount = progress.completedChapters.filter((id) => variantChapterIds.has(id)).length;

  const activeLevelId = findActiveTheoryLevelId(levels, progress.completedChapters, isTheoryLevelUnlocked);
  const activeLevel = levels.find((l) => l.id === activeLevelId) ?? null;

  const levelsDoneCount = levels.filter(
    (l) => l.chapters.length > 0 && l.chapters.every((c) => progress.completedChapters.includes(c.id))
  ).length;

  // 平均小测分：当前变体已读章节的小测分均值（取整）
  const scored = levels
    .flatMap((l) => l.chapters)
    .filter((c) => progress.completedChapters.includes(c.id) && typeof progress.quizScores[c.id] === 'number')
    .map((c) => progress.quizScores[c.id] as number);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        {/* Zone A：继续学习 Hero */}
        <TheoryResume
          activeLevel={activeLevel}
          completedChapters={progress.completedChapters}
          totalProgress={totalProgress}
          completedCount={completedCount}
          totalChapters={totalChapters}
          levelsDoneCount={levelsDoneCount}
          avgScore={avgScore}
        />

        {/* Zone B：变体切换统一面板 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.05 }}
          className="panel variant-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
                {t('variant.selectVariant')}
              </h2>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">
                {t(`variant.name.${activeVariant}`)}
                {activeVariant !== 'standard' && (
                  <span className="text-[var(--ivory-dim)]">
                    {' '}
                    · {totalChapters} {t('theory.chapters')} · {t('theory.variantSkeleton')}
                  </span>
                )}
              </p>
            </div>
            <VariantToggle active={activeVariant} onSelect={switchVariant} />
          </div>
        </motion.div>

        {/* Zone C + D：理论阶梯（主列）＋ 侧栏（统计/桥接） */}
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionStandard, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <TheoryLadder
              levels={levels}
              completedChapters={progress.completedChapters}
              quizScores={progress.quizScores}
              isUnlocked={isTheoryLevelUnlocked}
            />
          </motion.div>

          <aside className="space-y-4 lg:sticky lg:top-2">
            <ReadingStats
              completedCount={completedCount}
              totalChapters={totalChapters}
              levelsDoneCount={levelsDoneCount}
              avgScore={avgScore}
              flaggedCount={progress.flaggedQuestions.length}
              activeVariant={activeVariant}
            />
            <PracticeBridge />
          </aside>
        </div>
      </div>
    </div>
  );
}

/** 阅读统计面板：平均小测分 / 已读章节 / 完成级别 / 疑难标记 */
function ReadingStats({
  completedCount,
  totalChapters,
  levelsDoneCount,
  avgScore,
  flaggedCount,
  activeVariant,
}: {
  completedCount: number;
  totalChapters: number;
  levelsDoneCount: number;
  avgScore: number;
  flaggedCount: number;
  activeVariant: PokerVariant;
}) {
  const { t } = useTranslation();
  const levels = getTheoryLevelsByVariant(activeVariant);

  const stats = [
    { icon: <BookOpenCheck className="w-3.5 h-3.5" />, label: t('theory.stats.avgScoreLabel'), value: t('theory.stats.avgScoreValue', { score: avgScore }) },
    { icon: <Target className="w-3.5 h-3.5" />, label: t('theory.stats.chaptersReadLabel'), value: `${completedCount}/${totalChapters}` },
    { icon: <Flame className="w-3.5 h-3.5" />, label: t('theory.stats.levelsCompletedLabel'), value: `${levelsDoneCount}/${levels.length}` },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.12 }}
      aria-label={t('theory.stats.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold mb-2.5 px-1">
        {t('theory.stats.title')}
      </h2>
      <div className="panel space-y-2.5">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-md bg-[var(--walnut-raised)] flex items-center justify-center text-[var(--brass-bright)] shrink-0">
              {s.icon}
            </span>
            <span className="flex-1 text-xs text-[var(--ivory-muted)]">{s.label}</span>
            <span className="font-numeric text-sm text-[var(--ivory)]">{s.value}</span>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2 border-t border-[var(--walnut-border)]/60">
          <span className="w-7 h-7 rounded-md bg-[var(--poker-terra)]/15 flex items-center justify-center text-[var(--poker-terra-bright)] shrink-0">
            {flaggedCount > 0 ? <Target className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5 opacity-50" />}
          </span>
          <span className="flex-1 text-xs text-[var(--ivory-muted)]">{t('theory.stats.flaggedLabel')}</span>
          <span className="font-numeric text-sm text-[var(--ivory)]">
            {flaggedCount > 0 ? flaggedCount : t('theory.stats.flaggedNone')}
          </span>
        </div>
      </div>
    </motion.section>
  );
}

/** 理论→实践桥接：完成阅读后前往策略学院实战 */
function PracticeBridge() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.14 }}
      aria-label={t('theory.bridge.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold mb-2.5 px-1">
        {t('theory.bridge.title')}
      </h2>
      <button
        type="button"
        onClick={() => navigate('/academy')}
        className="w-full text-left rounded-lg border border-[var(--walnut-border)] bg-gradient-to-b from-[var(--walnut)] to-[var(--felt-deep)] p-3.5 hover:border-[var(--brass)]/50 transition-colors group"
      >
        <p className="text-xs text-[var(--ivory)] leading-relaxed">{t('theory.bridge.subtitle')}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] group-hover:gap-2.5 transition-all">
          {t('theory.bridge.cta')}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </button>
    </motion.section>
  );
}
