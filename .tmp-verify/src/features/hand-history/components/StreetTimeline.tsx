import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { ReplayState, HandHistory } from '../types';
import { cn } from '@/shared/utils/cn';

interface StreetTimelineProps {
  hand: HandHistory;
  currentStreet: ReplayState['currentStreet'];
  onJump: (street: ReplayState['currentStreet']) => void;
}

const STREET_LABEL_KEYS: Record<ReplayState['currentStreet'], string> = {
  preflop: 'handHistory.streets.preflop',
  flop: 'handHistory.streets.flop',
  turn: 'handHistory.streets.turn',
  river: 'handHistory.streets.river',
  showdown: 'handHistory.streets.showdown',
};

const STREETS: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];

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
  const { t } = useTranslation();
  const currentIdx = STREETS.indexOf(currentStreet);

  return (
    <div className="flex items-center gap-1">
      {STREETS.map((streetKey, idx) => {
        const isCurrent = streetKey === currentStreet;
        const isCompleted = idx < currentIdx;
        const actionCount = getActionCount(hand, streetKey);

        return (
          <div key={streetKey} className="flex items-center">
            <button
              onClick={() => onJump(streetKey)}
              className={cn(
                'flex flex-col items-center px-3 py-1.5 rounded-lg text-xs font-display font-medium transition-all',
                isCurrent && 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border border-[var(--brass)]/40',
                isCompleted && 'bg-[var(--sage)]/10 text-[var(--sage)] border border-[var(--sage)]/30',
                !isCurrent && !isCompleted && 'text-[var(--ivory-muted)] hover:text-[var(--ivory-dim)] hover:bg-[var(--walnut-raised)]/60'
              )}
            >
              <span>{t(STREET_LABEL_KEYS[streetKey])}</span>
              {actionCount > 0 && (
                <span className="text-[10px] opacity-70 font-numeric">{t('handHistory.streets.actions', { count: actionCount })}</span>
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
