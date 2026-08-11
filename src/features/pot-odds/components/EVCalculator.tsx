import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { usePotOddsStore } from '../store';
import { calculateEV } from '@/shared/utils/pokerMath';
import { PotSizeInput } from './PotSizeInput';

export function EVCalculator() {
  const { t } = useTranslation();
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
  // ODDS-04：winRate 为整数滑块值，breakevenRate 为浮点；用 0.05 容差判定相等，
  // 避免浮点精度使 breakEven（=）分支不可达。
  const isAtBreakeven = Math.abs(winRate - breakevenRate) < 0.05;

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
          <CardTitle className="text-base">{t('potOdds.ev.title')}</CardTitle>
          <Button variant="ghost" size="icon" onClick={resetEV} className="h-11 w-11 text-[var(--ivory-dim)]">
            <RotateCcw className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          {/* Win rate slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="ev-equity-slider" className="text-sm text-[var(--ivory-muted)]">{t('potOdds.ev.equity')}</label>
              <span className="text-lg font-bold font-mono text-[var(--brass)]">{winRate}%</span>
            </div>
            <input
              id="ev-equity-slider"
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
            label={t('potOdds.ev.potWin')}
            value={potSize}
            onChange={setEVPotSize}
            min={1}
            max={10000}
            step={5}
            prefix="$"
          />

          <PotSizeInput
            label={t('potOdds.ev.callCost')}
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
              <p className="text-sm text-[var(--ivory-dim)] mb-2">{t('potOdds.ev.resultLabel')}</p>
              <p className={`text-4xl font-bold font-mono ${currentEV >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {currentEV >= 0 ? '+' : ''}{currentEV.toFixed(2)}
              </p>
              <p className="mt-2 text-xs text-[var(--ivory-dim)]">
                {t('potOdds.ev.resultDesc')}
              </p>
            </div>
          </div>

          {/* Breakeven info */}
          <div className="bg-[var(--walnut-border)]/50 rounded-lg p-3">
            <p className="text-xs text-[var(--ivory-dim)]">
              {t('potOdds.ev.breakevenLabel')}<span className="font-mono text-[var(--warning)]">{breakevenRate.toFixed(1)}%</span>
            </p>
            {/* P1B-08：相等分支显示 “=” 与“盈亏平衡”，避免“50% < 50.0% → 盈利”符号与结论矛盾 */}
            <p className="text-xs text-[var(--ivory-dim)] mt-1">
              {t('potOdds.ev.currentEquity')} {winRate}% {winRate > breakevenRate ? '>' : isAtBreakeven ? '=' : '<'} {t('potOdds.ev.breakeven')} {breakevenRate.toFixed(1)}%
              → {winRate > breakevenRate ? t('potOdds.ev.profitable') : isAtBreakeven ? t('potOdds.ev.breakEven') : t('potOdds.ev.losing')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Chart section */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-[var(--ivory-muted)] font-normal">
            {t('potOdds.ev.chartTitle')}
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
                label={{ value: t('potOdds.ev.xAxisLabel'), position: 'insideBottom', offset: -5, fill: 'var(--ivory-dim)', fontSize: 11 }}
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
                labelFormatter={(label) => t('potOdds.ev.tooltipEquity', { label })}
              />
              <ReferenceLine y={0} stroke="var(--ivory-dim)" strokeWidth={1.5} />
              <ReferenceLine
                x={Math.round(breakevenRate)}
                stroke="var(--warning)"
                strokeDasharray="5 5"
                label={{ value: t('potOdds.ev.breakevenLine'), fill: 'var(--warning)', fontSize: 10, position: 'top' }}
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
