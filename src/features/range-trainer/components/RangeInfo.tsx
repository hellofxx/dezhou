import type { HandNotation, HandCategory, GameVariant } from '@/shared/types/poker';
import { getHandCategory } from '../utils/handClassifier';
import { getRangeComboPercentage } from '../utils/rangeCombos';

interface RangeInfoProps {
  selectedHands: HandNotation[];
  highlightedHand: HandNotation | null;
  presetName?: string;
  /** 游戏变体（短牌总组合数 630，其余 1326） */
  variant?: GameVariant;
}

export function RangeInfo({ selectedHands, highlightedHand, presetName, variant = 'standard' }: RangeInfoProps) {
  const total = selectedHands.length;
  // P1A-07 修复：范围占比按组合数加权（对子6/同花4/offsuit12）除以总组合数，
  // 不再用规范手牌数/169
  const percentage = getRangeComboPercentage(selectedHands, variant).toFixed(1);

  // 统计各类型
  const stats = selectedHands.reduce(
    (acc, hand) => {
      const cat = getHandCategory(hand);
      acc[cat]++;
      return acc;
    },
    { pair: 0, suited: 0, offsuit: 0 } as Record<HandCategory, number>
  );

  // 高亮手牌详情
  const highlightedCategory = highlightedHand ? getHandCategory(highlightedHand) : null;
  const isInRange = highlightedHand ? selectedHands.includes(highlightedHand) : false;

  return (
    <div className="space-y-4">
      {/* 预设名称 */}
      {presetName && (
        <div>
          <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-1">当前范围</h3>
          <p className="text-base font-semibold text-[var(--brass)]">{presetName}</p>
        </div>
      )}

      {/* 范围统计 */}
      <div>
        <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">范围统计</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--brass)]">{total}</div>
            <div className="text-xs text-[var(--ivory-dim)]">手牌数</div>
          </div>
          <div className="bg-[var(--surface)] rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-[var(--brass)]">{percentage}%</div>
            <div className="text-xs text-[var(--ivory-dim)]">范围占比</div>
          </div>
        </div>
      </div>

      {/* 类型分布 */}
      <div>
        <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">类型分布</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ivory-dim)]">对子 (Pair)</span>
            <span className="text-xs font-medium text-[var(--ivory)]">{stats.pair}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ivory-dim)]">同花 (Suited)</span>
            <span className="text-xs font-medium text-[var(--ivory)]">{stats.suited}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--ivory-dim)]">非同花 (Offsuit)</span>
            <span className="text-xs font-medium text-[var(--ivory)]">{stats.offsuit}</span>
          </div>
        </div>
      </div>

      {/* 悬停手牌详情 */}
      {highlightedHand && (
        <div className="bg-[var(--surface)] rounded-lg p-3 border border-[var(--surface-raised)]">
          <h3 className="text-sm font-medium text-[var(--ivory-muted)] mb-2">手牌详情</h3>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-[var(--ivory)]">{highlightedHand}</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                isInRange
                  ? 'bg-[var(--brass)]/20 text-[var(--brass)]'
                  : 'bg-[var(--danger)]/20 text-[var(--danger)]'
              }`}
            >
              {isInRange ? '在范围内' : '不在范围'}
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--ivory-dim)]">
            类型: {highlightedCategory === 'pair' ? '对子' : highlightedCategory === 'suited' ? '同花' : '非同花'}
          </div>
        </div>
      )}
    </div>
  );
}
