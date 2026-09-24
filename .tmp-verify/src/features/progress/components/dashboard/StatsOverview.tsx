import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Target, Clock, BarChart3, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useModuleLabel } from '@/shared/hooks/useModuleLabel';
import { staggerContainer, staggerItem } from '@/shared/utils/motion';
import type { StatsSummary, ModuleStats } from '../../types';

interface StatsOverviewProps {
  stats: StatsSummary;
  moduleStats: ModuleStats[];
}

export default function StatsOverview({ stats, moduleStats }: StatsOverviewProps) {
  const label = useModuleLabel();
  const { t } = useTranslation();
  return (
    <motion.div variants={staggerContainer(0.1)} initial="hidden" animate="visible" className="space-y-4">
      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Target className="w-4 h-4" />}
            label={t('progress.stats.totalSessions')}
            value={`${stats.totalSessions}`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            accent
            icon={<BarChart3 className="w-4 h-4" />}
            label={t('progress.stats.accuracy')}
            value={`${(stats.overallAccuracy * 100).toFixed(1)}%`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            accent
            icon={<Zap className="w-4 h-4" />}
            label={t('progress.stats.streak')}
            value={`${stats.currentStreak}`}
          />
        </motion.div>
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label={t('progress.stats.avgTime')}
            value={`${(stats.averageTime / 1000).toFixed(1)}s`}
          />
        </motion.div>
      </div>

      {/* 各模块统计 */}
      {moduleStats.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brass-deep)]">
              {t('progress.stats.moduleTitle')}
            </span>
            <span className="flex-1 h-px bg-gradient-to-r from-[var(--brass)]/30 to-transparent" />
          </div>
          <div className="flex flex-wrap gap-3">
            {moduleStats.map((ms) => (
              <motion.div
                key={ms.module}
                variants={staggerItem}
                className="min-w-[200px]"
                style={{ flex: '1 1 220px' }}
              >
                <Card className="bg-[var(--felt)] border-[var(--walnut-border)] h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
                      {label(ms.module)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ivory-muted)]">{t('progress.stats.sessions')}</span>
                      <span className="font-numeric text-[var(--ivory)]">{ms.sessions}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ivory-muted)]">{t('progress.stats.accuracy')}</span>
                      <span className="font-numeric text-[var(--brass-bright)]">
                        {(ms.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ivory-muted)]">{t('progress.stats.avgTime')}</span>
                      <span className="font-numeric text-[var(--ivory)]">
                        {(ms.averageTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <Card
      className={`brass-rail bg-[var(--felt)] border-[var(--walnut-border)] overflow-hidden ${
        accent ? 'border-[var(--brass)]/25' : ''
      }`}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${
            accent
              ? 'bg-[var(--brass)]/12 border-[var(--brass)]/25 text-[var(--brass-bright)]'
              : 'bg-[var(--walnut-raised)]/50 border-[var(--walnut-border)] text-[var(--ivory-muted)]'
          }`}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div
            className={`text-xl font-bold font-numeric leading-tight ${
              accent ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory)]'
            }`}
          >
            {value}
          </div>
          <div className="text-xs text-[var(--ivory-muted)] mt-0.5">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
