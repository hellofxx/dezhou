import type { KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import type { Card } from '@/shared/types/poker';
import { RANK_CARD_FACE_DISPLAY } from '@/shared/constants/poker';
import { CardSVG } from '@/shared/components/poker/CardSVG';
import { CardBack } from '@/shared/components/poker/CardBack';
import { cn } from '@/shared/utils/cn';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';

interface CardProps {
  card: Card;
  faceDown?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  highlighted?: boolean;
  animationDelay?: number;
}

const SIZE_MAP = {
  sm: { width: 42, height: 60 },
  md: { width: 56, height: 80 },
  lg: { width: 76, height: 108 },
} as const;

/**
 * Playing card component with 3D flip animation.
 * Supports face-up/face-down states, highlighting, and click interactions.
 * Visual: ivory card face with paper texture, gold glow on highlight.
 */
export function PokerCard({
  card,
  faceDown = false,
  size = 'md',
  className,
  onClick,
  highlighted = false,
  animationDelay = 0,
}: CardProps) {
  const { t } = useTranslation();
  const { width, height } = SIZE_MAP[size];

  const showBack = faceDown;
  const interactive = Boolean(onClick);

  const ariaLabel = t('common.card.ariaLabel', {
    rank: RANK_CARD_FACE_DISPLAY[card.rank],
    suit: t(`common.card.suit.${card.suit}`),
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      // Space 默认会滚动页面，需拦截
      if (event.key === ' ') event.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      className={cn(
        'relative cursor-pointer select-none rounded-[var(--radius)]',
        highlighted && 'shadow-[var(--shadow-brass)]',
        interactive &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--felt-deep)]',
        className,
      )}
      style={{
        width,
        height,
        perspective: 600,
        filter: highlighted ? 'drop-shadow(0 0 8px rgba(232,201,126,0.65))' : undefined,
      }}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      initial={{ opacity: 0, y: -20, rotate: -5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{
        delay: animationDelay,
        duration: MOTION_DURATION.slow,
        ease: MOTION_EASE.spring,
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
    >
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: showBack ? 180 : 0 }}
        transition={{ duration: MOTION_DURATION.standard, ease: MOTION_EASE.out }}
      >
        {/* Front face — ivory card with paper texture */}
        <div
          className="absolute inset-0 rounded-[var(--radius)] overflow-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <CardSVG
            suit={card.suit}
            rank={card.rank}
            width={width}
            height={height}
            decorative={interactive}
          />
        </div>

        {/* Back face — classic red diamond pattern with gold border */}
        <div
          className="absolute inset-0 rounded-[var(--radius)] overflow-hidden"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <CardBack size={size} />
        </div>
      </motion.div>
    </motion.div>
  );
}
