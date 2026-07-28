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
  window.addEventListener('load', () => {
    // import.meta.env.BASE_URL 在 dev 为 '/'，部署时为 '/dezhou/'，自动适配子路径
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {
      // SW registration failed, app still works normally
    });
  });
}
