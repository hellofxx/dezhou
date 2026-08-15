/**
 * 评级徽章组件 - 五级反馈统一视觉呈现
 *
 * @module shared/components/feedback/GradeBadge
 * @description 跨模块复用 GradeBadge 徽章（pot-odds/gto-simulator/puzzle-trainer/strategy-academy/hand-history）
 * @see shared/types/decisionFeedback.ts GRADE_DISPLAY_CONFIG 为唯一事实源
 */

import { useTranslation } from 'react-i18next';
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

interface GradeBadgeProps {
  grade: DecisionGrade;           // 必需：五级评级之一
  size?: 'sm' | 'md' | 'lg';      // 可选：尺寸变体（默认'md'）
}

export function GradeBadge({ grade, size = 'md' }: GradeBadgeProps) {
  const { t } = useTranslation();
  const config = GRADE_DISPLAY_CONFIG[grade];

  const fontSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm';
  const iconSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-sm';

  return (
    <div className={`${config.color} feedback-grade inline-flex items-center gap-2 rounded px-2.5 py-1`}>
      <span className={iconSize} aria-hidden="true">{config.icon}</span>
      <span className={`font-semibold ${config.textColor} ${fontSize}`}>
        {t(config.titleKey)}
      </span>
    </div>
  );
}
