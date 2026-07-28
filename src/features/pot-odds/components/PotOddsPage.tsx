import { useState } from 'react';
import { OddsCalculator } from './OddsCalculator';
import { EVCalculator } from './EVCalculator';
import { DrawsReference } from './DrawsReference';
import { EquityChart } from './EquityChart';
import { useOddsCalculation } from '../hooks/useOddsCalculation';

export default function PotOddsPage() {
  const result = useOddsCalculation();
  const [activeTab, setActiveTab] = useState<'odds' | 'ev'>('odds');

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div>
        <p className="section-eyebrow">Pot Odds & EV</p>
        <h1 className="font-display text-[28px] text-[var(--ivory)] tracking-wide">底池赔率与 EV 计算器</h1>
        <p className="text-sm text-[var(--ivory-muted)] mt-1">
          计算底池赔率、估算胜率、分析期望值，帮助你做出更好的跟注决策
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('odds')}
          className={`pill ${activeTab === 'odds' ? 'active' : ''}`}
        >
          底池赔率
        </button>
        <button
          onClick={() => setActiveTab('ev')}
          className={`pill ${activeTab === 'ev' ? 'active' : ''}`}
        >
          EV 分析
        </button>
      </div>

      {/* Tab 1: Pot Odds */}
      {activeTab === 'odds' && (
        <div className="space-y-6">
          <OddsCalculator />
          <DrawsReference />
        </div>
      )}

      {/* Tab 2: EV Analysis */}
      {activeTab === 'ev' && (
        <div className="space-y-6">
          <EVCalculator />
          <div className="max-w-lg">
            <EquityChart potOdds={result.requiredEquity} estimatedEquity={result.estimatedEquity} />
          </div>
        </div>
      )}
    </div>
  );
}
