/**
 * 对手画像图标（Lucide 单源）
 *
 * @module shared/components/business/OpponentGlyph
 * @description `OpponentProfile.iconId` 的唯一渲染出口：TAG=标签 / LAG=火焰 / Nit=冰霜 /
 * Maniac=闪电 / Calling Station=电话 / Unknown=问号。画像名始终以相邻文案呈现，图标对读屏器隐藏。
 */
import {
  Flame,
  HelpCircle,
  Phone,
  Snowflake,
  Tag,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { OpponentIconId } from '@/shared/types/opponent';
import { cn } from '@/shared/utils/cn';

const OPPONENT_ICON_COMPONENTS: Record<OpponentIconId, LucideIcon> = {
  target: Tag,
  flame: Flame,
  snowflake: Snowflake,
  zap: Zap,
  phone: Phone,
  help: HelpCircle,
};

interface OpponentGlyphProps {
  iconId: OpponentIconId;
  /** 图标边长（px），默认 16 */
  size?: number;
  className?: string;
}

export function OpponentGlyph({ iconId, size = 16, className }: OpponentGlyphProps) {
  const Icon = OPPONENT_ICON_COMPONENTS[iconId];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    />
  );
}