import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export interface ProgressRingProps {
  /** 完成比例 0-1 */
  value: number;
  /** 尺寸 px（默认 40，课程章节用 56） */
  size?: number;
  /** 状态覆盖：'idle' 未开始 / 'in-progress' 进行中 / 'complete' 已完成。
   *  不传时由 value 推导：value<=0 → idle, 0<value<1 → in-progress, value>=1 → complete */
  status?: 'idle' | 'in-progress' | 'complete';
  className?: string;
}

type RingStatus = 'idle' | 'in-progress' | 'complete';

/**
 * ProgressRing — 进度环，SVG <circle> + stroke-dasharray 控制完成比例。
 * 用于概念节点 / 课程章节完成度指示（DESIGN_LANGUAGE §13.2.1）。
 * 三色状态：idle walnut-border / in-progress brass / complete success。
 */
export default function ProgressRing({
  value,
  size = 40,
  status,
  className,
}: ProgressRingProps) {
  const { t } = useTranslation();
  const resolved: RingStatus =
    status ?? (value <= 0 ? 'idle' : value >= 1 ? 'complete' : 'in-progress');

  const clamped = Math.min(1, Math.max(0, value));
  const strokeWidth = size <= 40 ? 3 : 4;
  const radius = size / 2 - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  // idle 无可见进度段（dashoffset = 周长整体隐藏）
  const dashOffset = resolved === 'idle' ? circumference : circumference * (1 - clamped);
  const progressStroke =
    resolved === 'complete'
      ? 'var(--poker-success)'
      : resolved === 'in-progress'
        ? 'var(--poker-brass)'
        : 'var(--poker-walnut-border)';
  const progressOpacity = resolved === 'idle' ? 0.3 : undefined;

  const pct = Math.round(clamped * 100);

  return (
    <svg
      role="img"
      aria-label={t('progress.ring.aria', { pct })}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn('progress-ring', className)}
    >
      {/* 底轨 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--poker-walnut-border)"
        strokeWidth={strokeWidth}
        opacity={0.3}
      />
      {/* 进度段 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={progressStroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        opacity={progressOpacity}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
