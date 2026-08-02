import { motion } from 'framer-motion';
import type { Player } from '../types';
import { PositionBadge } from '@/shared/components/poker/PositionBadge';
import { HandDisplay } from '@/shared/components/poker/HandDisplay';
import { formatChipCount } from '@/shared/utils/formatters';

interface PlayerSeatsProps {
  players: Player[];
  activePlayerIndex: number;
  foldedPlayers: Set<number>;
  playerStacks: number[];
  showCards: boolean;
}

// Positions around an elliptical table for 6-max
// Positions: top-left, top, top-right, bottom-right, bottom, bottom-left
const SEAT_POSITIONS = [
  { top: '5%', left: '25%' },    // Seat 1 (top-left)
  { top: '0%', left: '50%', transform: 'translateX(-50%)' },   // Seat 2 (top center)
  { top: '5%', right: '25%' },   // Seat 3 (top-right)
  { bottom: '5%', right: '25%' }, // Seat 4 (bottom-right)
  { bottom: '0%', left: '50%', transform: 'translateX(-50%)' }, // Seat 5 (bottom center)
  { bottom: '5%', left: '25%' }, // Seat 6 (bottom-left)
];

function getSeatStyle(index: number) {
  const pos = SEAT_POSITIONS[index % SEAT_POSITIONS.length]!;
  return {
    position: 'absolute' as const,
    top: pos.top,
    left: pos.left,
    right: pos.right,
    bottom: pos.bottom,
    transform: pos.transform,
  };
}

export function PlayerSeats({
  players,
  activePlayerIndex,
  foldedPlayers,
  playerStacks,
  showCards,
}: PlayerSeatsProps) {
  return (
    <>
      {players.map((player, index) => {
        const isFolded = foldedPlayers.has(index);
        const isActive = index === activePlayerIndex;
        const showHoleCards = showCards && player.holeCards;

        return (
          <motion.div
            key={player.id}
            className={`
              flex flex-col items-center gap-1 p-3 rounded-xl
              bg-[var(--walnut-raised)]/70 border backdrop-blur-sm transition-all duration-300
              ${isActive ? 'border-[var(--brass)] shadow-[0_0_16px_rgba(201,162,94,0.45)]' : 'border-[var(--walnut-border)]/60'}
              ${isFolded ? 'opacity-40' : ''}
            `}
            style={getSeatStyle(index)}
            animate={isActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
          >
            {/* Position badge */}
            <PositionBadge position={player.position} active={isActive} className="text-[10px]" />

            {/* Player name */}
            <span className="text-xs font-display font-medium text-[var(--ivory)] truncate max-w-[80px]">
              {player.name}
            </span>

            {/* Stack */}
            <span className="text-[11px] text-[var(--ivory-dim)] font-numeric">
              ${formatChipCount(playerStacks[index] ?? player.stack)}
            </span>

            {/* Hole cards */}
            {showHoleCards && player.holeCards && (
              <HandDisplay cards={[...player.holeCards]} faceDown={false} size="sm" spread={-12} />
            )}
          </motion.div>
        );
      })}
    </>
  );
}
