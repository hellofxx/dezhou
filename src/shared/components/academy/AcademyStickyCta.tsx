/**
 * AcademyStickyCta — 移动端 sticky 底部 CTA 的单 DOM 节点响应式容器（两院共用）。
 * 移动：fixed 悬浮于 MobileNav（z-50）之上让位 h-14 + safe-area，walnut 底 + 边框；
 * 桌面（md+）：还原为内联右对齐（static）。单节点避免移动/桌面双渲染致 getByText 多匹配。
 * 消费者把 ui/Button 作 children 传入；本件只负责定位与材质外壳，不产按钮。
 */
import type { ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

interface AcademyStickyCtaProps {
  /** CTA 内容（消费者传入 ui/Button） */
  children: ReactNode;
  className?: string;
}

export function AcademyStickyCta({ children, className }: AcademyStickyCtaProps) {
  return (
    <div
      className={cn(
        'fixed inset-x-4 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)] z-40',
        'rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut)] p-3 shadow-lg',
        'md:static md:inset-auto md:mt-6 md:flex md:justify-end',
        'md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none',
        className,
      )}
    >
      {children}
    </div>
  );
}