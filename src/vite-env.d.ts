/// <reference types="vite/client" />

/**
 * Vite `define` 注入的构建信息（vite.config.ts）。
 * 测试环境不注入 → 运行时为 undefined，app.ts 回退到 dev 标记。
 */
declare const __APP_BUILD_INFO__: { version: string; builtAt: string } | undefined;
