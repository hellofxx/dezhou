import { defineConfig } from 'vitest/config';
import path from 'path';

// 测试独立配置：不加载 react/tailwind 插件
// 首批冒烟测试均为纯函数与 store migrate，运行于 Node 环境
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
