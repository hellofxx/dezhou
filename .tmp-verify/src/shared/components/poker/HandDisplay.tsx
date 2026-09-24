import type { Card } from '@/shared/types/poker';
import { PokerCard } from '@/shared/components/poker/Card';
import { cn } from '@/shared/utils/cn';

interface HandDisplayProps {
  cards: Card[];
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  spread?: number;
}

/**
 * Displays a horizontal row of cards with slight overlap.
 * Typically used for hole cards (2 cards).
 */
export function HandDisplay({
  cards,
  faceDown = false,
  size = 'md',
  className,
  spread = -8,
}: HandDisplayProps) {
  return (
    <div
      className={cn('flex items-center', className)}
      style={{ gap: spread }}
    >
      {cards.map((card, index) => (
        <PokerCard
          key={`${card.rank}-${card.suit}-${index}`}
          card={card}
          faceDown={faceDown}
          size={size}
          animationDelay={index * 0.08}
        />
      ))}
    </div>
  );
}
