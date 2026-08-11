import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Target, Clock, TrendingDown, AlertTriangle } from 'lucide-react';
import { useGTOSimulatorStore } from '../store';
import { StrategyMatrix } from './StrategyMatrix';
import { resolveSpotKey, getStrategiesForSpot } from '../utils/spotKey';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { ResultSummary } from '@/shared/components/feedback/ResultSummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { MOTION_DURATION } from '@/shared/utils/motion';

export default function GTOResultPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lastResult, config, session } = useGTOSimulatorStore();

  // P1C-14: 按会话实际 spotKey 展示矩阵（不再固定 pos_open）
  const sessionSpotKey = (() => {
    if (!session) return resolveSpotKey(config.position);
    const preflops = session.scenarios.filter((s) => s.street === 'preflop');
    if (preflops.length === 0) return resolveSpotKey(config.position);
    // 取频率最高的 spotKey
    const freq = new Map<string, number>();
    for (const s of preflops) {
      const k = resolveSpotKey(s.position, s.previousActions);
      if (k) freq.set(k, (freq.get(k) ?? 0) + 1);
    }
    let best: string | null = null; let max = 0;
    for (const [k, v] of freq) { if (v > max) { max = v; best = k; } }
    return best;
  })();
  const allStrategies = getStrategiesForSpot(sessionSpotKey);

  if (!lastResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-[var(--ivory-muted)] mb-4">{t('gto.result.noData')}</div>
        <button
          onClick={() => navigate('/gto-simulator')}
          className="px-4 py-2 rounded-md bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-medium font-display"
        >
          {t('gto.session.backHome')}
        </button>
      </div>
    );
  }

  const timeSeconds = Math.round(lastResult.totalTime / 1000);
  // P1C-24: 除零防御
  const avgTimePerDecision = Math.round(timeSeconds / (lastResult.scenarios || 1));

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
        transition={{ duration: MOTION_DURATION.fast, delay: 0.8 }}
        className="flex items-center justify-center gap-2 p-3 rounded-md bg-[var(--felt)] border border-[var(--walnut-border)]"
      >
        <TrendingDown className="w-4 h-4 text-[var(--brass-bright)]" />
        <span className="text-sm text-[var(--ivory-dim)]">EV 损失率：</span>
        <span className="font-bold font-numeric text-[var(--brass-bright)]">{lastResult.evLossBB100.toFixed(1)} BB/100</span>
      </motion.div>

      {/* Worst spots */}
      {lastResult.worstSpots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION_DURATION.fast, delay: 0.9 }}
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
        transition={{ duration: MOTION_DURATION.fast, delay: 1 }}
        className="space-y-3"
      >
        <h2 className="font-display text-sm font-semibold text-[var(--ivory-dim)] tracking-wide">
          {sessionSpotKey ? `${config.position} GTO 策略矩阵 (${sessionSpotKey})` : `${config.position} GTO 策略矩阵`}
        </h2>
        {allStrategies ? (
          <StrategyMatrix strategies={allStrategies} />
        ) : (
          <div className="p-4 text-center text-sm text-[var(--ivory-muted)] border border-dashed border-[var(--walnut-border)] rounded-lg">
            该 spot 无 GTO 数据
          </div>
        )}
      </motion.div>
    </ResultSummary>
  );
}
