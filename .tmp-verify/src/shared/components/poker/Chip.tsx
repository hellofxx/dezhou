import { cn } from '@/shared/utils/cn';

interface ChipProps {
  amount: number;
  color?: 'red' | 'blue' | 'green' | 'black' | 'white' | 'brass' | 'frost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * COLOR_MAP — references CSS variables (§11.1 token centralization).
 * Each entry: [base, light-stop, dark-stop, text-color]
 * §5.2 radial gradient circle at 35% 35%, §10.3 chip-red = #a83838 (clay)
 * UI-04：渐变 stop 裸 hex 逐一锚定 token（近似关系，见 DESIGN_LANGUAGE §5.2/§10.3）：
 * - red.light #c85555 / red.dark #7a2828 ≈ --poker-clay 亮/暗 stop（chip-red #a83838 同族）
 * - blue.light #5a6a8a / blue.dark #3a4a6a ≈ --poker-indigo 亮/暗 stop
 * - green.light #7aa66a / green.dark #4a6a3a ≈ --poker-moss 亮/暗 stop
 * - black.light #2a1f12 / black.dark #120d07 ≈ --walnut 亮/暗 stop
 * - white.light #fff8e8 ≈ --ivory 亮 stop；white.dark #8a8068 ≈ --ivory-dim 暗 stop
 * - frost.light #c8dde6 ≈ --poker-frost 亮 stop；frost.text #0d1b26 ≈ --felt-deep 同族
 */
const COLOR_MAP = {
  red:   { base: 'var(--poker-clay)',   light: '#c85555', dark: '#7a2828', text: 'var(--ivory)' },
  blue:  { base: 'var(--poker-indigo)', light: '#5a6a8a', dark: '#3a4a6a', text: 'var(--ivory)' },
  green: { base: 'var(--poker-moss)',   light: '#7aa66a', dark: '#4a6a3a', text: 'var(--ivory)' },
  black: { base: 'var(--walnut)',       light: '#2a1f12', dark: '#120d07', text: 'var(--ivory)' },
  white: { base: 'var(--ivory)',        light: '#fff8e8', dark: '#8a8068', text: 'var(--primary-foreground)' },
  brass: { base: 'var(--brass)',        light: 'var(--brass-bright)', dark: 'var(--brass-dark)', text: 'var(--primary-foreground)' },
  frost: { base: 'var(--poker-frost)',  light: '#c8dde6', dark: 'var(--poker-frost-deep)', text: '#0d1b26' },
} as const;

const SIZE_MAP = {
  sm: { diameter: 24, fontSize: 0, strokeWidth: 2 },
  md: { diameter: 36, fontSize: 10, strokeWidth: 2.5 },
  lg: { diameter: 48, fontSize: 14, strokeWidth: 3 },
} as const;

/**
 * Poker chip component displaying an amount.
 * §5.2: radial gradient circle at 35% 35%, font-numeric for amounts.
 * Different colors represent different denominations.
 */
export function Chip({ amount, color = 'red', size = 'md', className }: ChipProps) {
  const colors = COLOR_MAP[color];
  const { diameter, fontSize, strokeWidth } = SIZE_MAP[size];
  const radius = diameter / 2;
  const showAmount = size !== 'sm';

  const formatAmount = (n: number) => {
    if (n >= 1000) return `${n / 1000}k`;
    return String(n);
  };

  const gradientId = `chip-grad-${color}-${size}`;

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      className={cn('block font-numeric', className)}
      role="img"
      aria-label={`${color} chip${showAmount && amount > 0 ? ` ${amount}` : ''}`}
    >
      <defs>
        {/* §5.2 radial gradient — circle at 35% 35% for 3D chip face */}
        <radialGradient id={gradientId} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={colors.light} />
          <stop offset="55%" stopColor={colors.base} />
          <stop offset="100%" stopColor={colors.dark} />
        </radialGradient>
      </defs>

      {/* Outer ring with radial gradient fill */}
      <circle cx={radius} cy={radius} r={radius - 1} fill={`url(#${gradientId})`} stroke={colors.dark} strokeWidth={strokeWidth} />

      {/* Edge dashes (chip texture) */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 8;
        const x1 = radius + (radius - strokeWidth) * Math.cos(angle);
        const y1 = radius + (radius - strokeWidth) * Math.sin(angle);
        const x2 = radius + (radius - strokeWidth - 3) * Math.cos(angle);
        const y2 = radius + (radius - strokeWidth - 3) * Math.sin(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={colors.text}
            strokeWidth="1.5"
            opacity="0.4"
          />
        );
      })}

      {/* Inner circle */}
      <circle cx={radius} cy={radius} r={radius - strokeWidth - 4} fill="none" stroke={colors.text} strokeWidth="1" opacity="0.4" />

      {/* Amount text — §3.1/§11.5 font-numeric (JetBrains Mono) */}
      {showAmount && fontSize > 0 && (
        <text
          x={radius}
          y={radius}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontWeight="bold"
          fontSize={fontSize}
          fill={colors.text}
        >
          {formatAmount(amount)}
        </text>
      )}
    </svg>
  );
}
