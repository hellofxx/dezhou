import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Unified empty state component for all modules.
 * Displays an emoji icon, title, description, and optional action button.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 text-center px-4"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--walnut-raised)]/40 flex items-center justify-center mb-4 text-3xl">
        {icon}
      </div>
      <h3 className="text-base font-display font-semibold text-[var(--ivory)] mb-2">
        {title}
      </h3>
      <p className="text-sm text-[var(--ivory-muted)] max-w-xs mb-4">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-[var(--brass)] text-[var(--primary-foreground)] text-sm font-display font-semibold hover:bg-[var(--brass-bright)] transition-colors"
          aria-label={action.label}
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
}
