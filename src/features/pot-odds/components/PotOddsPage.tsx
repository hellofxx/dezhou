import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Play } from 'lucide-react';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { BackLink } from '@/shared/components/layout/BackLink';
import { Button } from '@/shared/components/ui/button';
import { OddsCalculator } from './OddsCalculator';
import { DrawsReference } from './DrawsReference';
import { useOddsCalculation } from '../hooks/useOddsCalculation';

const LazyEquityChart = lazy(() =>
  import('./EquityChart').then((mod) => ({ default: mod.EquityChart })),
);
const LazyEVCalculator = lazy(() =>
  import('./EVCalculator').then((mod) => ({ default: mod.EVCalculator })),
);

export default function PotOddsPage() {
  const { t } = useTranslation();
  const result = useOddsCalculation();
  const [activeTab, setActiveTab] = useState<'odds' | 'ev'>('odds');

  return (
    <div className="py-4 space-y-5">
      <BackLink to="/drill" label={t('common.ui.back')} variant="text" />
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-[22px] text-[var(--ivory)] tracking-wide">{t('potOdds.page.title')}</h2>
          <p className="text-sm text-[var(--ivory-muted)] mt-1">
            {t('potOdds.page.subtitle')}
          </p>
        </div>
        <Button asChild>
          <Link to="/pot-odds/quiz">
            <Play className="w-4 h-4" aria-hidden="true" />
            {t('potOdds.quiz.start')}
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('odds')}
          className={`pill ${activeTab === 'odds' ? 'active' : ''}`}
        >
          {t('potOdds.page.tabOdds')}
        </button>
        <button
          onClick={() => setActiveTab('ev')}
          className={`pill ${activeTab === 'ev' ? 'active' : ''}`}
        >
          {t('potOdds.page.tabEv')}
        </button>
      </div>

      {/* Tab 1: Pot Odds — §9.4 工具型布局：计算器全宽在上（内部输入|结果双列），
          下方胜率图与补牌参考表并排（调参时同步查阅 outs 对照）。
          P1B-09：EquityChart 数据源为 useOddsCalculation（底池/下注/Outs），属 odds tab */}
      {activeTab === 'odds' && (
        <div className="space-y-6">
          <OddsCalculator />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Suspense fallback={<div className="min-h-[260px]"><ComponentSkeleton /></div>}>
              <LazyEquityChart
                potOdds={result.requiredEquity}
                estimatedEquity={result.estimatedEquity}
              />
            </Suspense>
            <DrawsReference />
          </div>
        </div>
      )}

      {/* Tab 2: EV Analysis */}
      {activeTab === 'ev' && (
        <div className="space-y-6">
          <Suspense fallback={<div className="min-h-[320px]"><ComponentSkeleton /></div>}>
            <LazyEVCalculator />
          </Suspense>
        </div>
      )}
    </div>
  );
}
