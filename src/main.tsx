import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n/config'
import App from './App'

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
