import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md';
}

export function ProgressBar({ value, className, size = 'md' }: ProgressBarProps) {
  return (
    <div
      className={cn(
        'w-full rounded-full bg-[var(--walnut-raised)] overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-[var(--brass-bright)] transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
