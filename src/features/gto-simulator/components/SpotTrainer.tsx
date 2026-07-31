import { useState } from 'react';
import { Position, getPositionsForPlayerCount } from '@/shared/types/position';
import type { HandNotation } from '@/shared/types/poker';
import { StrategyMatrix } from './StrategyMatrix';
import { useGTOComparison } from '../hooks/useGTOComparison';
import { cn } from '@/shared/utils';

interface SpotTrainerProps {
  onClose: () => void;
}

export function SpotTrainer({ onClose }: SpotTrainerProps) {
  const [selectedPosition, setSelectedPosition] = useState<Position>(Position.BTN);
  const [selectedHand, setSelectedHand] = useState<HandNotation | null>(null);
  // P1C-15: BB 无 open 场景，剩余 GTO 表仅有 bb_vs_X_open，从位置选择中剔除 BB
  const positions = getPositionsForPlayerCount(6).filter((p) => p !== Position.BB);

  const { allStrategies } = useGTOComparison(null, selectedPosition);

  // 获取选中手牌的策略
  const selectedStrategy = selectedHand && allStrategies ? allStrategies[selectedHand] : null;

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-wide text-[var(--ivory)]">Spot 练习</h2>
        <button
          onClick={onClose}
          className="text-sm text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors"
        >
          ← 返回
        </button>
      </div>

      {/* 位置选择 */}
      <div className="space-y-2">
        <label className="text-sm font-display font-semibold text-[var(--ivory-dim)] tracking-wide">选择位置查看 GTO 策略</label>
        <div className="flex gap-2 flex-wrap">
          {positions.map((pos) => (
            <button
              key={pos}
              onClick={() => { setSelectedPosition(pos); setSelectedHand(null); }}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-display font-semibold transition-all',
                selectedPosition === pos
                  ? 'bg-[var(--brass)] text-[var(--primary-foreground)]'
                  : 'bg-[var(--walnut-raised)]/50 text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]'
              )}
            >
              {pos}
            </button>
          ))}
        </div>
      </div>

      {/* 策略矩阵 */}
      <StrategyMatrix
        strategies={allStrategies}
        highlightedHand={selectedHand}
        onCellHover={() => {}}
        onCellClick={(hand) => setSelectedHand(hand === selectedHand ? null : hand)}
      />

      {/* 选中的手牌详情 */}
      {selectedHand && selectedStrategy && (
        <div className="p-4 rounded-md bg-[var(--felt)] border border-[var(--walnut-border)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display text-lg font-semibold text-[var(--ivory)] tracking-wide">{selectedHand}</span>
            <span className="text-xs text-[var(--ivory-muted)] font-numeric">{selectedPosition} Open</span>
          </div>

          {/* 频率条 — same action colors as the matrix */}
          <div className="flex h-8 rounded overflow-hidden">
            {selectedStrategy.raise > 0 && (
              <div
                className="bg-[var(--brass)] flex items-center justify-center text-xs font-bold text-[var(--primary-foreground)] font-numeric"
                style={{ width: `${selectedStrategy.raise * 100}%` }}
              >
                R {Math.round(selectedStrategy.raise * 100)}%
              </div>
            )}
            {selectedStrategy.call > 0 && (
              <div
                className="bg-[var(--sage)] flex items-center justify-center text-xs font-bold text-[var(--ivory)] font-numeric"
                style={{ width: `${selectedStrategy.call * 100}%` }}
              >
                C {Math.round(selectedStrategy.call * 100)}%
              </div>
            )}
            {selectedStrategy.fold > 0 && (
              <div
                className="bg-[var(--danger)]/70 flex items-center justify-center text-xs font-bold text-[var(--ivory)] font-numeric"
                style={{ width: `${selectedStrategy.fold * 100}%` }}
              >
                F {Math.round(selectedStrategy.fold * 100)}%
              </div>
            )}
          </div>

          {selectedStrategy.raiseAmount && (
            <div className="text-sm text-[var(--ivory-dim)]">
              加注大小: <span className="text-[var(--brass-bright)] font-bold font-numeric">{selectedStrategy.raiseAmount} BB</span>
            </div>
          )}

          <div className="text-xs text-[var(--ivory-muted)]">
            {selectedStrategy.raise >= 0.95 && '纯 Raise - 这是一个必须加注的手牌'}
            {selectedStrategy.raise > 0 && selectedStrategy.raise < 0.95 && selectedStrategy.fold > 0 && '混合策略 - GTO 建议随机化'}
            {selectedStrategy.fold >= 0.95 && '纯 Fold - 这手牌太弱，应该弃牌'}
            {selectedStrategy.call >= 0.95 && '纯 Call - 这里应该跟注'}
          </div>
        </div>
      )}
    </div>
  );
}
