import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScenarioSetup } from '../components/ScenarioSetup';
import { SpotTrainer } from '../components/SpotTrainer';
import { useScenarioEngine } from '../hooks/useScenarioEngine';
import { useGTOSimulatorStore } from '../store';

type Tab = 'setup' | 'spot';

export default function GTOSimulatorHome() {
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
        <h1 className="font-display text-[28px] tracking-wide text-[var(--ivory)]">GTO 决策模拟器</h1>
        <p className="text-sm text-[var(--ivory-muted)]">
          学习博弈论最优策略，提升你的扑克决策能力
        </p>
      </div>

      {/* 标签页 — setup=brass, spot=sage */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('setup')}
          className={`pill flex-1 ${tab === 'setup' ? 'active' : ''}`}
        >
          场景训练
        </button>
        <button
          onClick={() => setTab('spot')}
          className={`pill flex-1 ${tab === 'spot' ? 'active' : ''}`}
        >
          Spot 练习
        </button>
      </div>

      {/* 内容 */}
      {tab === 'setup' && <ScenarioSetup onStart={handleStart} />}
      {tab === 'spot' && <SpotTrainer onClose={() => setTab('setup')} />}

      {/* 上次训练结果摘要 */}
      {lastResult && tab === 'setup' && (
        <div className="panel panel-live space-y-2">
          <div className="panel-title">上次训练</div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold font-numeric text-[var(--brass-bright)]">
                {Math.round(lastResult.accuracy * 100)}%
              </span>
              <span className="text-sm text-[var(--ivory-muted)] ml-2">最优决策率</span>
            </div>
            <div className="text-right">
              <div className="text-sm text-[var(--ivory-muted)] font-numeric">
                {lastResult.scenarios} 个场景 · EV 损失率 {lastResult.evLossBB100.toFixed(2)} BB/100
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/gto-simulator/result/${lastResult.sessionId}`)}
            className="text-xs text-[var(--brass-bright)] hover:underline font-numeric"
          >
            查看完整结果 →
          </button>
        </div>
      )}
    </div>
  );
}
