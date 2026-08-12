import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md';
}

/**
 * 进度条（共享组件）：strategy-academy CourseView / LessonUnit 进度、
 * theory-academy ChapterView level 进度共用。
 * 视觉令牌：walnut-raised 底 + brass-bright 填充，符合 design language。
 */
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
