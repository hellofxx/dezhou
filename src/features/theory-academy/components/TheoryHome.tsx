import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ChevronRight, Flag, Flame, GraduationCap, Target } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import { useTranslation } from 'react-i18next';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import {
  getCoreChaptersOfLevel,
  getCoreChapterCount,
  getLevelSummariesByVariant,
} from '../utils/theoryMeta';
import { getTheoryChapterRecommendation } from '../data/theoryRecommendations';
import type { PokerVariant } from '@/shared/types/elo';
import { VariantToggle } from '@/shared/components/poker/VariantToggle';
import { TheoryResume } from './TheoryResume';
import { TheoryLadder, findActiveTheoryLevelId } from './TheoryLadder';
import { TheorySupplementalCard } from './TheorySupplementalCard';
import { TheoryMasteryCard } from './TheoryMasteryCard';
import { TheoryLearningPaths } from './TheoryLearningPaths';
import { TheoryPlacementCard } from './TheoryPlacementCard';
import { TheoryRecommendationCard } from './TheoryRecommendationCard';
import { TheoryBookmarksPanel } from './TheoryBookmarksPanel';
import { TheoryStudyTools } from './TheoryStudyTools';

export default function TheoryHome() {
  const { t } = useTranslation();
  // THY-10：改用选择器订阅，避免整 store 订阅导致无关状态变化触发重渲染
  const progress = useTheoryStore((s) => s.progress);
  const getTotalProgress = useTheoryStore((s) => s.getTotalProgress);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const activeVariant = useTheoryStore((s) => s.progress.activeVariant);
  const switchVariant = useTheoryStore((s) => s.switchVariant);
  const toggleBookmark = useTheoryStore((s) => s.toggleBookmark);
  // 五维 ELO 只读快照：反向桥接（ELO → 推荐章节）的唯一输入（progress 为设计内中枢引用）
  const standardElo = useProgressStore((s) => s.eloByVariant.standard);

  const levels = getLevelSummariesByVariant(activeVariant);
  const totalProgress = getTotalProgress();
  // 核心章计数：增补章（6-max 补强）不计入任何主统计，单独由补强卡呈现
  const totalChapters = getCoreChapterCount(activeVariant);
  const coreChapters = levels.flatMap((l) => getCoreChaptersOfLevel(l));
  const coreChapterIds = new Set(coreChapters.map((c) => c.id));

  // 当前变体序列内已读核心章（跨变体独立统计）
  const completedCount = progress.completedChapters.filter((id) => coreChapterIds.has(id)).length;

  const activeLevelId = findActiveTheoryLevelId(levels, progress.completedChapters, isTheoryLevelUnlocked);
  const activeLevel = levels.find((l) => l.id === activeLevelId) ?? null;

  const levelsDoneCount = levels.filter((l) => {
    const core = getCoreChaptersOfLevel(l);
    return core.length > 0 && core.every((c) => progress.completedChapters.includes(c.id));
  }).length;

  // 平均首次成绩：当前变体已读核心章的首次正式小测均值（练习最佳不参与；增补章不参与）
  const scored = levels
    .flatMap((l) => getCoreChaptersOfLevel(l))
    .filter((c) => progress.completedChapters.includes(c.id))
    .map((c) => progress.chapterAttempts?.[c.id]?.firstScore ?? progress.quizScores[c.id])
    .filter((score): score is number => typeof score === 'number');
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, b) => a + b, 0) / scored.length) : 0;

  const bookmarks = progress.bookmarkedChapters ?? [];
  // 反向桥接只服务标准变体（推荐池是 6-max 理论主线；变体各有独立进度口径）
  const recommendation =
    activeVariant === 'standard'
      ? getTheoryChapterRecommendation({
          elo: standardElo,
          completedChapters: progress.completedChapters,
          creditLevels: progress.placement?.creditLevels ?? [],
          legacyUnlockedLevels: progress.legacyUnlockedLevels ?? [],
          variant: 'standard',
        })
      : null;

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

        {/* Zone A2：检索入口 + 收藏书签条（同为阅读辅助，不参与解锁） */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.04 }}
          className="space-y-3"
        >
          <TheoryStudyTools />
          {bookmarks.length > 0 && (
            <TheoryBookmarksPanel variant="strip" bookmarks={bookmarks} />
          )}
        </motion.div>

        {/* Zone B：变体切换统一面板 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.05 }}
          className="panel variant-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold">
                {t('variant.selectVariant')}
              </h2>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">
                {t(`variant.name.${activeVariant}`)}
                {activeVariant === 'short-deck' && (
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

        {/* Zone C + D：理论阶梯（主列）＋ 侧栏（统计/补强/桥接） */}
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
              creditLevels={progress.placement?.creditLevels ?? []}
              bookmarkedChapters={bookmarks}
              checkpoints={progress.checkpoints ?? {}}
              onToggleBookmark={toggleBookmark}
            />
          </motion.div>

          <aside className="space-y-4 lg:sticky lg:top-2">
            {completedCount === 0 && <BasicsPrerequisiteCard />}
            <ReadingStats
              completedCount={completedCount}
              totalChapters={totalChapters}
              levelsDoneCount={levelsDoneCount}
              avgScore={avgScore}
              flaggedCount={progress.flaggedQuestions.length}
              activeVariant={activeVariant}
            />
            <TheoryMasteryCard
              chapters={coreChapters}
              quizScores={progress.quizScores}
              chapterAttempts={progress.chapterAttempts}
              completedChapters={progress.completedChapters}
              levels={levels}
              checkpoints={progress.checkpoints}
            />
            {activeVariant === 'standard' && (
              <>
                <TheoryRecommendationCard recommendation={recommendation} />
                <TheoryPlacementCard placement={progress.placement} />
              </>
            )}
            {activeVariant === 'standard' && (
              <TheorySupplementalCard
                levels={levels}
                completedChapters={progress.completedChapters}
                isUnlocked={isTheoryLevelUnlocked}
              />
            )}
            <PracticeBridge />
          </aside>
        </div>

        {/* Zone E：主题学习路径（标准变体专有，展示层不新增门禁） */}
        <TheoryLearningPaths />
      </div>
    </div>
  );
}

/** 阅读统计面板：平均小测分 / 已读章节 / 完成级别 / 疑难标记（口径 = 核心章） */
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
  const levels = getLevelSummariesByVariant(activeVariant);

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
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
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
        <Link
          to="/theory/review"
          aria-label={t('theory.stats.flaggedEntryAria', { count: flaggedCount })}
          className="group flex items-center gap-3 pt-2 mt-0.5 border-t border-[var(--walnut-border)]/60 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60 hover:bg-[var(--felt-raised)]/40 transition-colors"
        >
          <span className="w-7 h-7 rounded-md bg-[var(--poker-terra)]/15 flex items-center justify-center text-[var(--poker-terra-bright)] shrink-0">
            <Flag className={cn('w-3.5 h-3.5', flaggedCount === 0 && 'opacity-50')} />
          </span>
          <span className="flex-1 text-xs text-[var(--ivory-muted)] group-hover:text-[var(--ivory)] transition-colors">
            {t('theory.stats.flaggedLabel')}
          </span>
          <span className="font-numeric text-sm text-[var(--ivory)]">
            {flaggedCount > 0 ? flaggedCount : t('theory.stats.flaggedNone')}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-[var(--ivory-dim)] group-hover:text-[var(--brass-bright)] transition-colors shrink-0" />
        </Link>
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
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
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

/**
 * 先修引导：T1 直接从组合计数开场，规则/牌型/位置/术语在策略学院入门向导（/academy/basics）。
 * 跨模块禁止 import，故只以路由字符串对接，且其完成态对本模块不可读。
 */
function BasicsPrerequisiteCard() {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.1 }}
      aria-label={t('theory.basicsGuide.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('theory.basicsGuide.title')}
      </h2>
      <Link
        to="/academy/basics"
        className="block rounded-lg border border-[var(--walnut-border)] bg-gradient-to-b from-[var(--walnut)] to-[var(--felt-deep)] p-3.5 hover:border-[var(--brass)]/50 transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
      >
        <span className="flex items-start gap-2.5">
          <GraduationCap className="w-4 h-4 text-[var(--brass-bright)] shrink-0 mt-0.5" />
          <span className="flex-1 text-xs text-[var(--ivory)] leading-relaxed">{t('theory.basicsGuide.body')}</span>
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--brass-bright)] group-hover:gap-2.5 transition-all">
          {t('theory.basicsGuide.cta')}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
    </motion.section>
  );
}
