import { Progress } from '@/shared/components/ui/progress';
import { cn } from '@/shared/utils/cn';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  size?: 'sm' | 'md';
  /** 无障碍名称：进度条无可见文字时必填，否则读屏只播报数值 */
  label?: string;
  /** 覆盖填充条视觉（如纯色 / 危险色），默认沿用黄铜渐变 */
  indicatorClassName?: string;
}

/**
 * 进度条（共享组件）：strategy-academy CourseView / LessonUnit 进度、
 * theory-academy ChapterView level 进度共用。
 *
 * 单一实现：薄包装 `ui/progress`（Radix），尺寸 / 填充视觉通过 className 传入；
 * 值统一钳制到 [0,100]，保证 aria-valuenow 与视觉比例一致。
 * 视觉令牌（DESIGN.md §5.11）：--progress-track 轨道 + 黄铜渐变填充 + 弱 glow。
 */
export function ProgressBar({
  value,
  className,
  size = 'md',
  label,
  indicatorClassName,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Progress
      value={clamped}
      label={label}
      className={cn(size === 'sm' ? 'h-1.5' : 'h-2.5', className)}
      indicatorClassName={cn(
        'shadow-[0_0_6px_color-mix(in_srgb,var(--brass-bright)_35%,transparent)] duration-500',
        indicatorClassName
      )}
    />
  );
}
