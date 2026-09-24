import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Gauge, Flame, Timer } from 'lucide-react';
import { useProgressStore } from '../../store';
import { getRankForScore } from '@/shared/utils/elo';
import type { StatsSummary } from '../../types';

interface ProgressHeroProps {
  summary: StatsSummary;
}

/**
 * 战绩牌匾 Hero（进度统计页签名元素）
 * 象牙段位牌匾（casino-plaque 放大版）+ 四项核心指标 plaque，
 * 让训练者一眼看清「我是谁（段位）、我做了什么（指标）」。
 */
export default function ProgressHero({ summary }: ProgressHeroProps) {
  const { t } = useTranslation();
  const elo = useProgressStore((s) => s.eloByVariant[s.activeVariant]);
  const rank = useMemo(() => getRankForScore(elo.overall), [elo.overall]);
  const hasEloData = elo.gamesPlayed > 0;

  return (
    <section className="rank-plaque-hero" aria-label={t('progress.hero.ariaLabel')}>
      <div className="rp-eyebrow">{t('progress.hero.eyebrow')}</div>
      <div className="rp-body">
        <div className="rp-plaque">
          <span className="rp-plaque-icon" aria-hidden>{rank.icon}</span>
          <span className="rp-plaque-name">{t(`progress.rank.${rank.name}.name`)}</span>
          <span className="rp-plaque-score">{hasEloData ? elo.overall : '—'}</span>
          <span className="rp-plaque-label">{t('progress.hero.eloScore')}</span>
        </div>
        <div className="rp-metrics">
          <RpMetric
            icon={<Target className="w-4 h-4" />}
            label={t('progress.hero.totalSessions')}
            value={String(summary.totalSessions)}
          />
          <RpMetric
            accent
            icon={<Gauge className="w-4 h-4" />}
            label={t('progress.hero.accuracy')}
            value={`${(summary.overallAccuracy * 100).toFixed(1)}%`}
          />
          <RpMetric
            accent
            icon={<Flame className="w-4 h-4" />}
            label={t('progress.hero.streak')}
            value={String(summary.currentStreak)}
          />
          <RpMetric
            icon={<Timer className="w-4 h-4" />}
            label={t('progress.hero.avgTime')}
            value={`${(summary.averageTime / 1000).toFixed(1)}s`}
          />
        </div>
      </div>
      <div className="rp-foot">
        <span>
          {t('progress.hero.basedOn', { games: elo.gamesPlayed })}
        </span>
        {hasEloData && <span className="rp-rank-desc">{t(`progress.rank.${rank.name}.description`)}</span>}
      </div>
    </section>
  );
}

function RpMetric({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={`rp-metric${accent ? ' accent' : ''}`}>
      <div className="rp-metric-icon">{icon}</div>
      <div className="rp-metric-text">
        <span className="rp-metric-value">{value}</span>
        <span className="rp-metric-label">{label}</span>
      </div>
    </div>
  );
}
