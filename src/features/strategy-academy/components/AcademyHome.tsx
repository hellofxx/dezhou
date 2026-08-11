import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { Zap, Route, GraduationCap, Network, ChevronRight } from 'lucide-react';
import { transitionStandard } from '@/shared/utils/motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { LevelInfo } from '../types';
import type { PokerVariant } from '@/shared/types/elo';
import { LEVELS } from '../data/courses';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import { getTotalLessonCount } from '../utils/courseProgress';
import { AcademyResume } from './AcademyResume';
import { LevelLadder, findActiveLevelId } from './LevelLadder';
import { DailyPlanCard } from './DailyPlanCard';
import { VariantToggle } from '@/shared/components/VariantToggle';
import { VARIANT_LESSON_INDEX } from '../data/lessons/variants';

/**
 * ACAD-05：按变体构造课程阶梯。
 * - standard：直接返回标准 LEVELS。
 * - short-deck / heads-up：复用 VARIANT_LESSON_INDEX 按 level 分组，
 *   元数据沿用标准 LevelInfo（L1/L2 为共享基础层，标题结构一致），
 *   课程列表替换为变体课程，使变体课程从 UI 可达。
 */
function buildVariantLevels(variant: PokerVariant): LevelInfo[] {
  const variantLessons = VARIANT_LESSON_INDEX[variant];
  const byLevel = new Map<number, LevelInfo['lessons']>();
  for (const l of variantLessons) {
    const arr = byLevel.get(l.level) ?? [];
    arr.push(l);
    byLevel.set(l.level, arr);
  }
  return LEVELS.filter((lv) => byLevel.has(lv.level)).map((lv) => ({
    ...lv,
    lessons: byLevel.get(lv.level) ?? lv.lessons,
  }));
}

export default function AcademyHome() {
  const { t } = useTranslation();
  const { progress, getTotalProgress, basicsProgress } = useAcademy();
  const isLevelEntryUnlocked = useAcademyStore((s) => s.isLevelEntryUnlocked);
  const isCertified = useAcademyStore((s) => s.isCertified);
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const switchVariant = useAcademyStore((s) => s.switchVariant);

  const totalProgress = getTotalProgress();
  const totalLessons = getTotalLessonCount();
  const completedCount = progress.completedLessons.length;

  // ACAD-05：阶梯按当前变体渲染（standard 原样；short-deck/heads-up 用变体课程列表）
  const ladderLevels = activeVariant === 'standard' ? LEVELS : buildVariantLevels(activeVariant);

  const activeLevelId = findActiveLevelId(ladderLevels, progress.completedLessons, isLevelEntryUnlocked);
  const activeLevel = ladderLevels.find((l) => (l.id ?? String(l.level)) === activeLevelId) ?? null;

  const levelsDoneCount = ladderLevels.filter((level) =>
    level.lessons.every((l) => progress.completedLessons.includes(l.id))
  ).length;
  const certifiedCount = ladderLevels.reduce(
    (n, level) => (isCertified(level.level) ? n + 1 : n),
    0
  );

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-5">
        {/* Zone A：继续学习 Hero */}
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

        {/* 变体切换：统一面板，副标题随所选变体实时联动 */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...transitionStandard, delay: 0.05 }}
          className="panel variant-panel"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
                {t('variant.select_variant')}
              </h2>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">
                {t(`variant.name.${activeVariant}`)}
                {activeVariant !== 'standard' && (
                  <span className="text-[var(--ivory-dim)]">
                    {' '}
                    · {VARIANT_LESSON_INDEX[activeVariant].length} {t('academy.lessons')} ·{' '}
                    {t('academy.variantSkeleton')}
                  </span>
                )}
              </p>
            </div>
            <VariantToggle active={activeVariant} onSelect={switchVariant} />
          </div>
        </motion.div>

        {/* Zone B + C：课程阶梯（主列）＋ 侧栏（今日计划/工具） */}
        <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitionStandard, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <LevelLadder
              levels={ladderLevels}
              completedLessons={progress.completedLessons}
              isUnlocked={isLevelEntryUnlocked}
            />
          </motion.div>

          <aside className="space-y-4 lg:sticky lg:top-2">
            <DailyPlanCard />
            <ToolsGrid basicsCompleted={basicsProgress.completed} />
          </aside>
        </div>
      </div>
    </div>
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
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.12 }}
      aria-label={t('academy.tools.title')}
    >
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold mb-2.5 px-1">
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
