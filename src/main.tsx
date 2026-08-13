import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n/config'
import App from './App'

// 启动引导（副作用注册，须在首次渲染前执行）：
// - progress：事件总线订阅 + 成就检查 debounce（P1 副作用外移）
// - strategy-academy / theory-academy：成就检查数据源注册 + 初始 ELO 同步（P2-2 依赖倒置）
import { initProgressStore } from '@/features/progress'
import '@/features/strategy-academy/store.bootstrap'
import '@/features/theory-academy/store.bootstrap'
import '@/features/puzzle-trainer/store.bootstrap'
initProgressStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // import.meta.env.BASE_URL 在 dev 为 '/'，部署时为 '/dezhou/'，自动适配子路径
    // 传入 APP_VERSION 作为缓存版本号，SW 在 activate 时自动清理旧版本缓存
    const { APP_VERSION } = await import('@/shared/constants/app');
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js?v=' + APP_VERSION).catch(() => {
      // SW registration failed, app still works normally
    });
  });
}
