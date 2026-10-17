import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { transitionStandard } from '@/shared/utils/motion';
import { Button } from '@/shared/components/ui/button';

interface EmptyStateProps {
  /** 支持 emoji 字符串或 ReactNode（lucide 图标等） */
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** 紧凑变体（用于仪表盘内嵌的小空状态，少一些 padding） */
  compact?: boolean;
}

/**
 * Unified empty state component for all modules.
 * Displays an icon (emoji or ReactNode), title, description, and optional action button.
 */
export function EmptyState({ icon, title, description, action, compact = false }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transitionStandard}
      className={`flex flex-col items-center justify-center text-center px-4 ${
        compact ? 'py-6' : 'py-16'
      }`}
    >
      <div
        className={`rounded-full bg-[var(--walnut-raised)]/40 flex items-center justify-center mb-3 text-[var(--brass)] ${
          compact ? 'w-10 h-10' : 'w-16 h-16 text-3xl mb-4'
        }`}
      >
        {icon}
      </div>
      <h3
        className={`font-display font-semibold text-[var(--ivory)] mb-1 ${
          compact ? 'text-sm' : 'text-base mb-2'
        }`}
      >
        {title}
      </h3>
      <p className={`text-[var(--ivory-muted)] max-w-xs ${compact ? 'text-xs' : 'text-sm mb-4'}`}>
        {description}
      </p>
      {action && (
        // 按钮金属族（DESIGN.md §5.5）：空态行动作走一级主 CTA，移动端自带 44px 触摸目标
        <Button type="button" onClick={action.onClick} className="font-display" aria-label={action.label}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
