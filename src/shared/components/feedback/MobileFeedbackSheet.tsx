/**
 * 移动端反馈底部 Sheet 组件（§13.7.2）
 *
 * @module shared/components/feedback/MobileFeedbackSheet
 * @description 移动端（<768px）底部滑出的反馈面板：fixed 定位 + 遮罩 + 顶部拖拽手柄。
 * 桌面端展示形式由消费方决定，本组件只负责移动端底部 Sheet 形态；
 * 项目暂无 shadcn Sheet（src/shared/components/ui/sheet.tsx），故手写实现。
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { transitionStandard } from '@/shared/utils/motion';

interface MobileFeedbackSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  /** 可选手柄标签 */
  ariaLabel?: string;
}

export function MobileFeedbackSheet({
  open,
  onOpenChange,
  children,
  ariaLabel,
}: MobileFeedbackSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* 遮罩：点击关闭 */}
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={transitionStandard}
        className="fixed inset-x-0 bottom-0 flex flex-col rounded-t-lg bg-[var(--poker-felt)]"
      >
        {/* 顶部中央拖拽手柄 */}
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-8 rounded-full bg-[var(--poker-ivory-muted)] opacity-40" />
        </div>
        {/* 内容区域 */}
        <div className="max-h-[70vh] overflow-y-auto p-4">{children}</div>
      </motion.div>
    </div>
  );
}
