/**
 * 结果页标题区（共享）。
 *
 * 只负责「标题 + 副标题 + 可选 ring 槽」，不包裹页面材质 —— 纸张（`.dealer-slip`）、
 * felt、`walnut-panel` 等外壳仍由各结果页自己持有（DESIGN.md §1.5 材质契约）。
 *
 * 约定：
 * - `headingLevel` 决定文档层级：整页结果页用 h1，嵌入页 / 卡片内结果用 h2。
 *   （本文件同时含 h1 / h2 分支，故登记在 pageHeadingGuard 的 H1_ALLOWLIST：
 *   「共享结果页标题，按 headingLevel 渲染」）
 * - `tone` 只驱动前导图形与图形色（§2.7 文本专用色阶）；纸面作用域内由 `.dealer-slip` 重锚。
 *   标题与副标题保持 `--ivory` / `--ivory-muted`，避免同一组件在两套材质下出现两套正文色。
 * - `ring` 由调用方传入（准确率环 / ProgressRing 等），本组件只提供居中容器与 24px 间距。
 */
import type { ReactNode } from 'react';
import { CircleAlert, TriangleAlert, Trophy, type LucideIcon } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

export type ResultTone = 'neutral' | 'success' | 'warning' | 'danger';

export type ResultHeadingLevel = 'h1' | 'h2';

export interface ResultHeaderProps {
  title: string;
  subtitle?: string;
  /** 默认 neutral：不渲染前导图形 */
  tone?: ResultTone;
  /** 默认 h1（整页结果视图）；嵌入页用 h2 */
  headingLevel?: ResultHeadingLevel;
  /** 标题下方的环形指标槽（准确率环等），不传则不占位 */
  ring?: ReactNode;
  className?: string;
}

/** tone → 前导图形；neutral 不渲染图形（纯标题场景不该被图标干扰） */
const TONE_ICONS: Record<ResultTone, LucideIcon | null> = {
  neutral: null,
  success: Trophy,
  warning: TriangleAlert,
  danger: CircleAlert,
};

/** tone → 图形色（§2.7：黄铜文字走 --brass-text，错误走 --danger-text；§2.1 --brass-bright 仅作图标） */
const TONE_ICON_COLORS: Record<ResultTone, string> = {
  neutral: 'text-[var(--ivory-muted)]',
  success: 'text-[var(--brass-bright)]',
  warning: 'text-[var(--brass-text)]',
  danger: 'text-[var(--danger-text)]',
};

/** 标题字号：整页结果 28px；嵌入页结果沿用 2xl→3xl 响应式档（DESIGN.md §3.3） */
const HEADING_SIZE: Record<ResultHeadingLevel, string> = {
  h1: 'text-[28px]',
  h2: 'text-2xl md:text-3xl',
};

export function ResultHeader({
  title,
  subtitle,
  tone = 'neutral',
  headingLevel = 'h1',
  ring,
  className,
}: ResultHeaderProps) {
  const ToneIcon = TONE_ICONS[tone];

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          {ToneIcon ? (
            <ToneIcon className={cn('w-6 h-6 shrink-0', TONE_ICON_COLORS[tone])} aria-hidden="true" />
          ) : null}
          {headingLevel === 'h1' ? (
            <h1 className={cn('font-display text-[var(--ivory)] tracking-wide', HEADING_SIZE.h1)}>
              {title}
            </h1>
          ) : (
            <h2 className={cn('font-display text-[var(--ivory)] tracking-wide', HEADING_SIZE.h2)}>
              {title}
            </h2>
          )}
        </div>
        {subtitle ? <p className="text-sm text-[var(--ivory-muted)]">{subtitle}</p> : null}
      </div>
      {ring ? <div className="flex justify-center">{ring}</div> : null}
    </div>
  );
}
