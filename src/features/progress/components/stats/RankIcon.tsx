/**
 * ELO 段位图标（Lucide 单源）
 *
 * @module progress/components/stats/RankIcon
 * @description 段位徽章的图标出口（仪表盘牌桌 / 进度铭牌 / 弱点分析 / 多变体概览）。
 * 段位名始终以相邻文案呈现，图标对读屏器隐藏。
 * 庆祝插画（RankUpCelebration）保留 `Rank.icon` 的牌室化 emoji，不走本组件。
 */
import { Club, Diamond, Heart, Spade, Sprout, Target, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/** 段位语义 name（与 RANKS[].name 一致）→ Lucide 图标 */
const RANK_ICON_COMPONENTS: Record<string, LucideIcon> = {
  rookie: Sprout,
  entry: Target,
  intermediate: Spade,
  mid: Heart,
  advanced: Diamond,
  expert: Club,
};

interface RankIconProps {
  /** 段位语义 name（RANKS[].name） */
  name: string;
  /** 图标边长（px），默认 16 */
  size?: number;
  className?: string;
}

export function RankIcon({ name, size = 16, className }: RankIconProps) {
  const Icon = RANK_ICON_COMPONENTS[name] ?? Spade;
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={cn('shrink-0', className)}
      aria-hidden="true"
    />
  );
}