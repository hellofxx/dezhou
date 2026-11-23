import { useEffect, useMemo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Zap, Route, GraduationCap, Network, Search, BookOpen, Bookmark, Library, ChevronDown, ChevronRight } from 'lucide-react';
import { transitionSlow, transitionStandard } from '@/shared/utils/motion';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { BackLink } from '@/shared/components/layout/BackLink';
import { academyMapFrom } from '@/shared/utils/courseBack';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import {
  getLevelSummariesByVariant,
  getVariantLessonSummaries,
} from '../utils/academyMeta';
import { LevelLadder, findActiveLevelId } from './LevelLadder';
import AcademyAssessmentCard from './AcademyAssessmentCard';
import { TheoryBridgeCard } from './TheoryBridgeCard';
import { getLessonMeta } from '../data/lessonMeta';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

export default function AcademyHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { progress, getTotalProgress, basicsProgress } = useAcademy();
  const isLevelEntryUnlocked = useAcademyStore((s) => s.isLevelEntryUnlocked);
  const activeVariant = useAcademyStore((s) => s.activeVariant);

  const totalProgress = getTotalProgress();

  // 闭环步骤③（枢纽阶段卡）跳入：仅当 hash 精确为评估区时滚动定位
  useEffect(() => {
    if (location.hash !== '#assessment') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => {
      document.getElementById('assessment')?.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }, 50);
    return () => clearTimeout(timer);
  }, [location.hash]);

  // 零状态（渐进披露 §13.6）：无任何课程进度且未完成基础入门 → 首屏只走「从第一课开始」单一路径
  // 续学 Hero / 每日计划已由课程主线 /lesson 与首页 JourneyHome 承担，地图不再重复装配
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

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        {/* 地图根返回：实战地图 → 课程枢纽（来源感知主线，非浏览器返回） */}
        <BackLink to="/lesson" label={t('nav.backToCourseHub')} variant="pill" />

        {/* Zone A：零状态 → 单一入口路径卡；有进度时续学入口统一收敛到课程主线 /lesson，地图不再重复 Hero */}
        {isZeroState ? <ZeroStateCard /> : null}

        {/* 变体只读面板：地图不带本地切换，唯一入口在课程主线 /lesson（CourseHub canonical VariantToggle） */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.05 }}
          className="panel variant-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0">
              <SectionLabel as="h2">
                {t('variant.title')}
              </SectionLabel>
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
            <Link
              to="/lesson"
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center rounded-md border border-[var(--walnut-border)] px-3',
                'text-xs font-semibold text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors',
                FOCUS_RING,
              )}
            >
              {t('variant.switchInCourseHub')}
            </Link>
          </div>
        </motion.div>

        {/* Zone B + C：课程阶梯（主列，自适应扩充）＋ 侧栏（掌握度/理论桥/检查点/工具，固定带宽演出奏节奏） */}
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
            <TheoryBridgeCard
              anchors={theoryAnchors}
              onNavigate={(route) => navigate(route, { state: academyMapFrom() })}
            />
            {/* 评估区：检查点 / 认证 / 定位测评统一入口（闭环步骤③锚点目标） */}
            <div id="assessment" className="scroll-mt-2">
              <AcademyAssessmentCard level={checkpointLevel?.level ?? null} />
            </div>
            <ToolsGrid basicsCompleted={basicsProgress.completed} />
          </aside>
        </div>
      </div>
    </div>
  );
}

/**
 * 零状态首屏：单一「从第一课开始」路径卡。
 * 复用 hero 视觉（panel + brass-rail + academy-hero）与黄铜渐变 CTA，
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
      <p className="mb-2 font-numeric text-[9px] uppercase tracking-[0.2em] text-[var(--brass-text)]">
        {t('academy.zeroState.eyebrow')}
      </p>

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
      to: '/quick',
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
      {/* 工具默认折叠：地图保持「阶梯 + 检索 + 评估」主干，工具按需展开 */}
      <details id="academy-tools" className="group">
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
          <SectionLabel as="h2">{t('academy.tools.title')}</SectionLabel>
        </summary>
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
                <span className="block text-[11px] text-[var(--ivory-muted)] truncate">
                  {tool.desc}
                </span>
              </span>
              <ChevronRight className="w-3 h-3 text-[var(--ivory-muted)] shrink-0 ml-auto" />
            </button>
          ))}
        </div>
      </details>
    </motion.section>
  );
}

