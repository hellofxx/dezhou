import { Toaster as SonnerToaster, toast } from 'sonner';

/**
 * Global Toast system powered by sonner.
 * Usage: import { toast } from '@/shared/components/ui/toast';
 * toast.success('操作成功');
 * toast.error('操作失败');
 * toast.info('提示信息');
 * toast.warning('警告信息');
 */

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      duration={3000}
      richColors
      closeButton
      toastOptions={{
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
