import { Suit, Rank } from '@/shared/types/poker';
import { SUIT_SYMBOLS, SUIT_COLORS, RANK_CARD_FACE_DISPLAY } from '@/shared/constants/poker';

interface CardSVGProps {
  suit: Suit;
  rank: Rank;
  width?: number;
  height?: number;
}

/**
 * Pure inline SVG renderer for a playing card face.
 * Renders rank + suit in corners and a large center suit symbol
 * on an ivory face with subtle paper texture — like a real playing card.
 */
export function CardSVG({ suit, rank, width = 80, height = 112 }: CardSVGProps) {
  const color = SUIT_COLORS[suit];
  const symbol = SUIT_SYMBOLS[suit];
  const display = RANK_CARD_FACE_DISPLAY[rank];
  // "10" 是两位数，在牌面角落略缩字号以免拥挤
  const rankFontSize = rank === Rank.Ten ? 12 : 14;

  // Card-face typography: a serif for the rank index (matching real playing
  // cards) and the system suit glyphs for the pips.
  const rankFont = `'Fraunces', 'Times New Roman', serif`;
  const suitFont = `'Inter Tight', system-ui, sans-serif`;

  const gradientId = `card-face-${suit}-${rank}`;
  const paperId = `paper-${suit}-${rank}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 80 112"
      className="block"
      role="img"
      aria-label={`${display} of ${suit}`}
    >
      <defs>
        {/* Subtle paper texture gradient — §5.1 card face #f8f2e2→#e5dcc4 */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8f2e2" />
          <stop offset="50%" stopColor="#efe6d0" />
          <stop offset="100%" stopColor="#e5dcc4" />
        </linearGradient>
        {/* Paper grain pattern */}
        <pattern id={paperId} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="none" />
          <circle cx="1" cy="1" r="0.3" fill="rgba(26,19,8,0.03)" />
          <circle cx="3" cy="3" r="0.2" fill="rgba(26,19,8,0.02)" />
        </pattern>
      </defs>

      {/* Ivory card face with paper texture — §5.1 rx=7 */}
      <rect x="0.75" y="0.75" width="78.5" height="110.5" rx="7" fill={`url(#${gradientId})`} stroke="rgba(26,19,8,0.15)" strokeWidth="1" />
      {/* Paper grain overlay */}
      <rect x="0.75" y="0.75" width="78.5" height="110.5" rx="7" fill={`url(#${paperId})`} />
      {/* Subtle inner highlight — reads as "pressed paper"; use ivory not pure white */}
      <rect x="2" y="2" width="76" height="108" rx="6" fill="none" stroke="rgba(243,235,217,0.6)" strokeWidth="0.5" />

      {/* Top-left rank + suit */}
      <text x="7" y="17" fontFamily={rankFont} fontWeight="600" fontSize={rankFontSize} fill={color}>{display}</text>
      <text x="7.5" y="29" fontFamily={suitFont} fontSize="11" fill={color}>{symbol}</text>

      {/* Center large suit */}
      <text x="40" y="64" fontFamily={suitFont} fontSize="34" fill={color} textAnchor="middle" dominantBaseline="middle">
        {symbol}
      </text>

      {/* Bottom-right rank + suit (rotated 180°) */}
      <g transform="rotate(180, 40, 56)">
        <text x="7" y="17" fontFamily={rankFont} fontWeight="600" fontSize={rankFontSize} fill={color}>{display}</text>
        <text x="7.5" y="29" fontFamily={suitFont} fontSize="11" fill={color}>{symbol}</text>
      </g>
    </svg>
  );
}
