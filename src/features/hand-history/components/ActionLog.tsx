import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { HandHistory, ReplayState } from '../types';
import type { PlayerAction } from '@/shared/types/action';
import { ActionType } from '@/shared/types/action';
import { formatAction } from '../utils/handNotation';
import { cn } from '@/shared/utils/cn';

interface ActionLogProps {
  hand: HandHistory;
  currentStreet: ReplayState['currentStreet'];
  currentActionIndex: number;
  onJumpToAction?: (street: ReplayState['currentStreet'], actionIndex: number) => void;
}

// HH-020：amount 为「to 金额」（本街累计总投注额），UI 展示 Call 需还原为增量。
// 对每条金额动作，先扫前面该玩家的金额动作取最后 to 值作为 prior，供 formatAction 计算增量。
function priorAmountFor(actions: PlayerAction[], targetIdx: number): number {
  const a = actions[targetIdx]!;
  let prior = 0;
  for (let j = 0; j < targetIdx; j++) {
    const prev = actions[j]!;
    if (
      prev.playerIndex === a.playerIndex &&
      prev.amount !== undefined &&
      (prev.type === ActionType.Call || prev.type === ActionType.Raise || prev.type === ActionType.AllIn)
    ) {
      prior = prev.amount;
    }
  }
  return prior;
}

function StreetSection({
  label,
  actions,
  players,
  isActive,
  currentIdx,
  streetKey,
  onJump,
}: {
  label: string;
  actions: PlayerAction[];
  players: HandHistory['players'];
  isActive: boolean;
  currentIdx: number;
  streetKey: ReplayState['currentStreet'];
  onJump?: (street: ReplayState['currentStreet'], idx: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)] mb-1 font-display font-semibold">
        {label}
      </div>
      {actions.length === 0 && (
        <div className="text-xs text-[var(--ivory-muted)]/50">{t('handHistory.streets.noActions')}</div>
      )}
      {actions.map((action, idx) => {
        const isCurrentAction = isActive && idx === currentIdx - 1;
        return (
          <button
            key={idx}
            // data-active 供 ActionLog 自动滚动定位（querySelector('[data-active="true"]')），
            // 缺失该属性时自动滚动永远找不到目标元素
            data-active={isCurrentAction ? 'true' : undefined}
            onClick={() => onJump?.(streetKey, idx + 1)}
            className={cn(
              'block w-full text-left text-xs py-1 px-2 rounded transition-colors',
              isCurrentAction
                ? 'bg-[var(--brass)]/15 text-[var(--brass-bright)] font-medium'
                : 'text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60'
            )}
          >
            {formatAction(action, players, priorAmountFor(actions, idx))}
          </button>
        );
      })}
    </div>
  );
}

const STREET_LABEL_KEYS: Record<ReplayState['currentStreet'], string> = {
  preflop: 'handHistory.streets.preflop',
  flop: 'handHistory.streets.flop',
  turn: 'handHistory.streets.turn',
  river: 'handHistory.streets.river',
  showdown: 'handHistory.streets.showdown',
};

export function ActionLog({ hand, currentStreet, currentActionIndex, onJumpToAction }: ActionLogProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentIdx = (['preflop', 'flop', 'turn', 'river', 'showdown'] as const).indexOf(currentStreet);

  // Auto-scroll to current action
  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector('[data-active="true"]');
      activeEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentStreet, currentActionIndex]);

  return (
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-[var(--walnut-border)]"
    >
      <StreetSection
        label={t(STREET_LABEL_KEYS.preflop)}
        actions={hand.streets.preflop}
        players={hand.players}
        isActive={currentStreet === 'preflop'}
        currentIdx={currentStreet === 'preflop' ? currentActionIndex : currentIdx > 0 ? hand.streets.preflop.length : 0}
        streetKey="preflop"
        onJump={onJumpToAction}
      />
      <StreetSection
        label={t(STREET_LABEL_KEYS.flop)}
        actions={hand.streets.flop.actions}
        players={hand.players}
        isActive={currentStreet === 'flop'}
        currentIdx={currentStreet === 'flop' ? currentActionIndex : currentIdx > 1 ? hand.streets.flop.actions.length : 0}
        streetKey="flop"
        onJump={onJumpToAction}
      />
      <StreetSection
        label={t(STREET_LABEL_KEYS.turn)}
        actions={hand.streets.turn.actions}
        players={hand.players}
        isActive={currentStreet === 'turn'}
        currentIdx={currentStreet === 'turn' ? currentActionIndex : currentIdx > 2 ? hand.streets.turn.actions.length : 0}
        streetKey="turn"
        onJump={onJumpToAction}
      />
      <StreetSection
        label={t(STREET_LABEL_KEYS.river)}
        actions={hand.streets.river.actions}
        players={hand.players}
        isActive={currentStreet === 'river'}
        currentIdx={currentStreet === 'river' ? currentActionIndex : currentIdx > 3 ? hand.streets.river.actions.length : 0}
        streetKey="river"
        onJump={onJumpToAction}
      />
    </div>
  );
}
