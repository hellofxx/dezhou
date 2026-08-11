import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ScenarioSetup } from '../components/ScenarioSetup';
import { SpotTrainer } from '../components/SpotTrainer';
import { useScenarioEngine } from '../hooks/useScenarioEngine';
import { useGTOSimulatorStore } from '../store';

type Tab = 'setup' | 'spot';

export default function GTOSimulatorHome() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('setup');
  const navigate = useNavigate();
  const { generateScenarios } = useScenarioEngine();
  const { lastResult } = useGTOSimulatorStore();

  const handleStart = () => {
    generateScenarios();
    navigate('/gto-simulator/session/active');
  };

  return (
    <div className="py-6 space-y-6">
      {/* 标题 */}
      <div className="space-y-1">
        <p className="section-eyebrow">GTO Simulator</p>
        <h1 className="font-display text-[28px] tracking-wide text-[var(--ivory)]">{t('gto.home.title')}</h1>
        <p className="text-sm text-[var(--ivory-muted)]">
          {t('gto.home.subtitle')}
        </p>
      </div>

      {/* 标签页 — setup=brass, spot=sage */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('setup')}
          className={`pill flex-1 ${tab === 'setup' ? 'active' : ''}`}
        >
          {t('gto.home.tabSetup')}
        </button>
        <button
          onClick={() => setTab('spot')}
          className={`pill flex-1 ${tab === 'spot' ? 'active' : ''}`}
        >
          {t('gto.home.tabSpot')}
        </button>
      </div>

      {/* 内容 */}
      {tab === 'setup' && <ScenarioSetup onStart={handleStart} />}
      {tab === 'spot' && <SpotTrainer onClose={() => setTab('setup')} />}

      {/* 上次训练结果摘要 */}
      {lastResult && tab === 'setup' && (
        <div className="panel panel-live space-y-2">
          <div className="panel-title">{t('gto.home.lastTraining')}</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold font-numeric text-[var(--brass-bright)]">
                {Math.round(lastResult.accuracy * 100)}%
              </span>
              <span className="text-sm text-[var(--ivory-muted)] ml-2">{t('gto.home.optimalRate')}</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--ivory-muted)] font-numeric">
                {t('gto.home.scenariosCount', { count: lastResult.scenarios, ev: lastResult.evLossBB100.toFixed(2) })}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/gto-simulator/result/${lastResult.sessionId}`)}
            className="text-xs text-[var(--brass-bright)] hover:underline font-numeric"
          >
            {t('gto.home.viewFullResult')}
          </button>
        </div>
      )}
    </div>
  );
}
