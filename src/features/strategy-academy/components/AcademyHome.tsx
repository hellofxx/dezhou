import { useMemo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Zap, Route, GraduationCap, Network, Search, BookOpen, Bookmark, Library, Compass, ClipboardCheck, ChevronRight } from 'lucide-react';
import { transitionSlow, transitionStandard } from '@/shared/utils/motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import {
  getLevelSummariesByVariant,
  getTotalLessonCount,
  getVariantLessonSummaries,
} from '../utils/academyMeta';
import { AcademyResume } from './AcademyResume';
import { LevelLadder, findActiveLevelId } from './LevelLadder';
import { DailyPlanCard } from './DailyPlanCard';
import { StrategyMasteryCard } from './StrategyMasteryCard';
import { TheoryBridgeCard } from './TheoryBridgeCard';
import { getLessonMeta } from '../data/lessonMeta';
import { VariantToggle } from '@/shared/components/VariantToggle';

export default function AcademyHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { progress, getTotalProgress, basicsProgress } = useAcademy();
  const isLevelEntryUnlocked = useAcademyStore((s) => s.isLevelEntryUnlocked);
  const isCertified = useAcademyStore((s) => s.isCertified);
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const switchVariant = useAcademyStore((s) => s.switchVariant);

  const totalProgress = getTotalProgress();
  const totalLessons = getTotalLessonCount();
  const completedCount = progress.completedLessons.length;

  // 零状态（渐进披露 §13.6）：无任何课程进度且未完成基础入门 → 首屏只走「从第一课开始」单一路径
  const isZeroState = totalProgress === 0 && !basicsProgress.completed;

  // ACAD-05：阶梯按当前变体渲染（manifest 已按变体分组；L1/L2 复用共享基础层）
  const ladderLevels = getLevelSummariesByVariant(activeVariant);
  // 变体阶梯按自身 Level 序列判断前置（l3 → l4b → l5 ...），标准 L1/L2 仍回退标准序列
  const isLadderEntryUnlocked = (levelId: string) =>
    isLevelEntryUnlocked(levelId, activeVariant);

  const activeLevelId = findActiveLevelId(
    ladderLevels,
    progress.completedLessons,
    isLadderEntryUnlocked,
  );
  const activeLevel = ladderLevels.find((l) => (l.id ?? String(l.level)) === activeLevelId) ?? null;
  const completedLevels = ladderLevels.filter((level) =>
    level.lessons.every((lesson) => progress.completedLessons.includes(lesson.id))
  );
  // 检查点入口（仅标准变体）：优先最近完成的一级（随时可自查），否则指向当前学习中的一级（页面给锁定进度）
  const checkpointLevel = activeVariant === 'standard'
    ? completedLevels.at(-1) ?? activeLevel ?? null
    : null;
  const theoryAnchors = useMemo(() => {
    if (!activeLevel) return [];
    const anchors = activeLevel.lessons.flatMap(
      (lesson) => getLessonMeta(lesson.id).theoryAnchors,
    );
    return [...new Set(anchors)].slice(0, 3);
  }, [activeLevel]);

  const levelsDoneCount = completedLevels.length;
  const certifiedCount = ladderLevels.reduce(
    (n, level) => (isCertified(level.level) ? n + 1 : n),
    0
  );

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        {/* Zone A：零状态 → 单一入口路径卡；有进度 → 继续学习 Hero（含进度环与量化统计） */}
        {isZeroState ? (
          <ZeroStateCard />
        ) : (
          <AcademyResume
            activeLevel={activeLevel}
            completedLessons={progress.completedLessons}
            totalProgress={totalProgress}
            completedCount={completedCount}
            totalLessons={totalLessons}
            levelsDoneCount={levelsDoneCount}
            certifiedCount={certifiedCount}
            basicsCompleted={basicsProgress.completed}
          />
        )}

        {/* 变体切换：统一面板，副标题随所选变体实时联动 */}
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
                {activeVariant !== 'standard' && (
                  <span className="text-[var(--ivory-dim)]">
                    {' '}
                    · {getVariantLessonSummaries(activeVariant).length} {t('academy.lessons')} ·{' '}
                    {t('academy.variantSkeleton')}
                  </span>
                )}
              </p>
            </div>
            <VariantToggle active={activeVariant} onSelect={switchVariant} />
          </div>
        </motion.div>

        {/* Zone B + C：课程阶梯（主列，自适应扩充）＋ 侧栏（今日计划/工具，固定带宽演出奏节奏） */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionStandard, delay: 0.1 }}
            className="min-w-0"
          >
            <LevelLadder
              levels={ladderLevels}
              completedLessons={progress.completedLessons}
              isUnlocked={isLadderEntryUnlocked}
              startLevelId={isZeroState ? ladderLevels[0]?.id : undefined}
            />
          </motion.div>

          <aside className="space-y-4 lg:sticky lg:top-2">
            <DailyPlanCard />
            <StrategyMasteryCard />
            <TheoryBridgeCard anchors={theoryAnchors} onNavigate={(route) => navigate(route)} />
            {/* 检查点与认证同口径：只对标准变体开放（变体评测本批 de-scope） */}
            <LevelCheckpointCard
              level={checkpointLevel?.level ?? null}
              levelDone={!!checkpointLevel && completedLevels.includes(checkpointLevel)}
            />
            <ToolsGrid basicsCompleted={basicsProgress.completed} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * 零状态首屏：单一「从第一课开始」路径卡。
 * 复用 AcademyResume 的 hero 视觉（panel + brass-rail + academy-hero）与黄铜渐变 CTA，
 * 但不渲染 0% 进度环 / 0 课时 / 0 级认证等零值指标，避免新用户首屏出现一片零值统计。
 */
function ZeroStateCard() {
  const { t } = useTranslation();

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionSlow}
      className="panel brass-rail academy-hero"
      aria-label={t('academy.zeroState.title')}
    >
      <p className="section-eyebrow mb-2">{t('academy.zeroState.eyebrow')}</p>

      <p className="font-display text-[17px] text-[var(--ivory)] leading-snug">
        {t('academy.zeroState.title')}
      </p>

      <p className="text-xs text-[var(--ivory-dim)] mt-1 max-w-xl leading-relaxed">
        {t('academy.zeroState.description')}
      </p>

      <Link
        to="/academy/basics"
        className="hover-bright mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold [background:var(--brass-fill-gradient)] text-[var(--brass-fill-ink)] border border-[var(--brass-fill-border)] shadow-[var(--shadow-brass-btn)] transition-all"
      >
        <GraduationCap className="w-4 h-4" />
        {t('academy.zeroState.cta')}
      </Link>
    </motion.section>
  );
}

/** 学习工具 2×2 入口格：速训 / 轨道 / 基础入门 / 知识图谱 */
function ToolsGrid({ basicsCompleted }: { basicsCompleted: boolean }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tools = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: t('academy.tools.quickDrill'),
      desc: t('academy.tools.quickDrillDesc'),
      to: '/academy/quick-drill',
      accent: 'var(--brass)',
    },
    {
      icon: <Route className="w-4 h-4" />,
      title: t('academy.tools.tracks'),
      desc: t('academy.tools.tracksDesc'),
      to: '/academy/tracks',
      accent: 'var(--brass)',
    },
    {
      icon: <GraduationCap className="w-4 h-4" />,
      title: t('academy.tools.basics'),
      desc: basicsCompleted ? t('academy.completed') : t('academy.tools.basicsDesc'),
      to: '/academy/basics',
      accent: 'var(--poker-success)',
    },
    {
      icon: <Network className="w-4 h-4" />,
      title: t('academy.tools.graph'),
      desc: t('academy.tools.graphDesc'),
      to: '/academy/concept-graph',
      accent: 'var(--poker-info)',
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: t('academy.tools.search'),
      desc: t('academy.tools.searchDesc'),
      to: '/academy/search',
      accent: 'var(--brass)',
    },
    {
      icon: <BookOpen className="w-4 h-4" />,
      title: t('academy.tools.glossary'),
      desc: t('academy.tools.glossaryDesc'),
      to: '/theory/glossary',
      accent: 'var(--poker-info)',
    },
    {
      icon: <Compass className="w-4 h-4" />,
      title: t('academy.tools.placement'),
      desc: t('academy.tools.placementDesc'),
      to: '/academy/placement',
      accent: 'var(--brass)',
    },
    {
      icon: <Bookmark className="w-4 h-4" />,
      title: t('academy.tools.bookmarks'),
      desc: t('academy.tools.bookmarksDesc'),
      to: '/academy/bookmarks',
      accent: 'var(--brass-bright)',
    },
    {
      icon: <Library className="w-4 h-4" />,
      title: t('academy.tools.bibliography'),
      desc: t('academy.tools.bibliographyDesc'),
      to: '/academy/bibliography',
      accent: 'var(--poker-info)',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.12 }}
      aria-label={t('academy.tools.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('academy.tools.title')}
      </h2>
      <div className="grid grid-cols-2 gap-2.5">
        {tools.map((tool) => (
          <button
            key={tool.title}
            type="button"
            onClick={() => navigate(tool.to)}
            className="academy-tool-tile"
            style={{ '--tool-accent': tool.accent } as CSSProperties}
          >
            <span className="academy-tool-icon" aria-hidden="true">
              {tool.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-[var(--ivory)] truncate">
                {tool.title}
              </span>
              <span className="block text-[10px] text-[var(--ivory-muted)] truncate">
                {tool.desc}
              </span>
            </span>
            <ChevronRight className="w-3 h-3 text-[var(--ivory-muted)] shrink-0 ml-auto" />
          </button>
        ))}
      </div>
    </motion.section>
  );
}


/**
 * 级别检查点入口（形成性自查）：仅展示与导航，不发证、不解锁、不写任何状态。
 * 本级核心课未全部完成时保留入口但换成锁定提示（实际门禁在 LevelCheckpointPage）。
 */
function LevelCheckpointCard({ level, levelDone }: { level: number | null; levelDone: boolean }) {
  const { t } = useTranslation();

  if (level === null) return null;

  return (
    <section aria-label={t('academy.checkpointHome.title')}>
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold mb-2.5 px-1">
        {t('academy.checkpointHome.title')}
      </h2>
      <Link
        to={`/academy/checkpoint/${level}`}
        className="academy-tool-tile w-full"
        style={{ '--tool-accent': 'var(--poker-info)' } as CSSProperties}
      >
        <span className="academy-tool-icon" aria-hidden="true">
          <ClipboardCheck className="w-4 h-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-[var(--ivory)] truncate">
            {t('academy.checkpointHome.entry', { level })}
          </span>
          <span className="block text-[10px] text-[var(--ivory-muted)] truncate">
            {levelDone ? t('academy.checkpointHome.desc') : t('academy.checkpointHome.lockedDesc')}
          </span>
        </span>
        <ChevronRight className="w-3 h-3 text-[var(--ivory-muted)] shrink-0 ml-auto" />
      </Link>
    </section>
  );
}

