import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  // GitHub Pages 项目页部署在 /dezhou/ 子路径下，必须设置 base，否则资源 404
  base: '/dezhou/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // 大型数据文件独立分包
          if (id.includes('/strategy-academy/data/levels/')) {
            if (id.includes('level1') || id.includes('level2') || id.includes('level3') || id.includes('level4')) {
              return 'academy-levels-early';
            }
            return 'academy-levels-late';
          }
          if (id.includes('/strategy-academy/data/')) {
            return 'strategy-academy-data';
          }
          if (id.includes('/puzzle-trainer/data/puzzleBank')) {
            return 'puzzle-data';
          }
          // Vendor 库分包
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-recharts';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer';
            }
            if (id.includes('react-dom')) {
              return 'vendor-react-dom';
            }
          }
        },
      },
    },
  },
})
