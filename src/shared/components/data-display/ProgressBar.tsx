import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md';
  /** 无障碍名称：进度条无可见文字时必填，否则读屏只播报数值 */
  label?: string;
}

/**
 * 进度条（共享组件）：strategy-academy CourseView / LessonUnit 进度、
 * theory-academy ChapterView level 进度共用。
 * 视觉令牌（DESIGN.md §5.11）：--progress-track 轨道 + 黄铜渐变填充 + 弱 glow。
 */
export function ProgressBar({ value, className, size = 'md', label }: ProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      aria-label={label}
      className={cn(
        'w-full rounded-full bg-[var(--progress-track)] overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5',
        className
      )}
    >
      <div
        className="h-full rounded-full bg-[linear-gradient(90deg,var(--brass),var(--brass-bright))] shadow-[0_0_6px_color-mix(in_srgb,var(--brass-bright)_35%,transparent)] transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
