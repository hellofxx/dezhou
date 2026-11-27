import React from 'react';
import type { HandNotation } from '@/shared/types/poker';
import type { HandStrategy } from '../types';
import { getHandFromGrid } from '@/shared/utils/rangeParser';
import { GRID_RANKS } from '@/shared/constants/poker';
import { cn } from '@/shared/utils/cn';
import { useRovingGridNav } from '@/shared/hooks/useRovingGridNav';
import type { RovingGridItemProps } from '@/shared/hooks/useRovingGridNav';
import { ActionType } from '@/shared/types/action';
import { actionTerm } from '../utils/actionTerms';

interface StrategyMatrixProps {
  strategies: Record<HandNotation, HandStrategy> | null;
  highlightedHand?: HandNotation | null;
  onCellHover?: (hand: HandNotation | null) => void;
  onCellClick?: (hand: HandNotation) => void;
  className?: string;
  /**
   * 只读展示（结果页复盘）：格子不挂 role=button / tabIndex / onKeyDown / aria-current，
   * 不显示 cursor-pointer、不响应 click、不参与 roving focus；保留 title 频率说明。
   * 交互态（训练页选牌）保持原有键盘导航与点击行为。
   */
  readOnly?: boolean;
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
  readOnly: boolean;
  onHover: (hand: HandNotation | null) => void;
  onClick: (hand: HandNotation) => void;
  /** G-G3: roving tabindex 键盘属性（整张矩阵共用一个 Tab 停靠点）；只读态不传 */
  getItemProps?: (value: HandNotation) => RovingGridItemProps;
}

const MatrixCell = React.memo(function MatrixCell({
  hand,
  strategy,
  isHighlighted,
  readOnly,
  onHover,
  onClick,
  getItemProps,
}: MatrixCellProps) {
  const colorClass = getCellColor(strategy);
  // 只读态不调用 getItemProps：无 role / tabIndex / onKeyDown / aria-current，不参与 roving focus
  const interactionProps = readOnly ? undefined : getItemProps?.(hand);

  return (
    <div
      className={cn(
        // DESIGN.md §13.3.3：矩阵数据 11px + 容器横向滚动
        'flex items-center justify-center rounded-[3px] text-[11px] font-medium select-none transition-all duration-100 font-numeric',
        'aspect-square border border-black/20',
        colorClass,
        !readOnly && 'cursor-pointer',
        isHighlighted && 'ring-2 ring-[var(--brass-bright)] ring-offset-1 ring-offset-[var(--felt)] scale-110 z-10',
        !isHighlighted && !readOnly && 'hover-bright-lg hover:ring-1 hover:ring-[var(--brass)]/40'
      )}
      onMouseEnter={readOnly ? undefined : () => onHover(hand)}
      onMouseLeave={readOnly ? undefined : () => onHover(null)}
      onClick={readOnly ? undefined : () => onClick(hand)}
      title={strategy ? `${hand}: R${Math.round(strategy.raise * 100)}% C${Math.round(strategy.call * 100)}% F${Math.round(strategy.fold * 100)}%` : hand}
      {...interactionProps}
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
  readOnly = false,
}: StrategyMatrixProps) {
  // 稳定回调：169 个格子共用同一引用，父级重渲染（高亮切换等）不触发无谓重渲染
  const handleHover = React.useCallback(
    (hand: HandNotation | null) => {
      onCellHover?.(hand);
    },
    [onCellHover]
  );

  const handleClick = React.useCallback(
    (hand: HandNotation) => {
      onCellClick?.(hand);
    },
    [onCellClick]
  );

  // 13×13 手牌矩阵，行优先顺序；columns=13 让 Up/Down 跨行移动
  const handValues = React.useMemo(() => {
    const hands: HandNotation[] = [];
    for (let row = 0; row < 13; row++) {
      for (let col = 0; col < 13; col++) {
        hands.push(getHandFromGrid(row, col));
      }
    }
    return hands;
  }, []);

  const { getItemProps } = useRovingGridNav({
    values: handValues,
    columns: 13,
    onSelect: handleClick,
  });

  // BUG-GTO-010：图例动作词统一取自扑克动作术语源（刻意保留英文）
  const raiseTerm = actionTerm(ActionType.Raise);
  const callTerm = actionTerm(ActionType.Call);
  const foldTerm = actionTerm(ActionType.Fold);

  return (
    <div className={cn('w-full', className)}>
      {/* DESIGN.md §13.3.3：11px 数据 + 窄容器横向滚动，320px 下不把格子压到不可读 */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* 列标题 */}
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
            <div />
            {GRID_RANKS.map((rank) => (
              <div
                key={`col-${rank}`}
                className="text-[10px] text-[var(--brass-text)] text-center font-semibold pb-0.5 font-numeric"
              >
                {rank}
              </div>
            ))}
          </div>

          {/* 网格 */}
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `20px repeat(13, 1fr)` }}>
            {Array.from({ length: 13 }, (_, rowIdx) => (
              <React.Fragment key={`row-${rowIdx}`}>
                <div className="flex items-center justify-center text-[10px] text-[var(--brass-text)] font-semibold font-numeric">
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
                      readOnly={readOnly}
                      onHover={handleHover}
                      onClick={handleClick}
                      getItemProps={readOnly ? undefined : getItemProps}
                    />
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[11px] text-[var(--ivory-muted)] font-numeric">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--brass)]/70" />
          <span>{raiseTerm}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--sage)]/70" />
          <span>{callTerm}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-sm bg-[var(--clay)]/30" />
          <span>{foldTerm}</span>
        </div>
      </div>
    </div>
  );
}
