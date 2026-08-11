import { useTranslation } from 'react-i18next';
import { Position } from '@/shared/types/position';
import { getPositionGroup } from '@/shared/types/position';
import { cn } from '@/shared/utils/cn';

interface PositionBadgeProps {
  position: Position;
  active?: boolean;
  className?: string;
}

const GROUP_LABEL_KEYS: Record<string, string> = {
  early: 'common.positionGroup.early',
  middle: 'common.positionGroup.middle',
  late: 'common.positionGroup.late',
  blinds: 'common.positionGroup.blinds',
};

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
    active: 'bg-[var(--clay)] text-[var(--ivory)] border-[var(--clay)] shadow-[var(--shadow-clay-glow-sm)]',
  },
  middle: {
    base: 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border-[var(--brass)]/30',
    active: 'bg-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass-bright)] shadow-[var(--shadow-brass-glow-sm)]',
  },
  late: {
    base: 'bg-[var(--sage)]/15 text-[var(--sage)] border-[var(--sage)]/30',
    active: 'bg-[var(--sage)] text-[var(--ivory)] border-[var(--sage)] shadow-[var(--shadow-sage-glow-sm)]',
  },
  blinds: {
    base: 'bg-[var(--brass)]/15 text-[var(--brass-bright)] border-[var(--brass)]/30',
    active: 'bg-[var(--brass)] text-[var(--primary-foreground)] border-[var(--brass)] shadow-[var(--shadow-brass-glow-sm)]',
  },
};

/**
 * Position badge showing the table position abbreviation.
 * Color-coded by position group (early/middle/late/blinds).
 */
export function PositionBadge({ position, active = false, className }: PositionBadgeProps) {
  const { t } = useTranslation();
  const group = getPositionGroup(position);
  const colors = GROUP_COLORS[group] ?? GROUP_COLORS.early!;
  // UI-09：颜色不是唯一语义通道 — 补充位置组文本标签（title/aria-label 双提供）
  const groupLabel = t(GROUP_LABEL_KEYS[group] ?? 'common.positionGroup.early');
  const semanticLabel = active ? `${position} · ${groupLabel} · ${t('common.active')}` : `${position} · ${groupLabel}`;

  return (
    <span
      title={semanticLabel}
      aria-label={semanticLabel}
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
