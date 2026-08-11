import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LineChart, Line, XAxis, YAxis, ReferenceLine, ResponsiveContainer } from 'recharts';

export function calculateEV(potSize: number, betAmount: number, winRate: number): number {
  const rate = Math.max(0, Math.min(1, Number.isFinite(winRate) ? winRate : 0));
  const pot = Math.max(0, Number.isFinite(potSize) ? potSize : 0);
  const bet = Math.max(0, Number.isFinite(betAmount) ? betAmount : 0);
  return rate * (pot + bet) - (1 - rate) * bet;
}

interface EVVisualizerProps {
  potSize: number;
  betAmount: number;
  winRate: number;
}

export function EVVisualizer({ potSize, betAmount, winRate }: EVVisualizerProps) {
  const { t } = useTranslation();
  const currentEV = useMemo(() => 
    calculateEV(potSize, betAmount, winRate), 
    [potSize, betAmount, winRate]
  );

  // Breakeven point: rate * (pot + bet) - (1 - rate) * bet = 0
  // rate = bet / (pot + 2*bet)
  const breakevenRate = useMemo(() => {
    const denominator = potSize + 2 * betAmount;
    return denominator > 0 ? betAmount / denominator : 0.5;
  }, [potSize, betAmount]);

  // Generate curve data points for chart
  const curveData = useMemo(() => {
    return Array.from({ length: 11 }, (_, i) => {
      const rate = i * 0.1;
      const ev = rate * (potSize + betAmount) - (1 - rate) * betAmount;
      return { winRate: `${Math.round(rate * 100)}%`, ev };
    });
  }, [potSize, betAmount]);

  return (
    <div className="p-4 rounded-lg border border-[var(--brass-deep)]/30">
      <h3 className="font-display text-sm font-semibold mb-3 text-[var(--ivory)]">{t('academy.evVisualizer.chartTitle')}</h3>
      <div className="w-full h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={curveData} margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="winRate" 
              tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--walnut-border)' }}
            />
            <YAxis 
              tickFormatter={(v) => `${v.toFixed(1)}BB`}
              tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--walnut-border)' }}
            />
            <ReferenceLine y={0} stroke="var(--ivory-dim)" strokeWidth={1} />
            <ReferenceLine 
              x={breakevenRate} 
              stroke="var(--brass-bright)" 
              strokeWidth={2}
              label={{ value: 'BE', fill: 'var(--brass-bright)', fontSize: 9, position: 'top' }}
            />
            <Line 
              type="monotone" 
              dataKey="ev" 
              stroke="var(--brass-bright)" 
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 pt-3 border-t border-[var(--walnut-border)] text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-[var(--ivory-dim)]">{t('academy.evVisualizer.currentEquityLabel')}</span>
          <span className="font-mono text-[var(--brass)]">{winRate}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[var(--ivory-dim)]">{t('academy.evVisualizer.evLabel')}</span>
          <span className={`font-mono font-bold ${currentEV >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            {currentEV >= 0 ? '+' : ''}{currentEV.toFixed(2)}BB
          </span>
        </div>
        <div className="text-[var(--ivory-dim)] mt-2">
          {t('academy.evVisualizer.breakevenLabel')} <span className="font-mono text-[var(--warning)]">{(breakevenRate * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

interface EVCalculatorProps {
  initialPotSize?: number;
  initialBetAmount?: number;
  initialWinRate?: number;
}

export function EVCalculator({
  initialPotSize = 100,
  initialBetAmount = 50,
  initialWinRate = 30
}: EVCalculatorProps) {
  const { t } = useTranslation();
  const [potSize, setPotSize] = React.useState(initialPotSize);
  const [betAmount, setBetAmount] = React.useState(initialBetAmount);
  const [winRate, setWinRate] = React.useState(initialWinRate);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="space-y-2">
          <label className="text-xs text-[var(--ivory-muted)]">{t('academy.evVisualizer.potLabel')}</label>
          <input
            type="number"
            min={1}
            max={1000}
            value={potSize}
            onChange={(e) => setPotSize(Number(e.target.value))}
            className="w-full bg-[var(--surface)] border border-[var(--walnut-border)] rounded px-3 py-2 text-[var(--ivory)] font-mono focus:border-[var(--brass)] outline-none"
            aria-label={t('academy.evVisualizer.potAria')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--ivory-muted)]">{t('academy.evVisualizer.betLabel')}</label>
          <input
            type="number"
            min={1}
            max={500}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-full bg-[var(--surface)] border border-[var(--walnut-border)] rounded px-3 py-2 text-[var(--ivory)] font-mono focus:border-[var(--brass)] outline-none"
            aria-label={t('academy.evVisualizer.betAria')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-[var(--ivory-muted)]">{t('academy.evVisualizer.equityLabel')}</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={winRate}
            onChange={(e) => setWinRate(Number(e.target.value))}
            className="w-full accent-[var(--brass)]"
            aria-label={t('academy.evVisualizer.equityAria')}
          />
          <div className="text-right font-mono text-[var(--brass)]">{winRate}%</div>
        </div>
      </div>
      <EVVisualizer potSize={potSize} betAmount={betAmount} winRate={winRate} />
    </div>
  );
}


