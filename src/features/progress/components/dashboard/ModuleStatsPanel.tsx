import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useTranslation } from 'react-i18next';
import { useModuleLabel } from '../../hooks/useModuleLabel';
import { staggerContainer, staggerItem } from '@/shared/utils/motion';
import type { ModuleStats } from '../../types';

interface ModuleStatsPanelProps {
  moduleStats: ModuleStats[];
}

/**
 * 各模块训练统计面板（进度页）。
 *
 * 只负责模块维度明细；页面顶部的四项核心指标已由 ProgressHero 承担，
 * 此处不再重复渲染总次数 / 正确率 / 连续天数 / 用时，避免同屏同口径重复。
 */
export default function ModuleStatsPanel({ moduleStats }: ModuleStatsPanelProps) {
  const label = useModuleLabel();
  const { t } = useTranslation();

  if (moduleStats.length === 0) return null;

  return (
    <motion.div variants={staggerContainer(0.1)} initial="hidden" animate="visible">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brass-text)]">
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
    </motion.div>
  );
}
