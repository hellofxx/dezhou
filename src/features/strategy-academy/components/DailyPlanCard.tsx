import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Target, Clock, RefreshCw, Sparkles } from 'lucide-react';
import { useAcademyStore } from '../store';
import { findLessonById } from '../utils/courseProgress';
import { getAbilityLabel } from '../utils/dailyPlan';

export function DailyPlanCard() {
  const navigate = useNavigate();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.05 }}
      className="rounded-lg border border-[var(--brass-bright)]/30 bg-gradient-to-br from-[var(--brass-bright)]/5 to-transparent p-4 md:p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--brass-bright)]" />
          <h3 className="text-sm font-semibold text-[var(--ivory)]">今日训练计划</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[11px] text-[var(--ivory-muted)]">
            <Clock className="w-3 h-3" />
            {estimatedTime}
          </span>
          <button
            onClick={() => refreshDailyPlan()}
            className="p-1 rounded hover:bg-[var(--walnut-raised)] text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors"
            title="刷新计划"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Focus area badge */}
      {focusArea && (
        <div className="mb-3">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brass-bright)]/10 text-[10px] text-[var(--brass-bright)]">
            <Target className="w-3 h-3" />
            今日重点：{getAbilityLabel(focusArea)}
          </span>
        </div>
      )}

      {/* Plan items */}
      <div className="space-y-2">
        {/* 复习课程 */}
        {reviewLessons.length > 0 && (
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded bg-[var(--poker-info)]/20 flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-3 h-3 text-[var(--poker-info)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--ivory-dim)]">
                复习：{reviewLessons.map((id) => findLessonById(id)?.title ?? id).join('、')}
              </p>
            </div>
          </div>
        )}

        {/* 新课程 */}
        {newLessonInfo && (
          <button
            onClick={() => navigate(`/academy/lesson/${newLesson}`)}
            className="w-full flex items-start gap-2.5 text-left group"
          >
            <div className="w-5 h-5 rounded bg-[var(--poker-success)]/20 flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-3 h-3 text-[var(--poker-success)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors">
                学习新课：{newLessonInfo.title}
              </p>
              <p className="text-[10px] text-[var(--ivory-muted)]">{newLessonInfo.duration}</p>
            </div>
          </button>
        )}

        {/* 定向练习 */}
        {practiceSpots.length > 0 && (
          <button
            onClick={() => navigate('/academy/quick-drill')}
            className="w-full flex items-start gap-2.5 text-left group"
          >
            <div className="w-5 h-5 rounded bg-[var(--poker-terra)]/25 flex items-center justify-center shrink-0 mt-0.5">
              <Target className="w-3 h-3 text-[var(--poker-terra-bright)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--ivory)] group-hover:text-[var(--brass-bright)] transition-colors">
                定向练习（{practiceSpots.length} 组）
              </p>
              <p className="text-[10px] text-[var(--ivory-muted)]">基于弱点的强化训练</p>
            </div>
          </button>
        )}
      </div>
    </motion.div>
  );
}
