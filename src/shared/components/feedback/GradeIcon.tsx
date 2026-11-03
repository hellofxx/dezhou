/**
 * 五级决策反馈图标（Lucide 单源）
 *
 * @module shared/components/feedback/GradeIcon
 * @description `GRADE_DISPLAY_CONFIG[grade].iconId` 的唯一渲染出口；颜色随等级的 textColor token。
 * 等级文案始终在图标旁呈现，因此图标对读屏器隐藏（aria-hidden），避免语义重复。
 */
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  Star,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import {
  GRADE_DISPLAY_CONFIG,
  type DecisionGrade,
  type GradeIconId,
} from '@/shared/types/decisionFeedback';
import { cn } from '@/shared/utils/cn';

const GRADE_ICON_COMPONENTS: Record<GradeIconId, LucideIcon> = {
  star: Star,
  'circle-check': CircleCheck,
  'circle-dashed': CircleDashed,
  'circle-alert': CircleAlert,
  'triangle-alert': TriangleAlert,
};

interface GradeIconProps {
  grade: DecisionGrade;
  /** 图标边长（px），默认 20（与面板标题图标同档） */
  size?: number;
  className?: string;
}

export function GradeIcon({ grade, size = 20, className }: GradeIconProps) {
  const config = GRADE_DISPLAY_CONFIG[grade];
  const Icon = GRADE_ICON_COMPONENTS[config.iconId];
  return (
    <Icon
      size={size}
      strokeWidth={1.75}
      className={cn('shrink-0', config.textColor, className)}
      aria-hidden="true"
    />
  );
}