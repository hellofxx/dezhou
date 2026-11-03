/**
 * 游戏变体图标（Lucide 单源）
 *
 * @module shared/components/business/VariantGlyph
 * @description 变体切换 UI 的统一图标出口：标准=黑桃 / 短牌=闪电 / 单挑=交叉剑。
 * 变体名称由相邻文案承担，图标对读屏器隐藏。
 */
import { Spade, Swords, Zap, type LucideIcon } from 'lucide-react';
import type { GameVariant } from '@/shared/types/poker';
import { cn } from '@/shared/utils/cn';

const VARIANT_ICON_COMPONENTS: Record<GameVariant, LucideIcon> = {
  standard: Spade,
  'short-deck': Zap,
  'heads-up': Swords,
};

interface VariantGlyphProps {
  variant: GameVariant;
  /** 图标边长（px），默认 16 */
  size?: number;
  className?: string;
}

export function VariantGlyph({ variant, size = 16, className }: VariantGlyphProps) {
  const Icon = VARIANT_ICON_COMPONENTS[variant];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    />
  );
}