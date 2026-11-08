import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { swPrecachePlugin } from './scripts/sw-precache-plugin.ts'

// pnpm 虚拟目录名会带 peer 名（Linux 上如 recharts@3.9.2_react-dom@19.2.7_...），
// 用 id.includes('react-dom') 会把带 peer 名的包整包并入首屏 chunk。
// 只认最后一个 node_modules/ 后的真实包目录名。
function isPackage(id: string, name: string): boolean {
  const normalized = id.replace(/\\/g, '/')
  const marker = '/node_modules/'
  const index = normalized.lastIndexOf(marker)
  return index !== -1 && normalized.startsWith(`${name}/`, index + marker.length)
}

export default defineConfig({
  // GitHub Pages 项目页部署在 /dezhou/ 子路径下，必须设置 base，否则资源 404
  base: '/dezhou/',
  plugins: [react(), tailwindcss(), swPrecachePlugin()],
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
          // 不要为 data/ 剩余模块建泛化手动 chunk（如 strategy-academy-data）：
          // Vite 的动态 import 预载 helper / mapDeps 会被 Rolldown 并入该 chunk，
          // 启动层 import academyCourse 时就会连带整个学院摘要链。交由自动归置。
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
          if (id.includes('/puzzle-trainer/data/puzzleBank')) {
            return 'puzzle-data';
          }
          // Vendor 库分包
          // 不要为 recharts 建手动 chunk：其依赖 clsx / use-sync-external-store 被 cn() 与
          // react-i18next 共享，手动 chunk 会把这两个共享依赖并入图表库，进而使整个
          // recharts 被首屏静态图引用。交由 Rolldown 自动拆分（图表库只出现在使用页的 chunk）。
          if (isPackage(id, 'framer-motion')) {
            return 'vendor-framer';
          }
          if (isPackage(id, 'react-dom')) {
            return 'vendor-react-dom';
          }
        },
      },
    },
  },
})
