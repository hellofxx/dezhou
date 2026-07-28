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
 * Renders a classic card back: deep red ground with diamond lattice
 * and a centered gold crest. Gold border frames the design.
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
        {/* Deep red gradient background */}
        <linearGradient id={`cb-bg-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b1a1a" />
          <stop offset="50%" stopColor="#6b1414" />
          <stop offset="100%" stopColor="#4a0e0e" />
        </linearGradient>
        {/* Classic diamond lattice pattern */}
        <pattern id={`cb-pat-${size}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="12" height="12" fill="none" />
          <rect x="3" y="3" width="6" height="6" fill="none" stroke="#c8a456" strokeWidth="0.6" rx="0.5" />
        </pattern>
      </defs>
      {/* Card base with gold border */}
      <rect x="0.5" y="0.5" width="79" height="111" rx="6" fill={`url(#cb-bg-${size})`} stroke="#c8a456" strokeWidth="1.5" />
      {/* Inner frame line */}
      <rect x="4" y="4" width="72" height="104" rx="4" fill="none" stroke="#e8c86e" strokeWidth="0.75" strokeOpacity="0.6" />
      {/* Diamond lattice pattern */}
      <rect x="5" y="5" width="70" height="102" rx="3" fill={`url(#cb-pat-${size})`} opacity="0.7" />
      {/* Center crest — gold diamond with inner detail */}
      <g transform="translate(40,56)">
        <rect x="-18" y="-18" width="36" height="36" rx="2" transform="rotate(45)" fill="none" stroke="#e8c86e" strokeWidth="1.5" />
        <rect x="-12" y="-12" width="24" height="24" rx="1" transform="rotate(45)" fill="#4a0e0e" stroke="#c8a456" strokeWidth="1" />
        <circle cx="0" cy="0" r="5" fill="#c8a456" opacity="0.9" />
        <circle cx="0" cy="0" r="2.5" fill="#e8c86e" />
      </g>
      {/* Corner ornaments */}
      <circle cx="12" cy="12" r="3" fill="none" stroke="#c8a456" strokeWidth="0.75" opacity="0.7" />
      <circle cx="68" cy="12" r="3" fill="none" stroke="#c8a456" strokeWidth="0.75" opacity="0.7" />
      <circle cx="12" cy="100" r="3" fill="none" stroke="#c8a456" strokeWidth="0.75" opacity="0.7" />
      <circle cx="68" cy="100" r="3" fill="none" stroke="#c8a456" strokeWidth="0.75" opacity="0.7" />
    </svg>
  );
}
