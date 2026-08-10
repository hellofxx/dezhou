import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { VARIANT_CONFIG, ALL_VARIANTS, DEFAULT_VARIANT } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';

interface VariantToggleItemProps {
  variant: PokerVariant;
  selected: boolean;
  onClick: () => void;
}

const VariantToggleItem: React.FC<VariantToggleItemProps> = ({ variant, selected, onClick }) => {
  const { t } = useTranslation();
  const config = VARIANT_CONFIG[variant];

  return (
    <button
      type="button"
      className={cn('variant-seg-btn', selected && 'active')}
      onClick={onClick}
      aria-pressed={selected}
    >
      <span className="text-base leading-none" aria-hidden="true">
        {config.icon}
      </span>
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
    <div className={cn('variant-seg', className)} role="group" aria-label={t('variant.select_variant')}>
      {variants.map((v) => (
        <VariantToggleItem key={v} variant={v} selected={v === active} onClick={() => onSelect?.(v)} />
      ))}
    </div>
  );
}

export type VariantToggleComponent = typeof VariantToggle;
