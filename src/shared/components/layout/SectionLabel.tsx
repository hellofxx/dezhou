import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

export type SectionLabelAs = 'h2' | 'h3' | 'p' | 'span';

export interface SectionLabelProps {
  /** 语义标签；默认 h2，禁止 h1（整页标题由壳层持有） */
  as?: SectionLabelAs;
  /** 可选前置图标（已翻译/装饰性图标由调用方提供） */
  icon?: ReactNode;
  /** 可选计数（数字或已格式化文本） */
  count?: ReactNode;
  /** 分组标题需要锚点时传入 */
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * 共享 section / panel 标签（理论 / 策略 / 学院面板共用）。
 *
 * 只负责排版与语义，不读 store、不做业务分派；颜色与字距对齐 DESIGN.md 的
 * section label 样式。图标与计数由调用方提供，计数统一 font-numeric。
 */
export function SectionLabel({
  as: Tag = 'h2',
  icon,
  count,
  id,
  className,
  children,
}: SectionLabelProps) {
  return (
    <Tag
      id={id}
      className={cn(
        'text-[11px] uppercase tracking-[0.22em] text-[var(--brass-text)] font-semibold',
        className
      )}
    >
      {icon ? (
        <span className="mr-1.5 inline-flex shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children}
      {count !== undefined ? (
        <span className="ml-1.5 font-numeric text-[11px] text-[var(--ivory-muted)]">{count}</span>
      ) : null}
    </Tag>
  );
}
