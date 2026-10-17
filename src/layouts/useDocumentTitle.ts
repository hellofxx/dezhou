import { useEffect } from 'react';
import { APP_NAME } from '@/shared/constants/app';

/**
 * 同步 document.title：`页名 · 应用名`；未传页名时回退到应用名。
 * 卸载/页名变更时恢复进入前的标题，避免布局切换残留。
 */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
