import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTranslation } from 'react-i18next';

/**
 * Global Toast system powered by sonner.
 * Usage: import { toast } from '@/shared/components/ui/toast';
 * toast.success('操作成功');
 * toast.error('操作失败');
 * toast.info('提示信息');
 * toast.warning('警告信息');
 */

export function Toaster() {
  const { t } = useTranslation();
  const closeLabel = t('common.ui.close');

  return (
    <SonnerToaster
      position="bottom-right"
      duration={3000}
      closeButton
      // 层级与移动端底栏同层（DESIGN.md §6.4：nav 与 toast 同为 50）
      style={{ zIndex: 50 }}
      toastOptions={{
        closeButtonAriaLabel: closeLabel,
        style: {
          background: 'var(--felt)',
          border: '1px solid var(--walnut-border)',
          color: 'var(--ivory)',
        },
      }}
    />
  );
}

export { toast };
