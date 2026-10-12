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

  // globals.css 的 prefers-reduced-motion 兜底只压 CSS transition/animation，
  // 压不住 framer-motion 写入的 inline transform，需在此声明式接管
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
