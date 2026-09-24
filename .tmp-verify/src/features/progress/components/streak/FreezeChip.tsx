import { Snowflake } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export interface FreezeChipProps {
  /** 可用冻结卡数量 */
  count?: number;
  /** 像素尺寸，默认 28 */
  size?: number;
  /** 是否显示数量角标 */
  showCount?: boolean;
  className?: string;
}

/**
 * FreezeChip — 霜钢蓝筹码，用于 Streak Freeze 卡片。
 */
export default function FreezeChip({ count = 0, size = 28, showCount = false, className }: FreezeChipProps) {
  const { t } = useTranslation();
  return (
    <span className={cn('freeze-chip', className)} style={{ width: size, height: size }} aria-label={`${t('streak.freeze.label')} x${count}`}>
      <Snowflake size={size * 0.55} strokeWidth={2} aria-hidden="true" />
      {showCount && <span className="freeze-chip-count">x{count}</span>}
    </span>
  );
}
