import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Target, Clock, TrendingDown, AlertTriangle } from 'lucide-react';
import { useGTOSimulatorStore } from '../store';
import { StrategyMatrix } from './StrategyMatrix';
import { useGTOComparison } from '../hooks/useGTOComparison';
import { PositionBadge } from '@/shared/components/PositionBadge';
import { ResultSummary } from '@/shared/components/ResultSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';

export default function GTOResultPage() {
  const navigate = useNavigate();
  const { lastResult, config } = useGTOSimulatorStore();
  const { allStrategies } = useGTOComparison(null, config.position);

  if (!lastResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-[var(--ivory-muted)] mb-4">没有结果数据</div>
        <button
          onClick={() => navigate('/gto-simulator')}
          className="px-4 py-2 rounded-md bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-medium font-display"
        >
          返回主页
        </button>
      </div>
    );
  }

  const timeSeconds = Math.round(lastResult.totalTime / 1000);
  const avgTimePerDecision = Math.round(timeSeconds / lastResult.scenarios);

  return (
    <ResultSummary
      title="训练完成！"
      subtitle={`${lastResult.scenarios} 个场景 · ${config.position} · ${config.effectiveStack}BB`}
      accuracy={lastResult.accuracy}
      stats={[
        { icon: <Target className="w-4 h-4" />, label: '总场景数', value: `${lastResult.scenarios}` },
        { icon: <span className="text-[var(--sage)] text-sm font-bold">✓</span>, label: '最优决策', value: `${lastResult.optimalDecisions}` },
        { icon: <span className="text-[var(--clay)] text-sm font-bold">✗</span>, label: '非最优', value: `${lastResult.scenarios - lastResult.optimalDecisions}` },
        { icon: <Clock className="w-4 h-4" />, label: '平均用时', value: `${avgTimePerDecision}s` },
      ]}
      onRetry={() => navigate('/gto-simulator')}
      onBack={() => navigate('/gto-simulator')}
      retryLabel="再练一次"
      backLabel="返回首页"
    >
      {/* EV Loss highlight */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 p-3 rounded-md bg-[var(--felt)] border border-[var(--walnut-border)]"
      >
        <TrendingDown className="w-4 h-4 text-[var(--brass-bright)]" />
        <span className="text-sm text-[var(--ivory-dim)]">平均 EV 损失：</span>
        <span className="font-bold font-numeric text-[var(--brass-bright)]">{lastResult.averageEVLoss.toFixed(1)} BB</span>
      </motion.div>

      {/* Worst spots */}
      {lastResult.worstSpots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          <Card className="bg-[var(--felt)] border-[var(--walnut-border)]">
            <CardHeader className="pb-2">
              <CardTitle className="font-display text-[17px] text-[var(--ivory)] flex items-center gap-2 tracking-wide">
                <AlertTriangle className="w-4 h-4 text-[var(--brass-bright)]" />
                最需要改进的 Spots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {lastResult.worstSpots.map((spot, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-md bg-[var(--clay)]/8 border border-[var(--clay)]/25"
                  >
                    <div className="flex items-center gap-2">
                      <PositionBadge position={spot.scenario.position} />
                      <span className="text-sm text-[var(--ivory)]">{spot.scenario.name}</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--clay)] font-numeric">
                      -{spot.evLoss.toFixed(2)} BB
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Strategy matrix review */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="space-y-3"
      >
        <h2 className="font-display text-sm font-semibold text-[var(--ivory-dim)] tracking-wide">
          {config.position} GTO 策略矩阵
        </h2>
        <StrategyMatrix strategies={allStrategies} />
      </motion.div>
    </ResultSummary>
  );
}
