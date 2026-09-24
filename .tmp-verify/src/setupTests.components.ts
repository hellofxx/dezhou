// 组件测试（jsdom 环境）公共准备，由 vitest.config.ts 的 component 项目 setupFiles 加载

// 初始化 i18next 实例（zh 默认）：消除 useTranslation 的 NO_I18NEXT_INSTANCE 警告，
// 并让组件测试可断言 zh 真实文案。
import '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { ALL_MODULES } from '@/i18n/moduleRegistry';

// 组件测试会渲染任意 feature 组件并断言真实中文文案，因此预加载全部翻译模块，
// 与拆分前 zh.json 全局加载行为保持一致（运行时仍按需加载，仅测试环境全量就绪）。
await preloadI18n([...ALL_MODULES]);

// 标记 React act 环境，允许测试内使用 react 的 act() 而不产生警告
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom 未实现 matchMedia，framer-motion 等库会在挂载时调用，补最小 stub
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
