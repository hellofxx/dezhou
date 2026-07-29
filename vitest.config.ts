import { defineConfig } from 'vitest/config';
import path from 'path';

// 测试独立配置：不加载 react/tailwind 插件
// 双项目划分：纯函数 / store migrate 测试运行于 Node 环境；
// tsx 组件冒烟测试运行于 jsdom 环境（Vitest 4 已移除 environmentMatchGlobs，改用 projects）
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'component',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['src/setupTests.components.ts'],
        },
      },
    ],
  },
});
