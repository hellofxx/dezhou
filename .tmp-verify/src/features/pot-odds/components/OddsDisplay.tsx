import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionFast } from '@/shared/utils/motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { formatPercentage } from '@/shared/utils/formatters';

interface OddsDisplayProps {
  potOdds: number;
  requiredEquity: number;
  estimatedEquity: number;
  isProfitable: boolean;
  ev: number;
}

function AnimatedNumber({ value, suffix = '%' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      // ODDS-07：用原始值作 key（而非 toFixed(1)），避免精度内的数值变化不触发重挂载动画
      key={value}
      initial={{ opacity: 0.5, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionFast}
      className="font-mono"
    >
      {value.toFixed(1)}{suffix}
    </motion.span>
  );
}

export function OddsDisplay({ potOdds, requiredEquity, estimatedEquity, isProfitable, ev }: OddsDisplayProps) {
  const { t } = useTranslation();
  const marginOfSafety = estimatedEquity - requiredEquity;

  return (
    <div className="space-y-4">
      {/* Main odds display */}
      <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-[var(--ivory-muted)] font-normal">{t('potOdds.oddsDisplay.title')}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className={`text-5xl font-bold ${isProfitable ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
            <AnimatedNumber value={potOdds} />
          </div>
          <p className="mt-2 text-xs text-[var(--ivory-dim)]">
            {t('potOdds.oddsDisplay.needEquity', { equity: formatPercentage(requiredEquity) })}
          </p>
        </CardContent>
      </Card>

      {/* Details grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">{t('potOdds.oddsDisplay.requiredEquity')}</p>
            <p className="text-xl font-bold text-[var(--warning)] font-mono">
              <AnimatedNumber value={requiredEquity} />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">{t('potOdds.oddsDisplay.estimatedEquity')}</p>
            <p className="text-xl font-bold text-[var(--info)] font-mono">
              <AnimatedNumber value={estimatedEquity} />
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">{t('potOdds.oddsDisplay.evLabel')}</p>
            <p className={`text-xl font-bold font-mono ${ev >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {ev >= 0 ? '+' : ''}{ev.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
          <CardContent className="p-4">
            <p className="text-xs text-[var(--ivory-dim)] mb-1">{t('potOdds.oddsDisplay.margin')}</p>
            <p className={`text-xl font-bold font-mono ${marginOfSafety >= 0 ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {marginOfSafety >= 0 ? '+' : ''}{marginOfSafety.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Call recommendation */}
      <Card className={`${isProfitable ? 'border-[var(--success)]/30 bg-[var(--success)]/5' : 'border-[var(--danger)]/30 bg-[var(--danger)]/5'}`}>
        <CardContent className="p-4 flex items-center gap-3">
          {isProfitable ? (
            <>
              <CheckCircle className="w-8 h-8 text-[var(--success)] shrink-0" />
              <div>
                <p className="font-semibold text-[var(--success)]">{t('potOdds.oddsDisplay.callTitle')}</p>
                <p className="text-sm text-[var(--ivory-muted)]">
                  {t('potOdds.oddsDisplay.callDesc', {
                    est: formatPercentage(estimatedEquity),
                    req: formatPercentage(requiredEquity),
                  })}
                </p>
              </div>
            </>
          ) : (
            <>
              <XCircle className="w-8 h-8 text-[var(--danger)] shrink-0" />
              <div>
                <p className="font-semibold text-[var(--danger)]">{t('potOdds.oddsDisplay.foldTitle')}</p>
                <p className="text-sm text-[var(--ivory-muted)]">
                  {t('potOdds.oddsDisplay.foldDesc', {
                    est: formatPercentage(estimatedEquity),
                    req: formatPercentage(requiredEquity),
                  })}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
