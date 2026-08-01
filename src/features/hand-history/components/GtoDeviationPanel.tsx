import { useEffect, useState } from 'react';
import type { HandHistory } from '../types';
import {
  analyzeHandDeviations,
  getDeviationSummary,
  getCachedDeviation,
  type DeviationResult,
  type DeviationSummary,
} from '../utils/gtoDeviation';
import { Target, TrendingDown, CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

interface GtoDeviationPanelProps {
  hand: HandHistory;
  heroName: string;
}

const GRADE_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  best:          { label: '最优',   color: 'text-[var(--sage)]',         icon: CheckCircle2 },
  correct:       { label: '正确',   color: 'text-[var(--sage)]',         icon: CheckCircle2 },
  inaccuracy:    { label: '小偏差', color: 'text-[var(--brass-bright)]', icon: AlertTriangle },
  wrong:         { label: '错误',   color: 'text-[var(--clay)]',         icon: AlertTriangle },
  blunder:       { label: '严重失误', color: 'text-[var(--poker-danger)]', icon: XCircle },
};

const DEFAULT_GRADE = GRADE_CONFIG.best!;

function StatBox({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-lg bg-[var(--walnut-raised)]/40 border border-[var(--walnut-border)]">
      <span className={`text-sm font-bold font-numeric ${accent ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory)]'}`}>
        {value}
      </span>
      <span className="text-[10px] text-[var(--ivory-muted)] font-display tracking-wide mt-0.5">{label}</span>
    </div>
  );
}

export function GtoDeviationPanel({ hand, heroName }: GtoDeviationPanelProps) {
  const [result, setResult] = useState<DeviationResult | null>(null);
  const [summary, setSummary] = useState<DeviationSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  useEffect(() => {
    // Check cache first
    const cached = getCachedDeviation(hand.id);
    if (cached) {
      setResult(cached);
      setSummary(getDeviationSummary(cached));
      return;
    }

    let cancelled = false;
    setLoading(true);

    analyzeHandDeviations([hand], heroName, (completed, total) => {
      if (!cancelled) setProgress({ completed, total });
    }).then((results) => {
      if (cancelled) return;
      const r = results.find(x => x.handId === hand.id);
      if (r) {
        setResult(r);
        setSummary(getDeviationSummary(r));
      }
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [hand, heroName]);

  if (loading) {
    return (
      <div className="p-3 rounded-xl border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/20">
        <div className="flex items-center gap-2 text-xs text-[var(--ivory-muted)]">
          <Loader2 size={13} className="animate-spin" />
          <span>GTO 分析中{progress.total > 0 ? ` (${progress.completed}/${progress.total})` : '...'}</span>
        </div>
      </div>
    );
  }

  if (!result || !summary) return null;

  const { totalDecisions, optimalCount, averageEvLoss, worstDecision } = summary;
  const optimalPct = totalDecisions > 0 ? Math.round((optimalCount / totalDecisions) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Target size={14} className="text-[var(--brass-bright)]" />
        <span className="text-xs font-display font-semibold text-[var(--ivory-dim)] tracking-wide">GTO 偏差分析</span>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox label="决策数" value={totalDecisions} />
        <StatBox label="最优率" value={`${optimalPct}%`} accent={optimalPct >= 70} />
        <StatBox label="平均EV损失" value={`${averageEvLoss}BB`} />
        <StatBox
          label="最差决策"
          value={worstDecision ? `${worstDecision.evLoss}BB` : '—'}
        />
      </div>

      {/* Decision list */}
      {result.deviations.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)] font-display font-semibold">
            逐街对比
          </span>
          {result.deviations.map((d, i) => {
            const cfg = GRADE_CONFIG[d.grade] ?? DEFAULT_GRADE;
            const Icon = cfg.icon;
            return (
              <div
                key={i}
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--walnut-raised)]/30 border border-[var(--walnut-border)]/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Icon size={12} className={cfg.color} />
                  <span className="text-[var(--ivory-dim)] capitalize">{d.street}</span>
                  <span className="text-[var(--ivory-muted)]">你: {d.action}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--ivory-muted)]">GTO: <span className="text-[var(--ivory-dim)]">{d.gtoAction}</span></span>
                  {d.evLoss > 0 && (
                    <span className={`font-numeric font-semibold ${cfg.color}`}>
                      -{d.evLoss}BB
                    </span>
                  )}
                  <span className={`text-[10px] ${cfg.color}`}>{cfg.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall assessment */}
      {averageEvLoss > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-[var(--clay)]/8 border border-[var(--clay)]/20 text-xs text-[var(--ivory-dim)]">
          <TrendingDown size={13} className="text-[var(--clay)] shrink-0" />
          <span>
            平均每手损失 <span className="font-numeric font-semibold text-[var(--clay)]">{averageEvLoss}BB</span>
            {worstDecision && (
              <>，最差决策出现在 <span className="font-display font-semibold">{worstDecision.street}</span></>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
