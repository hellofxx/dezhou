import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BackLink } from '@/shared/components/layout/BackLink';
import { motion } from 'framer-motion';
import { transitionStandard } from '@/shared/utils/motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { StatCard } from '@/shared/components/data-display/StatCard';
import { Target, Clock, BarChart3 } from 'lucide-react';
import { useProgressStore } from '../../store';
import { aggregateByDay } from '../../utils/statsAggregator';
import { getWeakHands } from '../../utils/statsAggregator';

interface ModuleStatsPageProps {
  moduleName: string;
  displayName: string;
}

export default function ModuleStatsPage({ moduleName, displayName }: ModuleStatsPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const records = useProgressStore((s) => s.records);

  const moduleRecords = useMemo(
    () => records.filter((r) => r.module === moduleName).toSorted((a, b) => b.createdAt - a.createdAt),
    [records, moduleName],
  );

  const stats = useMemo(() => {
    if (moduleRecords.length === 0) {
      return { sessions: 0, accuracy: 0, averageTime: 0 };
    }
    const totalQ = moduleRecords.reduce((s, r) => s + r.result.totalQuestions, 0);
    const totalC = moduleRecords.reduce((s, r) => s + r.result.correctAnswers, 0);
    const totalTime = moduleRecords.reduce((s, r) => s + r.result.averageTime * r.result.totalQuestions, 0);
    return {
      sessions: moduleRecords.length,
      accuracy: totalQ > 0 ? totalC / totalQ : 0,
      averageTime: totalQ > 0 ? totalTime / totalQ : 0,
    };
  }, [moduleRecords]);

  const trendData = useMemo(() => {
    const dailyStats = aggregateByDay(
      records.filter((r) => r.module === moduleName),
      14,
    );
    return dailyStats.map((d) => ({
      date: d.date.slice(5),
      accuracy: d.questions > 0 ? Math.round(d.accuracy * 100) : null,
    }));
  }, [records, moduleName]);

  const weakHands = useMemo(
    () => getWeakHands(records, moduleName).slice(0, 5),
    [records, moduleName],
  );

  const recentTen = moduleRecords.slice(0, 10);
  const hasTrendData = trendData.some((d) => d.accuracy !== null);

  return (
    <div className="h-full overflow-auto">
      <div className="py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionStandard}
          className="flex items-center gap-3"
        >
          <BackLink
            onClick={() => navigate('/progress')}
            label={t('common.ui.back')}
            iconOnly
          />
          <div>
            <h2 className="text-2xl font-bold text-[var(--ivory)]">{displayName}</h2>
            <p className="text-sm text-[var(--ivory-dim)] mt-0.5">{t('progress.moduleStats.subtitle')}</p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Target className="w-4 h-4 text-[var(--brass-text)]" />}
            label={t('progress.moduleStats.totalSessions')}
            value={`${stats.sessions}`}
            accent="gold"
            size="lg"
            layout="inline"
            surface="flat"
          />
          <StatCard
            icon={<BarChart3 className="w-4 h-4 text-[var(--info)]" />}
            label={t('progress.moduleStats.accuracy')}
            value={`${(stats.accuracy * 100).toFixed(1)}%`}
            accent="gold"
            size="lg"
            layout="inline"
            surface="flat"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-[var(--info)]" />}
            label={t('progress.moduleStats.avgTime')}
            value={`${(stats.averageTime / 1000).toFixed(1)}s`}
            accent="gold"
            size="lg"
            layout="inline"
            surface="flat"
          />
        </div>

        {/* Trend chart */}
        <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[var(--ivory)]">{t('progress.moduleStats.accuracyTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTrendData ? (
              <div className="h-[200px] flex items-center justify-center text-[var(--ivory-dim)] text-sm">
                {t('progress.moduleStats.noData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--surface-raised)" />
                  <XAxis dataKey="date" stroke="var(--ivory-dim)" fontSize={12} tickLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    stroke="var(--ivory-dim)"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(v: number) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--surface-raised)',
                      borderRadius: '8px',
                      color: 'var(--ivory)',
                      fontSize: '12px',
                    }}
                    formatter={(value) => [value != null ? `${value}%` : 'N/A', t('progress.moduleStats.accuracy')]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="var(--brass)"
                    strokeWidth={2}
                    dot={{ fill: 'var(--brass)', r: 3 }}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recent 10 sessions */}
          <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[var(--ivory)]">{t('progress.moduleStats.recentTen')}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTen.length === 0 ? (
                <div className="py-6 text-center text-[var(--ivory-dim)] text-sm">{t('progress.moduleStats.noRecords')}</div>
              ) : (
                <div className="space-y-2">
                  {recentTen.map((record, idx) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-1.5 border-b border-[var(--surface-raised)]/50 last:border-0"
                    >
                      <span className="text-xs text-[var(--ivory-dim)]">#{idx + 1}</span>
                      <span className="text-sm font-mono text-[var(--brass-text)]">
                        {(record.result.accuracy * 100).toFixed(1)}%
                      </span>
                      <span className="text-xs font-mono text-[var(--ivory-muted)]">
                        {(record.result.averageTime / 1000).toFixed(1)}s
                      </span>
                      <span className="text-xs text-[var(--ivory-dim)]">
                        {formatDate(record.createdAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Weak spots */}
          <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-[var(--ivory)]">{t('progress.moduleStats.weakSpots')}</CardTitle>
            </CardHeader>
            <CardContent>
              {weakHands.length === 0 ? (
                <div className="py-6 text-center text-[var(--ivory-dim)] text-sm">{t('progress.moduleStats.weakNoData')}</div>
              ) : (
                <div className="space-y-2">
                  {weakHands.map((wh) => (
                    <div
                      key={wh.hand}
                      className="flex items-center justify-between py-1.5 border-b border-[var(--walnut-border)]/40 last:border-0"
                    >
                      <span className="text-sm text-[var(--ivory)] font-numeric">{wh.hand}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--ivory-muted)] font-numeric">
                          {t('progress.moduleStats.weakWrong', { wrong: wh.wrongCount, total: wh.totalCount })}
                        </span>
                        <span className="text-xs font-numeric text-[var(--clay-text)]">
                          {t('progress.moduleStats.weakRate', { rate: Math.round((wh.wrongCount / wh.totalCount) * 100) })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
