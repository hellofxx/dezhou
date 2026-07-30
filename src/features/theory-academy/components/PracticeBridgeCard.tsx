import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Route, ChevronRight } from 'lucide-react';
import type { PracticeRecommendation } from '../types';

interface PracticeBridgeCardProps {
  recommendations: PracticeRecommendation;
}

/**
 * "去实践"推荐卡：理论→实践闭环出口。
 * 仅通过路由字符串跳转 strategy-academy（不产生跨模块 import）；
 * 引用完整性由 strategy-academy curriculumIntegrity 测试守卫。
 */
export function PracticeBridgeCard({ recommendations }: PracticeBridgeCardProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-[var(--brass)]/30 bg-[var(--felt-deep)] p-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Swords className="w-4 h-4 text-[var(--brass-bright)]" />
        <h3 className="font-display text-[16px] text-[var(--ivory)]">去实践应用</h3>
      </div>
      <p className="text-xs text-[var(--ivory-muted)] mb-4">
        理论已就位——到策略学院把它变成决策能力
      </p>
      <div className="space-y-2">
        {recommendations.lessons.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => navigate(`/academy/lesson/${lesson.id}`)}
            aria-label={`前往实践课程：${lesson.title}`}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 transition-all text-sm text-[var(--ivory-dim)]"
          >
            <span>{lesson.title}</span>
            <ChevronRight className="w-4 h-4 text-[var(--ivory-muted)]" />
          </button>
        ))}
        {recommendations.trackId && (
          <button
            onClick={() => navigate('/academy/tracks')}
            aria-label="前往推荐学习轨道"
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            <Route className="w-4 h-4" />
            进入推荐学习轨道
          </button>
        )}
      </div>
    </motion.div>
  );
}
