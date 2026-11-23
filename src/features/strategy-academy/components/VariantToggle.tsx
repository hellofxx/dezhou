import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { ALL_VARIANTS, DEFAULT_VARIANT } from '@/shared/types/elo';
import { VariantGlyph } from './VariantGlyph';
import type { PokerVariant } from '@/shared/types/elo';

interface VariantToggleItemProps {
  variant: PokerVariant;
  selected: boolean;
  onClick: () => void;
}

const VariantToggleItem: React.FC<VariantToggleItemProps> = ({ variant, selected, onClick }) => {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={cn('variant-seg-btn', selected && 'active')}
      onClick={onClick}
      aria-pressed={selected}
    >
      <VariantGlyph variant={variant} size={16} />
      {t(`variant.name.${variant}`)}
    </button>
  );
};

interface VariantToggleProps {
  variants?: PokerVariant[];
  onSelect?: (variant: PokerVariant) => void;
  active?: PokerVariant;
  className?: string;
}

/**
 * 游戏变体切换组件（分段控件，标签经 i18n 本地化）
 *
 * 用于 TheoryHome、AcademyHome 等页面顶部选择游戏变体。
 *
 * @example
 * ```tsx
 * <VariantToggle
 *   active="standard"
 *   onSelect={(v) => switchVariant(v)}
 * />
 * ```
 */
export function VariantToggle({
  variants = ALL_VARIANTS,
  onSelect,
  active = DEFAULT_VARIANT,
  className,
}: VariantToggleProps) {
  const { t } = useTranslation();
  return (
    <div className={cn('variant-seg', className)} role="group" aria-label={t('variant.selectVariant')}>
      {variants.map((v) => (
        <VariantToggleItem key={v} variant={v} selected={v === active} onClick={() => onSelect?.(v)} />
      ))}
    </div>
  );
}

export type VariantToggleComponent = typeof VariantToggle;
