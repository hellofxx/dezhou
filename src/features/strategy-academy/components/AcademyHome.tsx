import { motion } from 'framer-motion';
import { GraduationCap, Zap, Route } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LEVELS } from '../data/courses';
import { useAcademy } from '../hooks/useAcademy';
import { useAcademyStore } from '../store';
import { getTotalLessonCount } from '../utils/courseProgress';
import { LevelCard } from './LevelCard';
import { DailyPlanCard } from './DailyPlanCard';
import { VariantToggle } from '@/shared/components/VariantToggle';
import { VARIANT_LESSON_INDEX } from '../data/lessons/variants';

export default function AcademyHome() {
  const { t } = useTranslation();
  const { progress, getTotalProgress, basicsProgress } = useAcademy();
  // 审计 1.1：卡片解锁按 LevelInfo 条目判定，与 CourseView 门禁口径一致（区分 l4a/l4b）
  const isLevelEntryUnlocked = useAcademyStore((s) => s.isLevelEntryUnlocked);
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const switchVariant = useAcademyStore((s) => s.switchVariant);
  const navigate = useNavigate();

  const totalProgress = getTotalProgress();
  const totalLessons = getTotalLessonCount();
  const completedCount = progress.completedLessons.length;

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Path Banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="path-banner"
        >
          <div>
            <div className="path-banner-title">{t('academy.pathBanner.title')}</div>
            <div className="path-banner-sub">
              {t('academy.pathBanner.subtitle', { modules: LEVELS.length, lessons: totalLessons, hours: 10, progress: totalProgress })}
            </div>
          </div>
          <button
            onClick={() => navigate('/academy/tracks')}
            className="shrink-0 px-4 py-2 rounded-md text-sm font-semibold bg-[var(--walnut)] text-[var(--brass-bright)] border border-[var(--walnut)] hover:bg-[var(--walnut-raised)] transition-colors"
          >
            {t('academy.pathBanner.continue')}
          </button>
        </motion.div>

        {/* Header */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="panel"
        >
          <div className="flex items-center gap-6">
            <div className="flex-1">
              {/* 顶栏 H1 已显示页名，内容区不重复大标题；eyebrow 携带与理论学院的定位区分 */}
              <p className="section-eyebrow mb-2">
                Strategy Academy · {t('academy.positioning')}
              </p>
              <p className="text-sm text-[var(--ivory-dim)] max-w-sm">
                {t('academy.subtitle')}
              </p>
            </div>
            {/* Progress ring */}
            <div className="shrink-0 flex flex-col items-center gap-2">
              <ProgressRing value={totalProgress} />
              <p className="text-xs text-[var(--ivory-muted)] font-numeric">
                {completedCount}/{totalLessons} {t('academy.lessons')}
              </p>
            </div>
          </div>
        </motion.section>

        {/* Daily Plan Card */}
        <DailyPlanCard />

        {/* Quick Actions: 速训 + 轨道 */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate('/academy/quick-drill')}
            className="drill-mini-pill"
          >
            <Zap className="w-4 h-4 text-[var(--brass)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--ivory)]">5分钟速训</div>
              <div className="text-[10px] text-[var(--ivory-muted)]">针弱点快速强化</div>
            </div>
          </button>
          <button
            onClick={() => navigate('/academy/tracks')}
            className="drill-mini-pill"
          >
            <Route className="w-4 h-4 text-[var(--brass)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--ivory)]">学习轨道</div>
              <div className="text-[10px] text-[var(--ivory-muted)]">选择目标路径</div>
            </div>
          </button>
        </motion.div>

        {/* Basics entry card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <button
            onClick={() => navigate('/academy/basics')}
            className={`course-card w-full text-left ${basicsProgress.completed ? '' : 'border-l-[var(--brass-bright)]}'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎓</span>
              <div className="flex-1">
                <div className="course-title flex items-center gap-2">
                  {t('academy.basics')}
                  {!basicsProgress.completed && (
                    <span className="course-level lv-beginner">
                      {t('academy.startHere')}
                    </span>
                  )}
                </div>
                <div className="course-lessons">
                  {basicsProgress.completed
                    ? `✅ ${t('academy.completed')} · ${t('academy.clickToReview')}`
                    : t('academy.basicsDesc')}
                </div>
              </div>
              {!basicsProgress.completed && (
                <span className="text-xs px-3 py-1.5 rounded-md bg-[var(--brass-bright)] text-[var(--felt-deep)] font-medium">
                  {t('academy.startLearning')}
                </span>
              )}
            </div>
          </button>
        </motion.div>

        {/* Concept Graph entry */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <button
            onClick={() => navigate('/academy/concept-graph')}
            className="course-card w-full text-left"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🧠</span>
              <div className="flex-1">
                <div className="course-title">{t('academy.knowledgeGraph')}</div>
                <div className="course-lessons">
                  {t('academy.conceptGraphDesc')}
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-md bg-[var(--walnut-raised)] text-[var(--ivory-muted)]">
                {t('academy.enter')}
              </span>
            </div>
          </button>
        </motion.div>

        {/* P2 变体切换器 */}
        <div className="flex items-center justify-between gap-4 px-1">
          <h2 className="text-[11px] uppercase tracking-[0.22em] text-[var(--brass-deep)] font-semibold">
            {t('variant.select_variant')}
          </h2>
          <VariantToggle active={activeVariant} onSelect={switchVariant} />
        </div>

        {/* 变体课程骨架提示（非标准变体课程内容尚在填充中） */}
        {activeVariant !== 'standard' && (
          <div className="rounded-lg border border-felt-700 bg-felt-900/20 p-4">
            <p className="text-sm text-[var(--ivory-dim)]">
              {t('variant.name.' + activeVariant)} · {VARIANT_LESSON_INDEX[activeVariant].length} {t('academy.lessons')}（骨架已就绪，内容填充中）
            </p>
          </div>
        )}

        {/* Level cards */}
        <div className="space-y-3">
          {LEVELS.map((level, index) => (
            <LevelCard
              key={level.id ?? level.level}
              level={level}
              unlocked={isLevelEntryUnlocked(level.id ?? String(level.level))}
              completedLessons={progress.completedLessons}
              index={index}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressRing({ value }: { value: number }) {
  const radius = 36;
  const strokeWidth = 6;
  const size = (radius + strokeWidth) * 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - value / 100);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="var(--walnut-raised)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          fill="none"
          stroke="var(--brass-bright)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-5 h-5 text-[var(--brass-bright)] mx-auto mb-0.5" />
          <span className="font-numeric text-sm text-[var(--ivory)]">{value}%</span>
        </div>
      </div>
    </div>
  );
}
