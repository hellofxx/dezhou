import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionStandard } from '@/shared/utils/motion';
import { BookOpen, Target, Clock, RefreshCw, Sparkles, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAcademyStore } from '../store';
import { findLessonById } from '../utils/courseProgress';
import { resolveLessonTitle } from '../utils/titleKeys';

const ABILITY_I18N_KEYS: Record<string, string> = {
  rangeKnowledge: 'academy.ability.rangeKnowledge',
  oddsCalculation: 'academy.ability.oddsCalculation',
  gtoUnderstanding: 'academy.ability.gtoUnderstanding',
  positionalPlay: 'academy.ability.positionalPlay',
  emotionalControl: 'academy.ability.emotionalControl',
};

// 预计用时 token → i18n key（calculateEstimatedTime 已改输出 token；兼容旧持久化中文值）
const TIME_TOKEN_KEYS: Record<string, string> = {
  '5-10': 'academy.estimatedTime.short',
  '15-20': 'academy.estimatedTime.medium',
  '20-30': 'academy.estimatedTime.long',
  '30+': 'academy.estimatedTime.xlong',
};

export function DailyPlanCard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dailyPlan, refreshDailyPlan } = useAcademyStore();

  // 页面加载时自动生成/刷新计划
  useEffect(() => {
    refreshDailyPlan();
  }, [refreshDailyPlan]);

  if (!dailyPlan) return null;

  const { reviewLessons, newLesson, practiceSpots, estimatedTime, focusArea } = dailyPlan;
  const hasContent = reviewLessons.length > 0 || newLesson || practiceSpots.length > 0;
  if (!hasContent) return null;

  const newLessonInfo = newLesson ? findLessonById(newLesson) : null;
  const abilityLabel =
    focusArea && ABILITY_I18N_KEYS[focusArea] ? t(ABILITY_I18N_KEYS[focusArea]) : '';
  const timeText =
    estimatedTime && TIME_TOKEN_KEYS[estimatedTime]
      ? t('academy.dailyPlan.estimatedTime', { time: t(TIME_TOKEN_KEYS[estimatedTime]) })
      : estimatedTime ?? '';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionStandard, delay: 0.06 }}
      className="panel academy-plan"
      aria-label={t('academy.dailyPlan.title')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[var(--brass-bright)]" />
          <h3 className="text-[13px] font-semibold text-[var(--ivory)] tracking-wide">
            {t('academy.dailyPlan.title')}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          {timeText && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ivory-muted)] font-numeric">
              <Clock className="w-3 h-3" />
              {timeText}
            </span>
          )}
          <button
            type="button"
            // 用户显式刷新意图：force 绕过同日新鲜度守卫（守卫只约束挂载时的惰性生成入口）
            onClick={() => refreshDailyPlan([], { force: true })}
            className="p-1.5 rounded hover:bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors"
            aria-label={t('academy.dailyPlan.refresh')}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Focus area badge */}
      {abilityLabel && (
        <div className="mb-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brass-bright)]/10 text-[10px] text-[var(--brass-bright)]">
            <Target className="w-3 h-3" />
            {t('academy.dailyPlan.focusLabel')} · {abilityLabel}
          </span>
        </div>
      )}

      {/* Plan items */}
      <ul className="space-y-1.5">
        {reviewLessons.length > 0 && (
          <li className="flex items-center gap-2 py-1">
            <span className="w-6 h-6 rounded bg-[var(--poker-info)]/15 flex items-center justify-center shrink-0">
              <RefreshCw className="w-3 h-3 text-[var(--poker-info)]" />
            </span>
            <p className="flex-1 min-w-0 text-xs text-[var(--ivory-dim)] truncate">
              {t('academy.dailyPlan.review')}：
              {reviewLessons.map((id) => findLessonById(id)?.title ?? id).join('、')}
            </p>
          </li>
        )}

        {newLessonInfo && (
          <li>
            <button
              type="button"
              onClick={() => navigate(`/academy/lesson/${newLesson}`)}
              className="w-full flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md text-left group hover:bg-[var(--walnut-raised)]/40 transition-colors"
            >
              <span className="w-6 h-6 rounded bg-[var(--poker-success)]/15 flex items-center justify-center shrink-0">
                <BookOpen className="w-3 h-3 text-[var(--poker-success)]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors truncate">
                  {t('academy.dailyPlan.newLesson')}：{resolveLessonTitle(t, newLessonInfo)}
                </span>
                <span className="block text-[10px] text-[var(--ivory-muted)]">
                  {newLessonInfo.duration}
                </span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] shrink-0" />
            </button>
          </li>
        )}

        {practiceSpots.length > 0 && (
          <li>
            <button
              type="button"
              onClick={() => navigate('/academy/quick-drill')}
              className="w-full flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md text-left group hover:bg-[var(--walnut-raised)]/40 transition-colors"
            >
              <span className="w-6 h-6 rounded bg-[var(--poker-terra)]/20 flex items-center justify-center shrink-0">
                <Target className="w-3 h-3 text-[var(--poker-terra-bright)]" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors truncate">
                  {t('academy.dailyPlan.practice')}（{t('academy.dailyPlan.practiceCount', { count: practiceSpots.length })}）
                </span>
                <span className="block text-[10px] text-[var(--ivory-muted)]">
                  {t('academy.dailyPlan.practiceDesc')}
                </span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--ivory-muted)] group-hover:text-[var(--brass-bright)] shrink-0" />
            </button>
          </li>
        )}
      </ul>
    </motion.section>
  );
}
