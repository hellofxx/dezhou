/**
 * 牌室设置纸条（批次 3）：`/settings` 由整页改为发牌员纸条浮层。
 *
 * 组合既有 components/settings/* 分区（SettingsPage 持有的主题 / 语言 / 导师 / 训练偏好 /
 * 游戏变体 / 数据管理 / 开发者选项），不复制任何设置读写逻辑——浮层只负责纸张外壳与关闭出口。
 * 浮层宿主只用 shared `ui/Dialog`（overlayLayer 守卫单源：焦点陷阱 / Escape / 纸条材质）。
 * SettingsPage 走 React.lazy：纸张外壳随壳层进入首屏，设置面本体仍是独立 chunk。
 */
import { Suspense, lazy } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/shared/components/ui/dialog';
import { PageSkeleton } from '@/shared/components/feedback/LoadingState';

const SettingsPage = lazy(() => import('./SettingsPage'));

export interface SettingsSlipProps {
  /** 路由层传入；`/settings` 恒为 true（关闭即离开路由） */
  open: boolean;
  /** 关闭纸条：Escape / 遮罩 / 右上角关闭按钮统一走此出口 */
  onClose: () => void;
}

export default function SettingsSlip({ open, onClose }: SettingsSlipProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        // 可见标题由 SettingsPage 的 hero（h2）承担，此处只提供对话框可访问名称
        aria-describedby={undefined}
        className="max-w-[760px] w-[calc(100vw-2rem)] max-h-[86vh] overflow-hidden p-4 md:p-6"
      >
        <DialogTitle className="sr-only">
          {t('settings.title', { defaultValue: '设置' })}
        </DialogTitle>
        <div className="max-h-[76vh] overflow-y-auto pr-1 -mr-1">
          <Suspense fallback={<PageSkeleton />}>
            <SettingsPage />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  );
}
