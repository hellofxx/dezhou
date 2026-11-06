import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';

export interface ProgressRingProps {
  /** 完成值：与 valueMax 成对（默认 0-1 比例；valueMax=100 时为 0-100 百分比） */
  value: number;
  /** value 的量程：1 = 0-1 比例（默认）/ 100 = 百分比 */
  valueMax?: 1 | 100;
  /** 尺寸 px（默认 40，课程章节用 56，两院首屏 hero 环用 76） */
  size?: number;
  /** 状态覆盖：'idle' 未开始 / 'in-progress' 进行中 / 'complete' 已完成。
   *  不传时由 value 推导：value<=0 → idle, 0<value<valueMax → in-progress, value>=valueMax → complete */
  status?: 'idle' | 'in-progress' | 'complete';
  /** 视觉变体：'room' 牌室三色状态（默认）/ 'academy' 学院黄铜常亮（不因 idle 变灰） */
  variant?: 'room' | 'academy';
  /** 环心槽位（图标 / 百分比）；传入时环外层多一个 relative 容器承载绝对定位 */
  center?: React.ReactNode;
  /** 覆盖默认 progress.ring.aria 播报文案 */
  ariaLabel?: string;
  /** 无 center 时作用于 svg；有 center 时作用于外层容器 */
  className?: string;
}

type RingStatus = 'idle' | 'in-progress' | 'complete';

/** room 变体三色：idle walnut-border / in-progress brass / complete success */
const ROOM_STROKE: Record<RingStatus, string> = {
  idle: 'var(--poker-walnut-border)',
  'in-progress': 'var(--poker-brass)',
  complete: 'var(--poker-success)',
};

/**
 * ProgressRing — 进度环，SVG <circle> + stroke-dasharray 控制完成比例。
 * 用于概念节点 / 课程章节完成度指示（DESIGN.md §13.2.1）与两院首屏 hero 环。
 * room：三色状态；academy：轨道 --walnut-raised、填充 --brass-bright 常亮。
 */
export default function ProgressRing({
  value,
  valueMax = 1,
  size = 40,
  status,
  variant = 'room',
  center,
  ariaLabel,
  className,
}: ProgressRingProps) {
  const { t } = useTranslation();
  const isAcademy = variant === 'academy';
  const ratio = Math.min(1, Math.max(0, value / valueMax));
  const resolved: RingStatus =
    status ?? (ratio <= 0 ? 'idle' : ratio >= 1 ? 'complete' : 'in-progress');

  const strokeWidth = size <= 40 ? 3 : size <= 64 ? 4 : 6;
  const radius = size / 2 - strokeWidth / 2 - 1;
  const circumference = 2 * Math.PI * radius;
  // room 的 idle 无可见进度段（dashoffset = 周长整体隐藏）；academy 恒按实际比例绘制
  const dashOffset =
    resolved === 'idle' && !isAcademy ? circumference : circumference * (1 - ratio);
  const progressStroke = isAcademy ? 'var(--brass-bright)' : ROOM_STROKE[resolved];
  // room 的 idle 降透明度；academy 不因 idle 变灰
  const progressOpacity = !isAcademy && resolved === 'idle' ? 0.3 : undefined;
  const trackStroke = isAcademy ? 'var(--walnut-raised)' : 'var(--poker-walnut-border)';
  const trackOpacity = isAcademy ? undefined : 0.3;

  const pct = Math.round(ratio * 100);
  const label = ariaLabel ?? t('progress.ring.aria', { pct });
  const hasCenter = center !== undefined && center !== null;

  const ring = (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={cn('progress-ring', !hasCenter && className)}
    >
      {/* 底轨 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackStroke}
        strokeWidth={strokeWidth}
        opacity={trackOpacity}
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
        className={isAcademy ? 'transition-all duration-700' : undefined}
      />
    </svg>
  );

  if (!hasCenter) return ring;

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: size, height: size }}>
      {ring}
      <div className="absolute inset-0 flex items-center justify-center">{center}</div>
    </div>
  );
}
