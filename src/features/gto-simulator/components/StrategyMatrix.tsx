import React from 'react';
import type { HandNotation } from '@/shared/types/poker';
import type { HandStrategy } from '../types';
import { getHandFromGrid } from '@/features/range-trainer/utils/rangeParser';
import { GRID_RANKS } from '@/features/range-trainer/constants';
import { cn } from '@/shared/utils';

interface StrategyMatrixProps {
  strategies: Record<HandNotation, HandStrategy> | null;
  highlightedHand?: HandNotation | null;
  onCellHover?: (hand: HandNotation | null) => void;
  onCellClick?: (hand: HandNotation) => void;
  className?: string;
}

/**
 * Frequency heat-map colors.
 * Action semantics match the rest of the card-room UI:
 *   Raise = brass (aggression, warm)
 *   Call  = sage  (neutral, cool)
 *   Fold  = clay  (giving up, muted)
 * Each frequency ramps through 5 opacity stops so the dominant action
 * reads instantly and intensity correlates with confidence.
 */
function getCellColor(strategy: HandStrategy | undefined): string {
  if (!strategy) return 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-muted)]';

  const raiseFreq = strategy.raise;
  const callFreq = strategy.call;
  const foldFreq = strategy.fold;

  // Raise-dominant — brass ramp
  if (raiseFreq >= callFreq && raiseFreq >= foldFreq) {
    if (raiseFreq >= 0.9) return 'bg-[var(--brass)]/95 text-[var(--primary-foreground)]';
    if (raiseFreq >= 0.7) return 'bg-[var(--brass)]/70 text-[var(--primary-foreground)]';
    if (raiseFreq >= 0.5) return 'bg-[var(--brass)]/50 text-[var(--ivory)]';
    if (raiseFreq >= 0.3) return 'bg-[var(--brass)]/30 text-[var(--ivory)]';
    return 'bg-[var(--brass)]/15 text-[var(--ivory-dim)]';
  }

  // Call-dominant — sage ramp
  if (callFreq >= foldFreq) {
    if (callFreq >= 0.9) return 'bg-[var(--sage)]/90 text-[var(--ivory)]';
    if (callFreq >= 0.7) return 'bg-[var(--sage)]/70 text-[var(--ivory)]';
    if (callFreq >= 0.5) return 'bg-[var(--sage)]/50 text-[var(--ivory)]';
    if (callFreq >= 0.3) return 'bg-[var(--sage)]/30 text-[var(--ivory)]';
    return 'bg-[var(--sage)]/15 text-[var(--ivory-dim)]';
  }

  // Fold-dominant — clay ramp, kept dimmer because fold is the "no action" state
  if (foldFreq >= 0.9) return 'bg-[var(--clay)]/45 text-[var(--ivory-muted)]';
  if (foldFreq >= 0.7) return 'bg-[var(--clay)]/30 text-[var(--ivory-muted)]';
  if (foldFreq >= 0.5) return 'bg-[var(--clay)]/20 text-[var(--ivory-muted)]';
  return 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-muted)]';
}

interface MatrixCellProps {
  hand: HandNotation;
  strategy: HandStrategy | undefined;
  isHighlighted: boolean;
  onHover: (hand: HandNotation | null) => void;
  onClick: (hand: HandNotation) => void;
}

const MatrixCell = React.memo(function MatrixCell({
  hand,
  strategy,
  isHighlighted,
  onHover,
  onClick,
}: MatrixCellProps) {
  const colorClass = getCellColor(strategy);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[3px] text-[10px] font-medium cursor-pointer select-none transition-all duration-100 font-numeric',
        'aspect-square border border-black/20',
        colorClass,
        isHighlighted && 'ring-2 ring-[var(--brass-bright)] ring-offset-1 ring-offset-[var(--felt)] scale-110 z-10',
        !isHighlighted && 'hover:brightness-125 hover:ring-1 hover:ring-[var(--brass)]/40'
      )}
      onMouseEnter={() => onHover(hand)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onClick(hand)}
      title={strategy ? `${hand}: R${Math.round(strategy.raise * 100)}% C${Math.round(strategy.call * 100)}% F${Math.round(strategy.fold * 100)}%` : hand}
    >
      {hand}
    </div>
  );
});

export function StrategyMatrix({
  strategies,
  highlightedHand = null,
  onCellHover,
  onCellClick,
  className,
}: StrategyMatrixProps) {
  const handleHover = (hand: HandNotation | null) => {
    onCellHover?.(hand);
  };

  const handleClick = (hand: HandNotation) => {
    onCellClick?.(hand);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* 列标题 */}
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
        <div />
        {GRID_RANKS.map((rank) => (
          <div
            key={`col-${rank}`}
            className="text-[9px] text-[var(--brass-deep)] text-center font-semibold pb-0.5 font-numeric"
          >
            {rank}
          </div>
        ))}
      </div>

      {/* 网格 */}
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
        {Array.from({ length: 13 }, (_, rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            <div className="flex items-center justify-center text-[9px] text-[var(--brass-deep)] font-semibold font-numeric">
              {GRID_RANKS[rowIdx]}
            </div>
            {Array.from({ length: 13 }, (_, colIdx) => {
              const hand = getHandFromGrid(rowIdx, colIdx);
              const strategy = strategies?.[hand];
              return (
                <MatrixCell
                  key={hand}
                  hand={hand}
                  strategy={strategy}
                  isHighlighted={highlightedHand === hand}
                  onHover={handleHover}
                  onClick={handleClick}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-[var(--ivory-muted)] font-numeric">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--brass)]/70" />
          <span>Raise</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--sage)]/70" />
          <span>Call</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--clay)]/30" />
          <span>Fold</span>
        </div>
      </div>
    </div>
  );
}
