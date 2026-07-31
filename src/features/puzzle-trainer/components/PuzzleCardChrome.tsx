/**
 * PuzzleCard 周边小组件（P1-D 修复批从 PuzzleCard.tsx 拆出以满足单文件 ≤200 行）：
 * - RushStatusBar：Rush 模式命数 / 连对数 / 连对奖励反馈
 * - InfoChip：手牌 / 位置 / 公共牌 / 底池等信息标签
 */
import { motion } from 'framer-motion';
import { Heart, Flame, Zap } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

/** Rush 模式状态条：命数 + 连对数 + 连对奖励反馈 */
export function RushStatusBar({
  lives,
  streak,
  bonusFeedback,
}: {
  lives?: number;
  streak?: number;
  bonusFeedback?: number;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* 命数 */}
      <div className="flex items-center gap-1">
        {typeof lives === 'number' &&
          Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={cn(
                'w-4 h-4',
                i < lives
                  ? 'fill-[var(--clay)] text-[var(--clay)]'
                  : 'text-[var(--walnut-border)]'
              )}
            />
          ))}
      </div>
      {/* 连对数 */}
      {typeof streak === 'number' && streak > 0 && (
        <div className="flex items-center gap-1 text-[var(--brass-bright)]">
          <Flame className="w-4 h-4" />
          <span className="font-numeric">{streak}</span>
        </div>
      )}
      {/* 连对奖励反馈 */}
      {bonusFeedback && bonusFeedback > 0 ? (
        <motion.span
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--brass-bright)]/20 text-[var(--brass-bright)] font-display text-xs"
        >
          <Zap className="w-3 h-3" />+{Math.floor(bonusFeedback / 1000)}s
        </motion.span>
      ) : null}
    </div>
  );
}

/** 信息标签 */
export function InfoChip({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--walnut)]/40 border border-[var(--walnut-border)]/40">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-dim)]">
        {label}
      </span>
      <span
        className={cn(
          'text-[var(--ivory)]',
          mono ? 'font-numeric tracking-wider' : 'font-display'
        )}
      >
        {value}
      </span>
    </div>
  );
}
