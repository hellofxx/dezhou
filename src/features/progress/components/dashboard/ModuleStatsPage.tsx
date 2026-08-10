import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import { ArrowLeft, Target, Clock, BarChart3 } from 'lucide-react';
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
    () => records.filter((r) => r.module === moduleName).sort((a, b) => b.createdAt - a.createdAt),
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
      正确率: d.questions > 0 ? Math.round(d.accuracy * 100) : null,
    }));
  }, [records, moduleName]);

  const weakHands = useMemo(
    () => getWeakHands(records, moduleName).slice(0, 5),
    [records, moduleName],
  );

  const recentTen = moduleRecords.slice(0, 10);
  const hasTrendData = trendData.some((d) => d.正确率 !== null);

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
          <button
            onClick={() => navigate('/progress')}
            aria-label={t('common.back')}
            className="min-h-11 min-w-11 flex items-center justify-center rounded-lg hover:bg-[var(--surface-raised)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[var(--ivory-muted)]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--ivory)]">{displayName}</h1>
            <p className="text-sm text-[var(--ivory-dim)] mt-0.5">详细训练统计</p>
          </div>
        </motion.div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <StatCard
            icon={<Target className="w-4 h-4 text-[var(--brass)]" />}
            label="总训练次数"
            value={`${stats.sessions}`}
          />
          <StatCard
            icon={<BarChart3 className="w-4 h-4 text-[var(--info)]" />}
            label="正确率"
            value={`${(stats.accuracy * 100).toFixed(1)}%`}
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-[var(--info)]" />}
            label="平均用时"
            value={`${(stats.averageTime / 1000).toFixed(1)}s`}
          />
        </div>

        {/* Trend chart */}
        <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-[var(--ivory)]">正确率趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasTrendData ? (
              <div className="h-[200px] flex items-center justify-center text-[var(--ivory-dim)] text-sm">
                暂无训练数据
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
                    formatter={(value) => [value != null ? `${value}%` : 'N/A', '正确率']}
                  />
                  <Line
                    type="monotone"
                    dataKey="正确率"
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
              <CardTitle className="text-base text-[var(--ivory)]">最近 10 次训练</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTen.length === 0 ? (
                <div className="py-6 text-center text-[var(--ivory-dim)] text-sm">暂无记录</div>
              ) : (
                <div className="space-y-2">
                  {recentTen.map((record, idx) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between py-1.5 border-b border-[var(--surface-raised)]/50 last:border-0"
                    >
                      <span className="text-xs text-[var(--ivory-dim)]">#{idx + 1}</span>
                      <span className="text-sm font-mono text-[var(--brass)]">
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
              <CardTitle className="text-base text-[var(--ivory)]">薄弱点分析</CardTitle>
            </CardHeader>
            <CardContent>
              {weakHands.length === 0 ? (
                <div className="py-6 text-center text-[var(--ivory-dim)] text-sm">暂无数据</div>
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
                          错误 {wh.wrongCount}/{wh.totalCount}
                        </span>
                        <span className="text-xs font-numeric text-[var(--clay)]">
                          {Math.round((wh.wrongCount / wh.totalCount) * 100)}% 错误率
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

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="bg-[var(--surface)] border-[var(--surface-raised)]">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="shrink-0">{icon}</div>
        <div>
          <div className="text-xl font-bold font-mono text-[var(--brass-bright)]">{value}</div>
          <div className="text-xs text-[var(--ivory-dim)]">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
