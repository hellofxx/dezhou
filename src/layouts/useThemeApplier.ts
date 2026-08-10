import { useEffect } from 'react';
import { useProgressStore } from '@/features/progress/store';

/** 与 index.html 预渲染脚本保持同源（settings.theme → data-theme / color-scheme / theme-color） */
const THEME_COLOR_META: Record<'dark' | 'light', string> = {
  dark: '#0e1a14',
  light: '#e9e1cd',
};

/**
 * 主题应用器：监听 progress store settings.theme（含 system），
 * 将解析结果写入 <html data-theme> 与 color-scheme，并同步 <meta theme-color>。
 * 仅在 AppLayout 挂载时运行（onboarding 的 BlankLayout 由 index.html 预渲染脚本兜底）。
 */
export function useThemeApplier(): void {
  const theme = useProgressStore((s) => s.settings.theme);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const apply = () => {
      const resolved: 'dark' | 'light' =
        theme === 'system' ? (media.matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', THEME_COLOR_META[resolved]);
    };

    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);
}
