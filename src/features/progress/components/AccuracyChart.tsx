import { motion } from 'framer-motion';
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
import type { DailyStats } from '../types';

interface AccuracyChartProps {
  dailyStats: DailyStats[];
  days?: number;
}

export default function AccuracyChart({ dailyStats }: AccuracyChartProps) {
  // 格式化数据给 Recharts
  const chartData = dailyStats.map((d) => ({
    date: d.date.slice(5), // MM-DD
    正确率: d.questions > 0 ? Math.round(d.accuracy * 100) : null,
    训练量: d.sessions,
  }));

  const hasData = chartData.some((d) => d.正确率 !== null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-[var(--ivory)]">
            正确率趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <div className="h-[200px] flex items-center justify-center text-[var(--ivory-dim)] text-sm">
              暂无训练数据
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--walnut-border)" />
                <XAxis
                  dataKey="date"
                  stroke="var(--ivory-dim)"
                  fontSize={12}
                  tickLine={false}
                />
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
                    border: '1px solid var(--walnut-border)',
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
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
