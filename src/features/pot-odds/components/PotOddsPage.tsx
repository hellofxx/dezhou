import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OddsCalculator } from './OddsCalculator';
import { EVCalculator } from './EVCalculator';
import { DrawsReference } from './DrawsReference';
import { EquityChart } from './EquityChart';
import { useOddsCalculation } from '../hooks/useOddsCalculation';

export default function PotOddsPage() {
  const { t } = useTranslation();
  const result = useOddsCalculation();
  const [activeTab, setActiveTab] = useState<'odds' | 'ev'>('odds');

  return (
    <div className="py-6 space-y-6">
      {/* Page header */}
      <div>
        <p className="section-eyebrow">Pot Odds & EV</p>
        <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">{t('potOdds.page.title')}</h1>
        <p className="text-sm text-[var(--ivory-muted)] mt-1">
          {t('potOdds.page.subtitle')}
        </p>
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
            <EquityChart potOdds={result.requiredEquity} estimatedEquity={result.estimatedEquity} />
            <DrawsReference />
          </div>
        </div>
      )}

      {/* Tab 2: EV Analysis */}
      {activeTab === 'ev' && (
        <div className="space-y-6">
          <EVCalculator />
        </div>
      )}
    </div>
  );
}
