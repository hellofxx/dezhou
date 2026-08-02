import { Suit } from '@/shared/types/poker';
import { SUIT_SYMBOLS, SUIT_COLORS } from '@/shared/constants/poker';
import { cn } from '@/shared/utils/cn';

interface SuitIconProps {
  suit: Suit;
  size?: number;
  className?: string;
}

/**
 * Renders a single suit symbol with the appropriate color.
 */
export function SuitIcon({ suit, size = 16, className }: SuitIconProps) {
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];

  return (
    <span
      className={cn('inline-block leading-none select-none', className)}
      style={{ color, fontSize: size }}
      aria-label={suit}
    >
      {symbol}
    </span>
  );
}
