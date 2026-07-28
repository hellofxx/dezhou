import React from 'react';
import type { HandNotation, GameVariant } from '@/shared/types/poker';
import { cn } from '@/shared/utils';
import { getHandFromGrid } from '../utils/rangeParser';
import { getHandCategory } from '../utils/handClassifier';
import { GRID_RANKS, SHORT_DECK_GRID_RANKS } from '../constants';

interface RangeGridProps {
  selectedHands: HandNotation[];
  highlightedHand?: HandNotation | null;
  onCellClick?: (hand: HandNotation) => void;
  onCellHover?: (hand: HandNotation | null) => void;
  colorMode?: 'action' | 'selection';
  variant?: GameVariant;
  className?: string;
}

// 单元格组件 - 使用 React.memo 优化
interface GridCellProps {
  hand: HandNotation;
  row: number;
  col: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick?: (hand: HandNotation) => void;
  onHover?: (hand: HandNotation | null) => void;
}

const GridCell = React.memo(function GridCell({
  hand,
  isSelected,
  isHighlighted,
  onClick,
  onHover,
}: GridCellProps) {
  const category = getHandCategory(hand);
  const isPair = category === 'pair';
  const isSuited = category === 'suited';

  // Inlaid-tile palette: selected = brass fill with ink text;
  // unselected cells are dim ivory tile, with pairs tinted warm (brass-deep)
  // and suited hands tinted cool (sage) so the diagonal reads at a glance.
  let bgClass: string;
  if (isSelected) {
    bgClass = 'bg-[var(--brass)] text-[var(--primary-foreground)]';
  } else if (isPair) {
    bgClass = 'bg-[var(--brass-deep)]/25 text-[var(--ivory)]';
  } else if (isSuited) {
    bgClass = 'bg-[var(--sage)]/15 text-[var(--ivory-dim)]';
  } else {
    bgClass = 'bg-[var(--walnut-raised)]/40 text-[var(--ivory-muted)]';
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-[3px] text-[11px] font-medium cursor-pointer select-none transition-all duration-150 font-numeric',
        'aspect-square border border-black/20',
        bgClass,
        isHighlighted && 'ring-2 ring-[var(--brass-bright)] ring-offset-1 ring-offset-[var(--felt)] scale-110 z-10',
        !isSelected && !isHighlighted && 'hover:brightness-125 hover:ring-1 hover:ring-[var(--brass)]/40'
      )}
      onClick={() => onClick?.(hand)}
      onMouseEnter={() => onHover?.(hand)}
      onMouseLeave={() => onHover?.(null)}
      title={hand}
    >
      {hand}
    </div>
  );
});

export function RangeGrid({
  selectedHands,
  highlightedHand = null,
  onCellClick,
  onCellHover,
  colorMode: _colorMode = 'action',
  variant = 'standard',
  className,
}: RangeGridProps) {
  const selectedSet = React.useMemo(() => new Set(selectedHands), [selectedHands]);

  const isShortDeck = variant === 'short-deck';
  const ranks = isShortDeck ? SHORT_DECK_GRID_RANKS : GRID_RANKS;
  const gridSize = ranks.length; // 9 for short-deck, 13 for standard

  // 构建网格
  const grid = React.useMemo(() => {
    const cells: { hand: HandNotation; row: number; col: number }[] = [];
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        let hand: HandNotation;
        if (isShortDeck) {
          // 短牌: 使用 SHORT_DECK_GRID_RANKS 直接计算
          if (row === col) {
            hand = `${ranks[row]}${ranks[col]}`;
          } else if (col > row) {
            hand = `${ranks[row]}${ranks[col]}s`;
          } else {
            hand = `${ranks[col]}${ranks[row]}o`;
          }
        } else {
          hand = getHandFromGrid(row, col);
        }
        cells.push({ hand, row, col });
      }
    }
    return cells;
  }, [gridSize, isShortDeck]);

  return (
    <div className={cn('w-full', className)}>
      {/* 列标题 */}
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `24px repeat(${gridSize}, 1fr)` }}>
        <div /> {/* 左上角空白 */}
        {ranks.map((rank) => (
          <div
            key={`col-${rank}`}
            className="text-[10px] text-[var(--brass-deep)] text-center font-semibold pb-1 font-numeric"
          >
            {rank}
          </div>
        ))}
      </div>

      {/* 网格主体 */}
      <div className="grid gap-[2px]" style={{ gridTemplateColumns: `24px repeat(${gridSize}, 1fr)` }}>
        {Array.from({ length: gridSize }, (_, rowIdx) => (
          <React.Fragment key={`row-${rowIdx}`}>
            {/* 行标题 */}
            <div className="flex items-center justify-center text-[10px] text-[var(--brass-deep)] font-semibold font-numeric">
              {ranks[rowIdx]}
            </div>
            {/* 各列单元格 */}
            {Array.from({ length: gridSize }, (_, colIdx) => {
              const cell = grid[rowIdx * gridSize + colIdx]!;
              return (
                <GridCell
                  key={cell.hand}
                  hand={cell.hand}
                  row={cell.row}
                  col={cell.col}
                  isSelected={selectedSet.has(cell.hand)}
                  isHighlighted={highlightedHand === cell.hand}
                  onClick={onCellClick}
                  onHover={onCellHover}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
