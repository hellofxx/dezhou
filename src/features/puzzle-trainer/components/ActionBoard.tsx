/**
 * ActionBoard：谜题答题选项的"行动桌"。
 *
 * 签名元素：每个选项按钮按行动 tier 固定一种颜色（互不重复、视觉权重均衡），
 * 强度层级由 gauge（3 dots）数量表达。映射 `parseOptionSortKey` 解析出的 category：
 *  - passive   (cat 0-1, Fold/Check)  → 石板靛 indigo（保守·弃守）
 *  - standard  (cat 2-5, Call/Bet/Raise) → 黄铜金 brass（标准行动）
 *  - aggressive(cat 6, 全下)         → 陶土红 clay（致命一击）
 *
 * 三色与答题反馈色错开：正确=苔藓绿、错误=陶土红，避免答题前被颜色暗示答案。
 * PuzzleCard 不再自己维护 grid 按钮，改委托给 ActionBoard 统一管理。
 *
 * 可区分性增强（同档内区分具体动作）：tier 配色保持不变（有意设计，防颜色暗示答案），
 * 改为在 gauge 同一行（标签上方）追加 Lucide 动作图标，见 ACTION_ICONS。
 * 图标 14px、`aria-hidden`、无文字替代（动作语义已由标签文本承载），
 * 无法解析类别时不渲染图标，避免猜测。
 */
import { useMemo } from 'react';
import {
  ArrowUp,
  Check,
  Flame,
  Footprints,
  HandCoins,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { parseOptionSortKey } from '../utils/optionOrder';
import type { PuzzleOption } from '../types';

interface ActionBoardProps {
  /** 题目选项（已由 sortOptionsCanonically 排序） */
  options: readonly PuzzleOption[];
  /** 当前选中的选项 id（未答为 null） */
  selectedOptionId: string | null;
  /** 是否已答（已答后按钮全部 disabled） */
  isAnswered: boolean;
  /** 选择回调 */
  onSelect: (optionId: string) => void;
  /** 附加类名（覆写 grid 布局的兜底位） */
  className?: string;
}

/** 行动强度档位 */
type ActionTier = 'passive' | 'standard' | 'aggressive';

function getActionTier(category: number): ActionTier {
  if (category <= 1) return 'passive';
  if (category <= 5) return 'standard';
  if (category === 6) return 'aggressive';
  // PZL-04：未知 category（非 1-6）归入中性档，避免误标 aggressive
  return 'standard';
}

/** 每档固定一种 gauge 点色（与按钮主体色同源） */
const TIER_DOT: Record<ActionTier, string> = {
  passive: 'dot--frost',
  standard: 'dot--brass',
  aggressive: 'dot--clay',
};

/**
 * 动作图标色：与该档 gauge 点色同源（standard 档按钮本体不设 color，
 * 故显式给黄铜金，避免图标落在中性 ivory 上与其他两档割裂）。
 */
const TIER_ICON_COLOR: Record<ActionTier, string> = {
  passive: 'text-[var(--poker-indigo-bright)]',
  standard: 'text-[var(--brass-bright)]',
  aggressive: 'text-[var(--clay-text)]',
};

/** 动作图标键（同时作为 `data-action-icon` 供测试与样式定位） */
type ActionIconKey = 'fold' | 'check' | 'call' | 'limp' | 'bet' | 'raise' | 'allin';

/**
 * 动作类别（parseOptionSortKey.category）→ 图标。
 * 同 tier 的多个动作靠图标区分（如 passive 档 Fold=X / Check=ShieldCheck），
 * 未列出的类别（含 99 无法识别）不渲染图标。
 */
const ACTION_ICONS: Readonly<Record<number, { key: ActionIconKey; Icon: LucideIcon }>> = {
  0: { key: 'fold', Icon: X }, // Fold
  1: { key: 'check', Icon: ShieldCheck }, // Check
  2: { key: 'call', Icon: HandCoins }, // Call
  3: { key: 'limp', Icon: Footprints }, // Limp
  4: { key: 'bet', Icon: ArrowUp }, // Bet / C-bet
  5: { key: 'raise', Icon: ArrowUp }, // Raise / 3-bet / 4-bet
  6: { key: 'allin', Icon: Flame }, // 全下
};

function getActionIcon(category: number): { key: ActionIconKey; Icon: LucideIcon } | null {
  return ACTION_ICONS[category] ?? null;
}

/** 根据选项数量决定列数键值：1/2/3/4 +，CSS 通过 .action-board--cols-N 控制列布局 */
function pickColsClass(count: number): string {
  if (count <= 1) return 'action-board--cols-1';
  if (count === 2) return 'action-board--cols-2';
  if (count === 3) return 'action-board--cols-3';
  return 'action-board--cols-4';
}

export default function ActionBoard({
  options,
  selectedOptionId,
  isAnswered,
  onSelect,
  className,
}: ActionBoardProps) {
  // 预解析每个选项的 tier 与动作图标，避免 render 期间重复解析
  const annotated = useMemo(
    () =>
      options.map((opt) => {
        const { category } = parseOptionSortKey(opt.text);
        return {
          option: opt,
          tier: getActionTier(category),
          actionIcon: getActionIcon(category),
        };
      }),
    [options]
  );

  const gridClass = cn('action-board', pickColsClass(annotated.length), className);

  return (
    <div className={gridClass}>
      {annotated.map(({ option: opt, tier, actionIcon }) => {
        const isSelected = selectedOptionId === opt.id;
        const showResult = isAnswered && isSelected;
        const showCorrect = isAnswered && opt.isCorrect;
        const ActionIcon = actionIcon?.Icon;

        return (
          <button
            key={opt.id}
            type="button"
            disabled={isAnswered}
            aria-pressed={isSelected}
            aria-label={opt.text}
            onClick={() => onSelect(opt.id)}
            data-tier={tier}
            data-testid={`action-tile-${opt.id}`}
            className={cn(
              'action-tile',
              `action-tile-${tier}`,
              showResult && opt.isCorrect && 'action-tile--correct',
              showResult && !opt.isCorrect && 'action-tile--wrong',
              showCorrect && !isSelected && 'action-tile--correct-reveal',
              isAnswered && !showResult && !showCorrect && 'action-tile--dim'
            )}
          >
            {/* 顶行：动作图标（同档内区分动作）+ 行动强度 gauge（按 tier 点亮 1/2/3 颗） */}
            <span className="flex items-center gap-2">
              {ActionIcon ? (
                <span className="inline-flex" data-action-icon={actionIcon?.key}>
                  <ActionIcon
                    className={cn('w-3.5 h-3.5 shrink-0', TIER_ICON_COLOR[tier])}
                    aria-hidden
                  />
                </span>
              ) : null}
              <span className="action-tile-gauge" aria-hidden>
                <span className={cn('dot', 'dot--on', TIER_DOT[tier])} />
                <span
                  className={cn('dot', tier !== 'passive' && 'dot--on', TIER_DOT[tier])}
                />
                <span
                  className={cn('dot', tier === 'aggressive' && 'dot--on', TIER_DOT[tier])}
                />
              </span>
            </span>

            {/* 主标签 */}
            <span className="action-tile-label">{opt.text}</span>

            {/* 揭示态标记：正确选项对号 ✓、选错的选项叉号 ✗ */}
            {showCorrect && (
              <span className="action-tile-mark" aria-hidden>
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            {showResult && !opt.isCorrect && (
              <span className="action-tile-mark action-tile-mark--wrong" aria-hidden>
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
