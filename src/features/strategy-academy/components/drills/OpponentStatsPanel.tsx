// P2-1.8: OpponentStatsPanel — 对手数据面板
// 展示 VPIP/PFR/AF 等统计数据与最近行为，供 OpponentDrill 复用

import { useTranslation } from 'react-i18next';
import type { OpponentDrillQuestion } from '../../data/opponentProfiles';
import type { OpponentStats } from '../../types';

const STAT_ITEMS: { key: keyof OpponentStats; label: string }[] = [
  { key: 'vpip', label: 'VPIP' },
  { key: 'pfr', label: 'PFR' },
  { key: 'af', label: 'AF' },
  { key: 'threeBetPercent', label: '3-Bet' },
  { key: 'foldToCBet', label: 'Fold vs CBet' },
  { key: 'cbetFrequency', label: 'CBet' },
];

function formatStat(key: keyof OpponentStats, value: number): string {
  return key === 'af' ? value.toFixed(1) : `${value}%`;
}

interface OpponentStatsPanelProps {
  question: OpponentDrillQuestion;
}

export function OpponentStatsPanel({ question }: OpponentStatsPanelProps) {
  const { t } = useTranslation();
  return (
    <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-[var(--ivory)] font-medium">{question.scenario}</p>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--walnut-raised)] text-[var(--ivory-muted)] shrink-0">
          {t('drills.opponent.sampleSize', { count: question.sampleSize })}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {STAT_ITEMS.map(({ key, label }) => (
          <div key={key} className="rounded-md bg-[var(--walnut-raised)] px-2 py-2 text-center">
            <p className="font-numeric text-lg text-[var(--brass-bright)]">
              {formatStat(key, question.stats[key])}
            </p>
            <p className="text-[10px] text-[var(--ivory-muted)] mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      <div>
        <p className="text-[11px] text-[var(--ivory-muted)] mb-1">
          {t('drills.opponent.recentActions')}
        </p>
        <ul className="space-y-0.5">
          {question.recentActions.map((action) => (
            <li key={action} className="text-xs text-[var(--ivory-dim)] leading-relaxed">
              · {action}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
