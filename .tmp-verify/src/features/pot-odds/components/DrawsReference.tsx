import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { COMMON_DRAWS } from '../constants';
import { usePotOddsStore } from '../store';

export function DrawsReference() {
  const { t } = useTranslation();
  const setOuts = usePotOddsStore((s) => s.setOuts);
  const currentOuts = usePotOddsStore((s) => s.oddsState.outs);

  return (
    <Card className="bg-[var(--surface)] border-[var(--walnut-border)]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('potOdds.draws.title')}</CardTitle>
        <p className="text-xs text-[var(--ivory-dim)]">{t('potOdds.draws.subtitle')}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {COMMON_DRAWS.map((draw) => (
            <button
              key={draw.name}
              onClick={() => setOuts(draw.outs)}
              className={`flex items-start gap-3 p-3 rounded-lg text-left transition-all ${
                currentOuts === draw.outs
                  ? 'bg-[var(--brass)]/10 border border-[var(--brass)]/30'
                  : 'bg-[var(--walnut-border)]/30 border border-transparent hover:bg-[var(--walnut-border)] hover:border-[var(--walnut-border)]'
              }`}
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[var(--brass)]/10 flex items-center justify-center">
                <span className="font-mono font-bold text-sm text-[var(--brass)]">{draw.outs}</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[var(--ivory)] truncate">{t(draw.name)}</p>
                <p className="text-xs text-[var(--ivory-dim)] mt-0.5">{t(draw.description)}</p>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
