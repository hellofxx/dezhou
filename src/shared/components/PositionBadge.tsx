import { Position } from '@/shared/types/position';
import { getPositionGroup } from '@/shared/types/position';
import { cn } from '@/shared/utils/cn';

interface PositionBadgeProps {
  position: Position;
  active?: boolean;
  className?: string;
}

/**
 * Position group colors follow the card-room palette:
 *   early  = clay  (tight, dangerous — red)
 *   middle = brass (neutral warmth)
 *   late   = sage  (best position — go)
 *   blinds = gold  (committed chips)
 */
const GROUP_COLORS: Record<string, { base: string; active: string }> = {
  early: {
    base: 'bg-[var(--clay)]/15 text-[var(--clay)] border-[var(--clay)]/30',
    active: 'bg-[var(--clay)] text-[var(--ivory)] border-[var(--clay)] shadow-[0_0_8px_rgba(168,56,56,0.5)]',
  },
  middle: {
    base: 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border-[var(--brass)]/30',
    active: 'bg-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass-bright)] shadow-[0_0_8px_rgba(201,162,94,0.5)]',
  },
  late: {
    base: 'bg-[var(--sage)]/15 text-[var(--sage)] border-[var(--sage)]/30',
    active: 'bg-[var(--sage)] text-[var(--ivory)] border-[var(--sage)] shadow-[0_0_8px_rgba(107,142,122,0.5)]',
  },
  blinds: {
    base: 'bg-[var(--gold)]/15 text-[var(--gold)] border-[var(--gold)]/30',
    active: 'bg-[var(--gold)] text-[var(--primary-foreground)] border-[var(--gold)] shadow-[0_0_8px_rgba(212,168,75,0.5)]',
  },
};

/**
 * Position badge showing the table position abbreviation.
 * Color-coded by position group (early/middle/late/blinds).
 */
export function PositionBadge({ position, active = false, className }: PositionBadgeProps) {
  const group = getPositionGroup(position);
  const colors = GROUP_COLORS[group] ?? GROUP_COLORS.early!;

  return (
    <span
      className={cn(
        'position-badge inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-display font-bold tracking-wide uppercase',
        active ? colors.active : colors.base,
        className,
      )}
    >
      {position}
    </span>
  );
}
