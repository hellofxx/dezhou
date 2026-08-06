import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { VARIANT_CONFIG, ALL_VARIANTS, DEFAULT_VARIANT } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';

const variantToggleItemVariant = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border-2 px-4 py-2 font-medium text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        standard: 'border-brass-700 bg-brass-800 text-ivory-100 hover:bg-brass-700',
        'short-deck': 'border-walnut-700 bg-walnut-800 text-ivory-100 hover:bg-walnut-700',
        'heads-up': 'border-felt-700 bg-felt-800 text-ivory-100 hover:bg-felt-700',
      },
      selected: {
        true: 'ring-2 ring-offset-2 shadow-md',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'standard',
      selected: false,
    },
  }
);

interface VariantToggleItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variantToggleItemVariant> {
  variant: PokerVariant;
  selected: boolean;
  onClick: () => void;
}

const VariantToggleItem: React.FC<VariantToggleItemProps> = ({
  variant,
  selected,
  onClick,
  className,
  ...props
}) => {
  const config = VARIANT_CONFIG[variant];
  
  return (
    <button
      type="button"
      className={cn(variantToggleItemVariant({ variant, selected }), className)}
      onClick={onClick}
      aria-pressed={selected}
      {...props}
    >
      <span className="text-lg leading-none">{config.icon}</span>
      {config.shortName}
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
 * 游戏变体切换组件
 * 
 * 用于在 TheoryHome、AcademyHome 等页面顶部提供变体选择器。
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
  className 
}: VariantToggleProps) {
  return (
    <div className={cn('inline-flex flex-wrap gap-2', className)} role="group" aria-label="选择游戏变体">
      {variants.map((v) => (
        <VariantToggleItem
          key={v}
          variant={v}
          selected={v === active}
          onClick={() => onSelect?.(v)}
        />
      ))}
    </div>
  );
}

export type VariantToggleComponent = typeof VariantToggle;
