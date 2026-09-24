import { cn } from '@/shared/utils/cn';

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { width: 48, height: 67 },
  md: { width: 64, height: 90 },
  lg: { width: 80, height: 112 },
} as const;

/**
 * Card back component using inline SVG.
 * DESIGN_LANGUAGE §5.1：胡桃底 + 45° 条纹 + 2px 黄铜边 + 内描金。
 * 描边/填充直接引用 CSS token（var(--brass) 等）；渐变 stop 需字面值，
 * 注释标注对应 token（#241a10 = --walnut / #1a1308 = walnut 暗阶）。
 */
export function CardBack({ size = 'md', className }: CardBackProps) {
  const { width, height } = SIZE_MAP[size];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 80 112"
      className={cn('block rounded-[var(--radius)]', className)}
    >
      <defs>
        {/* Walnut gradient background — #241a10 = --walnut, #1a1308 = walnut dark stop */}
        <linearGradient id={`cb-bg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a1e12" />
          <stop offset="50%" stopColor="#241a10" />
          <stop offset="100%" stopColor="#1a1308" />
        </linearGradient>
        {/* 45° brass stripe pattern（§5.1 牌背条纹） */}
        <pattern id={`cb-pat-${size}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="8" height="8" fill="none" />
          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(201,162,94,0.22)" strokeWidth="1.5" />
        </pattern>
      </defs>
      {/* Card base with 2px brass border */}
      <rect x="1" y="1" width="78" height="110" rx="6" fill={`url(#cb-bg-${size})`} stroke="var(--brass)" strokeWidth="2" />
      {/* Inner gold hairline（内描金） */}
      <rect x="4.5" y="4.5" width="71" height="103" rx="4" fill="none" stroke="var(--brass-bright)" strokeWidth="0.75" strokeOpacity="0.6" />
      {/* 45° stripe fill */}
      <rect x="6" y="6" width="68" height="100" rx="3" fill={`url(#cb-pat-${size})`} />
      {/* Center crest — brass diamond with rivet core（黄铜菱形嵌铆钉） */}
      <g transform="translate(40,56)">
        <rect x="-18" y="-18" width="36" height="36" rx="2" transform="rotate(45)" fill="none" stroke="var(--brass-bright)" strokeWidth="1.5" strokeOpacity="0.85" />
        <rect x="-12" y="-12" width="24" height="24" rx="1" transform="rotate(45)" fill="#1a1308" stroke="var(--brass)" strokeWidth="1" />
        <circle cx="0" cy="0" r="5" fill="var(--brass)" opacity="0.9" />
        <circle cx="0" cy="0" r="2.5" fill="var(--brass-bright)" />
      </g>
      {/* Corner ornaments — brass studs */}
      <circle cx="12" cy="12" r="3" fill="none" stroke="var(--brass)" strokeWidth="0.75" opacity="0.7" />
      <circle cx="68" cy="12" r="3" fill="none" stroke="var(--brass)" strokeWidth="0.75" opacity="0.7" />
      <circle cx="12" cy="100" r="3" fill="none" stroke="var(--brass)" strokeWidth="0.75" opacity="0.7" />
      <circle cx="68" cy="100" r="3" fill="none" stroke="var(--brass)" strokeWidth="0.75" opacity="0.7" />
    </svg>
  );
}
