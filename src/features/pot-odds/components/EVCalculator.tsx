import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { usePotOddsStore } from '../store';
import { calculateEV } from '@/shared/utils/pokerMath';
import { PotSizeInput } from './PotSizeInput';

export function EVCalculator() {
  const { winRate, potSize, callAmount } = usePotOddsStore((s) => s.evState);
  const setWinRate = usePotOddsStore((s) => s.setWinRate);
  const setEVPotSize = usePotOddsStore((s) => s.setEVPotSize);
  const setCallAmount = usePotOddsStore((s) => s.setCallAmount);
  const resetEV = usePotOddsStore((s) => s.resetEV);

  const currentEV = useMemo(() => {
    return calculateEV(winRate / 100, potSize, callAmount);
  }, [winRate, potSize, callAmount]);

  // Breakeven point: winRate * potSize - (1 - winRate) * callAmount = 0
  // winRate = callAmount / (potSize + callAmount)
  const breakevenRate = potSize + callAmount > 0 ? (callAmount / (potSize + callAmount)) * 100 : 50;

  // Chart data: EV across different win rates
  const chartData = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 100; i += 2) {
      const ev = calculateEV(i / 100, potSize, callAmount);
      points.push({ winRate: i, ev: Math.round(ev * 100) / 100 });
    }
    return points;
  }, [potSize, callAmount]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input section */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">EV 计算</CardTitle>
          <Button variant="ghost" size="icon" onClick={resetEV} className="h-8 w-8 text-[var(--ivory-dim)]">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* Win rate slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm text-[var(--ivory-muted)]">胜率</label>
              <span className="text-lg font-bold font-mono text-[var(--brass)]">{winRate}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={winRate}
              onChange={(e) => setWinRate(parseInt(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer bg-[var(--walnut-border)] accent-[var(--brass)]"
            />
          </div>

          <PotSizeInput
            label="底池大小（赢时获得）"
            value={potSize}
            onChange={setEVPotSize}
            min={1}
            max={10000}
            step={5}
            prefix="$"
          />

          <PotSizeInput
            label="跟注金额（输时损失）"
            value={callAmount}
            onChange={setCallAmount}
            min={1}
            max={10000}
            step={5}
            prefix="$"
          />

          {/* EV Result */}
          <div className="border-t border-[var(--walnut-border)] pt-4">
            <div className="text-center">
              <p className="text-sm text-[var(--ivory-dim)] mb-2">期望值 (EV)</p>
              <p className={`text-4xl font-bold font-mono ${currentEV >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {currentEV >= 0 ? '+' : ''}{currentEV.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[var(--ivory-dim)]">
                每次跟注的长期平均收益
              </p>
            </div>
          </div>

          {/* Breakeven info */}
          <div className="bg-[var(--walnut-border)]/50 rounded-lg p-3">
            <p className="text-xs text-[var(--ivory-dim)]">
              盈亏平衡胜率：<span className="font-mono text-[var(--warning)]">{breakevenRate.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-[var(--ivory-dim)] mt-1">
              当前胜率 {winRate}% {winRate > breakevenRate ? '>' : '<'} 平衡点 {breakevenRate.toFixed(1)}%
              → {winRate >= breakevenRate ? '盈利' : '亏损'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart section */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--ivory-muted)] font-normal">
            EV 随胜率变化曲线
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--walnut-border)" />
              <XAxis
                dataKey="winRate"
                tick={{ fill: 'var(--ivory-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--walnut-border)' }}
                label={{ value: '胜率 %', position: 'insideBottom', offset: -5, fill: 'var(--ivory-dim)', fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: 'var(--ivory-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--walnut-border)' }}
                label={{ value: 'EV', angle: -90, position: 'insideLeft', fill: 'var(--ivory-dim)', fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--walnut-border)',
                  borderRadius: '8px',
                  color: 'var(--ivory)',
                }}
                formatter={(value) => [Number(value).toFixed(2), 'EV']}
                labelFormatter={(label) => `胜率: ${label}%`}
              />
              <ReferenceLine y={0} stroke="var(--ivory-dim)" strokeWidth={1.5} />
              <ReferenceLine
                x={Math.round(breakevenRate)}
                stroke="var(--warning)"
                strokeDasharray="5 5"
                label={{ value: `平衡点`, fill: 'var(--warning)', fontSize: 10, position: 'top' }}
              />
              <Line
                type="monotone"
                dataKey="ev"
                stroke="var(--brass)"
                strokeWidth={2}
                dot={false}
              />
              <ReferenceDot
                x={winRate}
                y={currentEV}
                r={6}
                fill={currentEV >= 0 ? 'var(--success)' : 'var(--danger)'}
                stroke="white"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
