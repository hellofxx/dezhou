import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BackLink } from '@/shared/components/layout/BackLink';
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
  const calibratedResult = lastResult?.calibration === 'calibrated';
  const unavailableResult = lastResult?.calibration === 'unavailable';

  const handleStart = () => {
    generateScenarios();
    navigate('/gto-simulator/session/active');
  };

  return (
    <div className="py-4 pb-24 md:pb-4 space-y-5">
      <BackLink to="/drill" label={t('common.ui.back')} variant="text" />
      {/* 标题 */}
      <div className="space-y-1">
        <h2 className="font-display text-[22px] tracking-wide text-[var(--ivory)]">{t('gto.home.title')}</h2>
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
              <span className="text-sm text-[var(--ivory-muted)] ml-2">
                {t(calibratedResult
                  ? 'gto.home.optimalRate'
                  : unavailableResult ? 'gto.home.unavailableRate' : 'gto.home.referenceRate')}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--ivory-muted)] font-numeric">
                {calibratedResult
                  ? t('gto.home.scenariosCount', { count: lastResult.scenarios, ev: lastResult.evLossBB100.toFixed(2) })
                  : unavailableResult
                    ? t('gto.home.scenariosCountUnavailable', { count: lastResult.scenarios })
                    : t('gto.home.scenariosCountReference', { count: lastResult.scenarios })}
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
