import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * 同步 document.title：`页名 · 应用名`；未传页名时回退到应用名。
 * 应用名取 i18n `nav.appSubtitle`，避免英文界面残留中文平台名。
 * 卸载/页名变更时恢复进入前的标题，避免布局切换残留。
 */
export function useDocumentTitle(title?: string) {
  const { t } = useTranslation();
  const appName = t('nav.appSubtitle');
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${appName}` : appName;
    return () => {
      document.title = previous;
    };
  }, [title, appName]);
}
