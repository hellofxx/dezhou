import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpenCheck, ChevronDown, ChevronRight, Flag, Flame, GraduationCap, Target } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { BackLink } from '@/shared/components/layout/BackLink';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { theoryMapFrom } from '@/shared/utils/courseBack';
import { useTranslation } from 'react-i18next';
import { useProgressState } from '@/features/progress/api';
import { useTheoryStore } from '../store';
import {
  getCoreChaptersOfLevel,
  getCoreChapterCount,
  getLevelSummariesByVariant,
} from '../utils/theoryMeta';
import { getTheoryChapterRecommendation } from '../data/theoryRecommendations';
import type { PokerVariant } from '@/shared/types/elo';
import { TheoryLadder } from './TheoryLadder';
import { TheorySupplementalCard } from './TheorySupplementalCard';
import { TheoryLearningPaths } from './TheoryLearningPaths';
import { TheoryAssessmentCard } from './TheoryAssessmentCard';
import { TheoryRecommendationCard } from './TheoryRecommendationCard';
import { TheoryBookmarksPanel } from './TheoryBookmarksPanel';
import { TheoryStudyTools } from './TheoryStudyTools';

export default function TheoryHome() {
  const { t } = useTranslation();
  // THY-10：改用选择器订阅，避免整 store 订阅导致无关状态变化触发重渲染
  const progress = useTheoryStore((s) => s.progress);
  const isTheoryLevelUnlocked = useTheoryStore((s) => s.isTheoryLevelUnlocked);
  const activeVariant = useTheoryStore((s) => s.progress.activeVariant);
  const toggleBookmark = useTheoryStore((s) => s.toggleBookmark);
  // 五维 ELO 只读快照：反向桥接（ELO → 推荐章节）的唯一输入（progress 为设计内中枢引用）
  const standardElo = useProgressState((s) => s.eloByVariant.standard);

  const levels = getLevelSummariesByVariant(activeVariant);
  // 核心章计数：增补章（6-max 补强）不计入任何主统计，单独由补强卡呈现
  const totalChapters = getCoreChapterCount(activeVariant);
  const coreChapters = levels.flatMap((l) => getCoreChaptersOfLevel(l));
  const coreChapterIds = new Set(coreChapters.map((c) => c.id));

  // 当前变体序列内已读核心章（跨变体独立统计）
  const completedCount = progress.completedChapters.filter((id) => coreChapterIds.has(id)).length;

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

  // 进行中的 Level：序列内第一个「已解锁且有未完成核心章」的 Level；全部读完时退化为首级
  const activeLevel =
    levels.find((level) => {
      const core = getCoreChaptersOfLevel(level);
      if (core.length === 0 || !isTheoryLevelUnlocked(level.id)) return false;
      return core.some((chapter) => !progress.completedChapters.includes(chapter.id));
    }) ??
    levels[0] ??
    null;

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
        {/* 地图根返回：理论地图 → 课程枢纽 */}
        <BackLink to="/lesson" label={t('nav.backToCourseHub')} variant="pill" />

        {/* Zone A：检索入口 + 收藏书签条（同为阅读辅助，不参与解锁） */}
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

        {/* Zone B：变体只读展示（切换唯一入口在课程主线 /lesson） */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.05 }}
          className="panel variant-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0">
              <SectionLabel as="h2">{t('variant.title')}</SectionLabel>
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
            <Link
              to="/lesson"
              className={`inline-flex min-h-11 shrink-0 items-center justify-center rounded-md border border-[var(--walnut-border)] px-3 text-xs font-semibold text-[var(--brass-bright)] transition-colors hover:border-[var(--brass)]/50 ${FOCUS_RING}`}
            >
              {t('variant.switchInCourseHub')}
            </Link>
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
            {activeVariant === 'standard' && (
              <>
                <TheoryRecommendationCard recommendation={recommendation} />
                <TheoryAssessmentCard levelId={activeLevel?.id ?? null} />
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
      {/* 统计默认折叠；有疑难标记时自动展开，保住 SRS 复习入口的可见性 */}
      <details open={flaggedCount > 0} className="group">
        <summary
          className={cn(
            'mb-2.5 flex min-h-11 cursor-pointer list-none items-center gap-1 px-1',
            '[&::-webkit-details-marker]:hidden',
            FOCUS_RING,
          )}
        >
          <ChevronDown
            className="w-3.5 h-3.5 text-[var(--ivory-muted)] transition-transform group-open:rotate-180"
            aria-hidden="true"
          />
          <SectionLabel as="h2">{t('theory.stats.title')}</SectionLabel>
        </summary>
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
            className={`group/flagged flex items-center gap-3 pt-2 mt-0.5 border-t border-[var(--walnut-border)]/60 rounded-md hover:bg-[var(--felt-raised)]/40 transition-colors ${FOCUS_RING}`}
          >
            <span className="w-7 h-7 rounded-md bg-[var(--poker-terra)]/15 flex items-center justify-center text-[var(--poker-terra-bright)] shrink-0">
              <Flag className={cn('w-3.5 h-3.5', flaggedCount === 0 && 'opacity-50')} />
            </span>
            <span className="flex-1 text-xs text-[var(--ivory-muted)] group-hover/flagged:text-[var(--ivory)] transition-colors">
              {t('theory.stats.flaggedLabel')}
            </span>
            <span className="font-numeric text-sm text-[var(--ivory)]">
              {flaggedCount > 0 ? flaggedCount : t('theory.stats.flaggedNone')}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-[var(--ivory-dim)] group-hover/flagged:text-[var(--brass-bright)] transition-colors shrink-0" />
          </Link>
        </div>
      </details>
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
      <SectionLabel as="h2" className="mb-2.5 px-1">
        {t('theory.bridge.title')}
      </SectionLabel>
      <button
        type="button"
        onClick={() => navigate('/academy', { state: theoryMapFrom() })}
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
      <SectionLabel as="h2" className="mb-2.5 px-1">
        {t('theory.basicsGuide.title')}
      </SectionLabel>
      <Link
        to="/academy/basics"
        className={`block rounded-lg border border-[var(--walnut-border)] bg-gradient-to-b from-[var(--walnut)] to-[var(--felt-deep)] p-3.5 hover:border-[var(--brass)]/50 transition-colors group ${FOCUS_RING}`}
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
