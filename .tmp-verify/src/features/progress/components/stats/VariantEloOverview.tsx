import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useProgressStore } from '../../store';
import { VARIANT_CONFIG, ALL_VARIANTS } from '@/shared/types/elo';
import { getRankForScore } from '@/shared/utils/elo';

/**
 * 多变体 ELO 进度概览（P2 变体支持，Week 4）
 *
 * 展示三个变体各自的综合分与段位，帮助玩家了解跨变体的能力分布。
 * 数据源：progress store 的 eloByVariant（每变体独立五维 ELO）。
 */
export function VariantEloOverview() {
  const { t } = useTranslation();
  const eloByVariant = useProgressStore((s) => s.eloByVariant);
  const activeVariant = useProgressStore((s) => s.activeVariant);
  const switchActiveVariant = useProgressStore((s) => s.switchActiveVariant);

  return (
    <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-[17px] text-[var(--ivory)] tracking-wide">
          {t('variant.eloOverview')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ALL_VARIANTS.map((variant) => {
            const config = VARIANT_CONFIG[variant];
            const elo = eloByVariant[variant];
            const rank = getRankForScore(elo.overall);
            const isActive = variant === activeVariant;

            return (
              <button
                key={variant}
                type="button"
                onClick={() => switchActiveVariant(variant)}
                className={`rounded-lg border p-3 text-left transition-colors ${
                  isActive
                    ? 'border-[var(--brass-bright)] bg-[var(--walnut-raised)]'
                    : 'border-[var(--walnut)] bg-[var(--walnut)]/40 hover:bg-[var(--walnut-raised)]/60'
                }`}
                aria-pressed={isActive}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{config.icon}</span>
                  <span className="text-sm font-medium text-[var(--ivory)]">
                    {t(`variant.name.${variant}`)}
                  </span>
                </div>
                <div className="font-numeric text-xl text-[var(--brass-bright)]">
                  {elo.overall}
                </div>
                <div className="text-xs text-[var(--ivory-muted)] flex items-center gap-1">
                  <span>{rank.icon}</span>
                  <span>{t(`progress.rank.${rank.name}.name`)}</span>
                  {elo.gamesPlayed > 0 && <span>· {elo.gamesPlayed} {t('variant.gamesPlayed')}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
