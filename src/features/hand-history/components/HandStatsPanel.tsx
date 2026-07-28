import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { HeroStats } from '../utils/handStats';
import { TrendingUp, AlertTriangle } from 'lucide-react';

interface HandStatsPanelProps {
  stats: HeroStats;
}

// Standard VPIP/PFR ranges by position (6-max)
const STANDARD_RANGES: Record<string, { vpip: [number, number]; pfr: [number, number] }> = {
  UTG: { vpip: [15, 19], pfr: [12, 16] },
  HJ: { vpip: [19, 24], pfr: [16, 20] },
  CO: { vpip: [24, 30], pfr: [20, 26] },
  BTN: { vpip: [35, 45], pfr: [28, 38] },
  SB: { vpip: [30, 40], pfr: [24, 32] },
  BB: { vpip: [40, 55], pfr: [10, 16] },
};

function StatCard({ label, value, suffix = '%' }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)]">
      <span className="text-lg font-bold font-numeric text-[var(--brass-bright)]">
        {value}{suffix}
      </span>
      <span className="text-[10px] text-[var(--ivory-muted)] font-display tracking-wide mt-0.5">
        {label}
      </span>
    </div>
  );
}

function getPositionFeedback(position: string, vpip: number): string | null {
  const range = STANDARD_RANGES[position];
  if (!range) return null;
  if (vpip < range.vpip[0]) {
    return `偏低，建议 ${range.vpip[0]}-${range.vpip[1]}%`;
  }
  if (vpip > range.vpip[1]) {
    return `偏高，建议 ${range.vpip[0]}-${range.vpip[1]}%`;
  }
  return null;
}

export function HandStatsPanel({ stats }: HandStatsPanelProps) {
  const chartData = useMemo(() => {
    const positionOrder = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'];
    return positionOrder
      .filter(pos => stats.byPosition[pos])
      .map(pos => ({
        position: pos,
        VPIP: stats.byPosition[pos]!.vpip,
        PFR: stats.byPosition[pos]!.pfr,
        hands: stats.byPosition[pos]!.hands,
      }));
  }, [stats.byPosition]);

  const feedbacks = useMemo(() => {
    const items: { position: string; message: string }[] = [];
    for (const [pos, data] of Object.entries(stats.byPosition)) {
      const feedback = getPositionFeedback(pos, data.vpip);
      if (feedback) {
        items.push({ position: pos, message: `你的 ${pos} VPIP ${data.vpip}% ${feedback}` });
      }
    }
    return items;
  }, [stats.byPosition]);

  return (
    <div className="space-y-6">
      {/* Core metrics */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="VPIP" value={stats.vpip} />
        <StatCard label="PFR" value={stats.pfr} />
        <StatCard label="3-Bet%" value={stats.threeBetPercent} />
        <StatCard label="AFq" value={stats.afq} />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="C-Bet%" value={stats.cbetFrequency} />
        <StatCard label="WTSD" value={stats.wtsd} />
        <StatCard label="W$SD" value={stats.wsd} />
      </div>

      {/* Position chart */}
      {chartData.length > 0 && (
        <div className="p-4 rounded-xl bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]">
          <h3 className="text-xs font-display font-semibold text-[var(--ivory-dim)] mb-3 tracking-wide">
            VPIP / PFR by Position
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <XAxis
                dataKey="position"
                tick={{ fill: 'var(--ivory-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--walnut-border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--ivory-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, 60]}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--felt)',
                  border: '1px solid var(--walnut-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: 'var(--ivory)',
                }}
                labelStyle={{ color: 'var(--ivory-dim)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', color: 'var(--ivory-muted)' }}
              />
              <Bar dataKey="VPIP" fill="var(--brass)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="PFR" fill="var(--sage)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Position table */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-[var(--walnut-border)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[var(--walnut-raised)]/40">
                <th className="px-3 py-2 text-left font-display font-semibold text-[var(--ivory-dim)]">Position</th>
                <th className="px-3 py-2 text-center font-display font-semibold text-[var(--ivory-dim)]">Hands</th>
                <th className="px-3 py-2 text-center font-display font-semibold text-[var(--ivory-dim)]">VPIP</th>
                <th className="px-3 py-2 text-center font-display font-semibold text-[var(--ivory-dim)]">PFR</th>
              </tr>
            </thead>
            <tbody>
              {chartData.map(row => (
                <tr key={row.position} className="border-t border-[var(--walnut-border)]/50">
                  <td className="px-3 py-2 font-numeric text-[var(--ivory)]">{row.position}</td>
                  <td className="px-3 py-2 text-center font-numeric text-[var(--ivory-muted)]">{row.hands}</td>
                  <td className="px-3 py-2 text-center font-numeric text-[var(--brass-bright)]">{row.VPIP}%</td>
                  <td className="px-3 py-2 text-center font-numeric text-[var(--sage)]">{row.PFR}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback */}
      {feedbacks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-display font-semibold text-[var(--ivory-dim)] tracking-wide flex items-center gap-1.5">
            <TrendingUp size={13} />
            建议
          </h3>
          {feedbacks.map((fb, i) => (
            <div
              key={i}
              className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--clay)]/10 border border-[var(--clay)]/20 text-xs text-[var(--ivory-dim)]"
            >
              <AlertTriangle size={13} className="text-[var(--clay)] mt-0.5 shrink-0" />
              <span>{fb.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Total hands info */}
      <p className="text-[10px] text-[var(--ivory-muted)] font-numeric text-center">
        Based on {stats.totalHands} hands analyzed
      </p>
    </div>
  );
}
