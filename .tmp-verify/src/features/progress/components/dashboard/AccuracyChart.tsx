import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { transitionSlow } from '@/shared/utils/motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import type { DailyStats } from '../../types';

interface AccuracyChartProps {
  dailyStats: DailyStats[];
  days?: number;
}

export default function AccuracyChart({ dailyStats }: AccuracyChartProps) {
  const { t } = useTranslation();
  // 格式化数据给 Recharts（固定字段名 + i18n 标签在 Tooltip 中解析）
  const chartData = dailyStats.map((d) => ({
    date: d.date.slice(5), // MM-DD
    accuracy: d.questions > 0 ? Math.round(d.accuracy * 100) : null,
    sessions: d.sessions,
  }));

  const hasData = chartData.some((d) => d.accuracy !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionSlow, delay: 0.2 }}
      className="h-full"
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)] h-full flex flex-col">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
            {t('progress.chart.accuracyTrend')}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-[210px] flex flex-col">
          {!hasData ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-[var(--ivory-dim)]">
              <div className="w-12 h-12 rounded-full bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-[var(--brass-deep)]" />
              </div>
              <div className="text-sm">{t('progress.chart.empty')}</div>
              <div className="text-xs text-[var(--ivory-muted)]">{t('progress.chart.emptyHint')}</div>
            </div>
          ) : (
            <div className="flex-1 min-h-[210px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brass)" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="var(--brass)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--walnut-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--ivory-dim)"
                  fontSize={11}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  stroke="var(--ivory-dim)"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    border: '1px solid var(--walnut-border)',
                    borderRadius: '8px',
                    color: 'var(--ivory)',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [value != null ? `${value}%` : 'N/A', t('progress.chart.accuracySeries')]}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="var(--brass)"
                  strokeWidth={2}
                  fill="url(#accuracyGradient)"
                  dot={{ fill: 'var(--brass)', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
