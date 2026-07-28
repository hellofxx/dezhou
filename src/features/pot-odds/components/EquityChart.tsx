import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

interface EquityChartProps {
  potOdds: number;
  estimatedEquity: number;
}

export function EquityChart({ potOdds, estimatedEquity }: EquityChartProps) {
  const data = [
    { name: '需要胜率', value: potOdds, fill: 'var(--warning)' },
    { name: '估算胜率', value: estimatedEquity, fill: estimatedEquity >= potOdds ? 'var(--success)' : 'var(--danger)' },
  ];

  const diff = estimatedEquity - potOdds;

  return (
    <Card className="bg-[var(--surface)] border-[var(--walnut-border)] h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-[var(--ivory-muted)] font-normal flex items-center justify-between">
          <span>权益对比</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${diff >= 0 ? 'bg-[var(--success)]/10 text-[var(--success)]' : 'bg-[var(--danger)]/10 text-[var(--danger)]'}`}>
            差值: {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--walnut-border)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--ivory-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--walnut-border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--ivory-muted)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--walnut-border)' }}
              unit="%"
              domain={[0, 100]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--walnut-border)',
                borderRadius: '8px',
                color: 'var(--ivory)',
              }}
              formatter={(value) => [`${Number(value).toFixed(1)}%`, '']}
            />
            <ReferenceLine y={50} stroke="var(--ivory-dim)" strokeDasharray="3 3" />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.fill} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
