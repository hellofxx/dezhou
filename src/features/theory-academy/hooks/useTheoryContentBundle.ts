import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  isTheoryContentBundleLoaded,
  loadTheoryContentBundle,
} from '@/i18n/theoryContent';
import { normalizeLanguage } from '@/i18n/moduleRegistry';

/**
 * 非 level 内容包就绪 hook（术语表 / 参考书目）。
 * 这些文案不在 theory.json，也不属于任何 tN 正文包；页面必须在渲染前显式加载，
 * 否则术语 key 会退化成 key 尾段。语言切换时按目标语言重新加载。
 */
export function useTheoryContentBundle(bundleId: string): boolean {
  const { i18n } = useTranslation();
  const lang = normalizeLanguage(i18n.language);
  const [ready, setReady] = useState(() => isTheoryContentBundleLoaded(bundleId, lang));

  useEffect(() => {
    let active = true;
    setReady(isTheoryContentBundleLoaded(bundleId, lang));
    void loadTheoryContentBundle(bundleId, lang).then(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
    };
  }, [bundleId, lang]);

  return ready;
}
