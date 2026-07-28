import { motion } from 'framer-motion';
import type { ReplayState, HandHistory } from '../types';
import { cn } from '@/shared/utils/cn';

interface StreetTimelineProps {
  hand: HandHistory;
  currentStreet: ReplayState['currentStreet'];
  onJump: (street: ReplayState['currentStreet']) => void;
}

const STREETS: { key: ReplayState['currentStreet']; label: string }[] = [
  { key: 'preflop', label: 'Preflop' },
  { key: 'flop', label: 'Flop' },
  { key: 'turn', label: 'Turn' },
  { key: 'river', label: 'River' },
  { key: 'showdown', label: 'Showdown' },
];

function getActionCount(hand: HandHistory, street: ReplayState['currentStreet']): number {
  switch (street) {
    case 'preflop': return hand.streets.preflop.length;
    case 'flop': return hand.streets.flop.actions.length;
    case 'turn': return hand.streets.turn.actions.length;
    case 'river': return hand.streets.river.actions.length;
    case 'showdown': return 0;
  }
}

export function StreetTimeline({ hand, currentStreet, onJump }: StreetTimelineProps) {
  const currentIdx = STREETS.findIndex(s => s.key === currentStreet);

  return (
    <div className="flex items-center gap-1">
      {STREETS.map((street, idx) => {
        const isCurrent = street.key === currentStreet;
        const isCompleted = idx < currentIdx;
        const actionCount = getActionCount(hand, street.key);

        return (
          <div key={street.key} className="flex items-center">
            <button
              onClick={() => onJump(street.key)}
              className={cn(
                'flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-all',
                isCurrent && 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border border-[var(--brass)]/40',
                isCompleted && 'bg-[var(--sage)]/10 text-[var(--sage)] border border-[var(--sage)]/30',
                !isCurrent && !isCompleted && 'text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60'
              )}
            >
              <span>{street.label}</span>
              {actionCount > 0 && (
                <span className="text-[10px] opacity-70 font-numeric">{actionCount} actions</span>
              )}
            </button>
            {idx < STREETS.length - 1 && (
              <motion.div
                className="w-6 h-0.5 mx-1 rounded"
                animate={{
                  backgroundColor: idx < currentIdx ? 'var(--sage)' : 'var(--walnut-border)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
