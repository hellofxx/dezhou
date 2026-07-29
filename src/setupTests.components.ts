// 组件测试（jsdom 环境）公共准备，由 vitest.config.ts 的 component 项目 setupFiles 加载

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
