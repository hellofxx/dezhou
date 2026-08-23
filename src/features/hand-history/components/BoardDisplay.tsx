import { motion } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionStandard } from '@/shared/utils/motion';
import { PokerCard } from '@/shared/components/poker/Card';
import type { Card } from '@/shared/types/poker';

interface BoardDisplayProps {
  cards: Card[];
  totalBoard: Card[];
  className?: string;
}

/**
 * Displays community cards with flip animation.
 * New cards appear with a 3D flip effect.
 */
export function BoardDisplay({ cards, totalBoard, className }: BoardDisplayProps) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className ?? ''}`}>
      {totalBoard.map((card, index) => {
        const isVisible = cards.some(c => c.rank === card.rank && c.suit === card.suit);
        return (
          <motion.div
            key={`${card.rank}-${card.suit}-${index}`}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...transitionStandard, delay: index * 0.1 }}
          >
            <PokerCard
              card={card}
              faceDown={!isVisible}
              size="md"
              animationDelay={index * 0.15}
            />
          </motion.div>
        );
      })}
      {/* Empty slots for remaining cards（异常数据 board >5 时防负长度 RangeError） */}
      {Array.from({ length: Math.max(0, 5 - totalBoard.length) }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="w-16 h-[90px] rounded-lg border border-dashed border-[var(--walnut-border)]/40"
        />
      ))}
    </div>
  );
}
