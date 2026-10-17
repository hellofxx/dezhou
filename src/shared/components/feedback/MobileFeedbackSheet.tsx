/**
 * 移动端反馈底部 Sheet 组件（§13.7.2）
 *
 * @module shared/components/feedback/MobileFeedbackSheet
 * @description 移动端（<768px）底部滑出的反馈面板：dealer-slip 纸张材质（§1.5 / §5.23）
 * + Radix Dialog 提供完整 dialog 语义（Escape 关闭 / 焦点陷阱 / 焦点归还 / 背景滚动锁）。
 * 桌面端展示形式由消费方决定，本组件只负责移动端底部 Sheet 形态。
 * 入场/退场动效由 globals.css 的 .dialog-overlay / .dealer-slip--sheet[data-state]
 * keyframes 驱动（§8 / §13.7.2）——未启用 tailwindcss-animate，animate-in 等类为空操作。
 */

import { useRef, type ReactNode } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface MobileFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** 可选的 sr-only 标题文案（缺省 common.ui.feedback） */
  ariaLabel?: string;
}

export function MobileFeedbackSheet({
  open,
  onOpenChange,
  children,
  ariaLabel,
}: MobileFeedbackSheetProps) {
  const { t } = useTranslation();
  const closeLabel = t('common.ui.close');
  // 本 Sheet 由消费方受控打开、没有 DialogTrigger，Radix 默认的「关闭后焦点归还」
  // 依赖 triggerRef，无 trigger 时焦点会掉到 body（WCAG 2.4.3 焦点顺序丢失）。
  // 故在自动聚焦前记录打开者，关闭时显式归还。
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* 遮罩：点击关闭由 Radix DismissableLayer（modal 外部指针/点击）接管 */}
        <DialogPrimitive.Overlay className="dialog-overlay fixed inset-0 z-[100] bg-[var(--surface-overlay)]" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="dealer-slip dealer-slip--sheet fixed inset-x-0 bottom-0 z-[100] flex max-h-[70vh] flex-col pb-[env(safe-area-inset-bottom,0px)]"
          onOpenAutoFocus={() => {
            const active = document.activeElement;
            restoreFocusRef.current =
              active instanceof HTMLElement && active !== document.body ? active : null;
          }}
          onCloseAutoFocus={(event) => {
            const target = restoreFocusRef.current;
            if (target?.isConnected) {
              event.preventDefault();
              target.focus();
            }
          }}
        >
          {/* 标题 sr-only：Radix 以 aria-labelledby 关联，保证 Sheet 有可读名称 */}
          <DialogPrimitive.Title className="sr-only">
            {ariaLabel ?? t('common.ui.feedback')}
          </DialogPrimitive.Title>

          {/* 顶部拖拽手柄：32×4（§13.7.2） */}
          <div aria-hidden="true" className="flex justify-center pb-1 pt-2.5">
            <span className="h-1 w-8 rounded-full bg-[var(--paper-rule)] opacity-60" />
          </div>

          {/* 关闭按钮：44×44 触摸目标（§6.3） */}
          <DialogPrimitive.Close
            aria-label={closeLabel}
            className="absolute right-2 top-2 grid h-11 w-11 place-items-center rounded-sm text-[var(--paper-ink-dim)] transition-colors hover:bg-[var(--paper-raised)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--paper-brass)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </DialogPrimitive.Close>

          {/* 内容区域 */}
          <div className="min-h-0 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
