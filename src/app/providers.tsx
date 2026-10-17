import { useEffect } from 'react';
import { MotionConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { useProgressStore } from '@/features/progress/store';

export function Providers({ children }: { children: React.ReactNode }) {
  // 启动时恢复语言偏好：事实源为 progress store settings.language（persist 同步 rehydrate）
  useEffect(() => {
    const lang = useProgressStore.getState().settings.language;
    if (lang && lang !== i18n.language) {
      i18n.changeLanguage(lang);
    }
  }, []);

  // <html lang> 随语言同步：中文统一为 zh-CN（读屏器与浏览器连字/断行依赖此属性）
  useEffect(() => {
    const apply = (lng: string) => {
      document.documentElement.lang = lng.startsWith('zh') ? 'zh-CN' : lng;
    };
    apply(i18n.language);
    i18n.on('languageChanged', apply);
    return () => {
      i18n.off('languageChanged', apply);
    };
  }, []);

  // globals.css 的 prefers-reduced-motion 兜底只压 CSS transition/animation，
  // 压不住 framer-motion 写入的 inline transform，需在此声明式接管
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
