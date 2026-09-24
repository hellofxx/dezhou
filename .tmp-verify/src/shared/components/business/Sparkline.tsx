import { useId } from 'react';
import { cn } from '@/shared/utils/cn';

export interface SparklineProps {
  /** 7 日正确率数组（0-100） */
  data: number[];
  width?: number; // 默认 56，宽屏 72
  height?: number; // 默认 8
  className?: string;
}

/**
 * Sparkline — 迷你折线图，展示 7 日正确率趋势（DESIGN_LANGUAGE §13.2.2）。
 * 8px 高，无坐标轴 / 网格线 / 数据点，纯装饰性（aria-hidden）。
 * 线条 brass + 下方 8% 透明度渐变填充。
 */
export default function Sparkline({
  data,
  width = 56,
  height = 8,
  className,
}: SparklineProps) {
  const gradientId = useId().replaceAll(':', '');

  // 无法绘制单点或空数据
  if (data.length < 2) return null;

  const coords = data.map((v, i) => {
    const clamped = Math.min(100, Math.max(0, v));
    const x = (i / (data.length - 1)) * width;
    const y = height - (clamped / 100) * height;
    return { x, y };
  });

  const first = coords[0] ?? { x: 0, y: height };
  const last = coords[coords.length - 1] ?? { x: width, y: height };
  const polylinePoints = coords
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ');
  const linePath = coords
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
  // 渐变填充：沿折线向下闭合到基线
  const fillPath = `${linePath} L ${last.x.toFixed(2)} ${height} L ${first.x.toFixed(2)} ${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('sparkline', className)}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(201,162,94,0.08)" />
          <stop offset="100%" stopColor="rgba(201,162,94,0)" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <polyline
        points={polylinePoints}
        fill="none"
        stroke="var(--poker-brass)"
        strokeWidth={1}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
