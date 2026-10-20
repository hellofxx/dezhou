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
          // 策略学院数据分包：摘要（启动/首页）与课程正文（按变体懒载）必须分离，
          // 否则摘要 import 会把全量课程拖进启动图。
          if (id.includes('/strategy-academy/data/lessons/manifest/')) {
            return 'academy-manifest';
          }
          if (id.includes('/strategy-academy/data/lessons/variants/short-deck/')) {
            return 'academy-lessons-short-deck';
          }
          if (id.includes('/strategy-academy/data/lessons/variants/heads-up/')) {
            return 'academy-lessons-heads-up';
          }
          if (id.includes('/strategy-academy/data/lessons/variants/standard/')) {
            const levelMatch = /standardLevel([1-8])([ab])?/i.exec(id);
            if (levelMatch) {
              return `academy-lesson-l${levelMatch[1]}${(levelMatch[2] ?? '').toLowerCase()}`;
            }
            return 'academy-lessons-standard-index';
          }
          if (id.includes('/strategy-academy/data/localLessons/')) {
            return 'academy-lessons-local';
          }
          if (
            id.includes('/strategy-academy/data/learningTracks') ||
            id.includes('/strategy-academy/data/localTrack')
          ) {
            return 'academy-tracks-data';
          }
          if (id.includes('/strategy-academy/data/basicsContent')) {
            return 'academy-basics-data';
          }
          if (id.includes('/strategy-academy/data/conceptNodes')) {
            return 'academy-concepts-data';
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
