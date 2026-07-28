import { useEffect, useRef } from 'react';
import type { HandHistory, ReplayState } from '../types';
import { formatAction } from '../utils/handNotation';
import { cn } from '@/shared/utils/cn';

interface ActionLogProps {
  hand: HandHistory;
  currentStreet: ReplayState['currentStreet'];
  currentActionIndex: number;
  onJumpToAction?: (street: ReplayState['currentStreet'], actionIndex: number) => void;
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
  actions: import('@/shared/types/action').PlayerAction[];
  players: HandHistory['players'];
  isActive: boolean;
  currentIdx: number;
  streetKey: ReplayState['currentStreet'];
  onJump?: (street: ReplayState['currentStreet'], idx: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)] mb-1 font-display font-semibold">
        {label}
      </div>
      {actions.length === 0 && (
        <div className="text-xs text-[var(--ivory-muted)]/50">No actions</div>
      )}
      {actions.map((action, idx) => {
        const isCurrentAction = isActive && idx === currentIdx - 1;
        return (
          <button
            key={idx}
            onClick={() => onJump?.(streetKey, idx + 1)}
            className={cn(
              'block w-full text-left text-xs py-1 px-2 rounded transition-colors',
              isCurrentAction
                ? 'bg-[var(--brass)]/15 text-[var(--brass-bright)] font-medium'
                : 'text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60'
            )}
          >
            {formatAction(action, players)}
          </button>
        );
      })}
    </div>
  );
}

export function ActionLog({ hand, currentStreet, currentActionIndex, onJumpToAction }: ActionLogProps) {
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
        label="Preflop"
        actions={hand.streets.preflop}
        players={hand.players}
        isActive={currentStreet === 'preflop'}
        currentIdx={currentStreet === 'preflop' ? currentActionIndex : currentIdx > 0 ? hand.streets.preflop.length : 0}
        streetKey="preflop"
        onJump={onJumpToAction}
      />
      <StreetSection
        label="Flop"
        actions={hand.streets.flop.actions}
        players={hand.players}
        isActive={currentStreet === 'flop'}
        currentIdx={currentStreet === 'flop' ? currentActionIndex : currentIdx > 1 ? hand.streets.flop.actions.length : 0}
        streetKey="flop"
        onJump={onJumpToAction}
      />
      <StreetSection
        label="Turn"
        actions={hand.streets.turn.actions}
        players={hand.players}
        isActive={currentStreet === 'turn'}
        currentIdx={currentStreet === 'turn' ? currentActionIndex : currentIdx > 2 ? hand.streets.turn.actions.length : 0}
        streetKey="turn"
        onJump={onJumpToAction}
      />
      <StreetSection
        label="River"
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
