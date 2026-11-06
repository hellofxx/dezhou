/**
 * 结果页动作区（共享）。
 *
 * 复用 shadcn `Button`（DESIGN.md §5.5 按钮金属族）：
 * - primary → `default`（`.btn-brass` 一级金属主 CTA，每屏唯一）
 * - secondary → `secondary`（`.btn-metal` 二级金属）
 * - outline → `outline`（描边次动作）
 *
 * 无障碍：`type="button"` 防误提交；`min-h-11` 保证 ≥44px 触摸目标（§6.3 / §13.7.4）；
 * focus-visible ring 由 `Button` 基类的 `focus-visible:ring-2` 提供，勿在各页重复实现。
 */
import type { ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';

export interface ResultAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  /** 默认 primary */
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export interface ResultActionsProps {
  actions: ResultAction[];
  /** 默认 row：并排、自然宽度；stack：移动端整行堆叠、≥sm 回归并排并等分 */
  layout?: 'row' | 'stack';
  className?: string;
}

const BUTTON_VARIANTS = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
} as const;

const LAYOUT_CLASSES = {
  row: 'flex flex-wrap items-center justify-center gap-4',
  stack: 'flex flex-col gap-2 sm:flex-row',
} as const;

export function ResultActions({ actions, layout = 'row', className }: ResultActionsProps) {
  return (
    <div className={cn(LAYOUT_CLASSES[layout], className)}>
      {actions.map((action) => (
        <Button
          key={action.label}
          type="button"
          variant={BUTTON_VARIANTS[action.variant ?? 'primary']}
          onClick={action.onClick}
          className={cn('min-h-11', layout === 'stack' ? 'flex-1' : null, action.className)}
        >
          {action.icon ? (
            <span aria-hidden="true" className="inline-flex shrink-0">
              {action.icon}
            </span>
          ) : null}
          {action.label}
        </Button>
      ))}
    </div>
  );
}
