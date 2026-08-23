import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export interface LiveDotProps {
  className?: string;
}

/**
 * LiveDot — 呼吸脉冲指示器，用于"进行中/待处理"状态面板。
 * 纯 CSS 动画，无 framer-motion。
 */
export default function LiveDot({ className }: LiveDotProps) {
  const { t } = useTranslation();
  return <span className={cn('live-dot', className)} role="status" aria-label={t('common.ui.live')} />;
}
