import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Target, Clock, BarChart3, Zap } from 'lucide-react';
import type { StatsSummary, ModuleStats } from '../types';

interface StatsOverviewProps {
  stats: StatsSummary;
  moduleStats: ModuleStats[];
}

const MODULE_LABELS: Record<string, string> = {
  'range-trainer': '手牌范围训练',
  'pot-odds': '赔率计算器',
  'gto-simulator': 'GTO 模拟器',
  'theory-academy': '理论学院',
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function StatsOverview({ stats, moduleStats }: StatsOverviewProps) {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={item}>
          <StatCard
            icon={<Target className="w-5 h-5 text-[var(--brass)]" />}
            label="总训练次数"
            value={`${stats.totalSessions}`}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            icon={<BarChart3 className="w-5 h-5 text-[var(--info)]" />}
            label="总正确率"
            value={`${(stats.overallAccuracy * 100).toFixed(1)}%`}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            icon={<Zap className="w-5 h-5 text-[var(--brass-bright)]" />}
            label="连续天数"
            value={`${stats.currentStreak} 🔥`}
          />
        </motion.div>
        <motion.div variants={item}>
          <StatCard
            icon={<Clock className="w-5 h-5 text-[var(--sage)]" />}
            label="平均用时"
            value={`${(stats.averageTime / 1000).toFixed(1)}s`}
          />
        </motion.div>
      </div>

      {/* 各模块统计 */}
      {moduleStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {moduleStats.map((ms) => (
            <motion.div key={ms.module} variants={item}>
              <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
                    {MODULE_LABELS[ms.module] ?? ms.module}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ivory-muted)]">训练次数</span>
                    <span className="font-numeric text-[var(--ivory)]">{ms.sessions}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ivory-muted)]">正确率</span>
                    <span className="font-numeric text-[var(--brass-bright)]">
                      {(ms.accuracy * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--ivory-muted)]">平均用时</span>
                    <span className="font-numeric text-[var(--ivory)]">
                      {(ms.averageTime / 1000).toFixed(1)}s
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="text-xl font-bold font-numeric text-[var(--ivory)]">{value}</div>
          <div className="text-xs text-[var(--ivory-muted)]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
