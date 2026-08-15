import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n/config'
import App from './App'

// 启动引导（副作用注册，须在首次渲染前执行）：
// - progress：事件总线订阅 + 成就检查 debounce（P1 副作用外移）
// - strategy-academy / theory-academy：成就检查数据源注册 + 初始 ELO 同步（P2-2 依赖倒置）
import { initProgressStore } from '@/features/progress/store.bootstrap'

// P0-03: bootstrap 延迟加载 —— 三学院 bootstrap 非首屏必需，改为 requestIdleCallback 动态导入
if ('requestIdleCallback' in window) {
  requestIdleCallback(async () => {
    await import('@/features/strategy-academy/store.bootstrap');
    await import('@/features/puzzle-trainer/store.bootstrap');
    await import('@/features/theory-academy/store.bootstrap');
  });
} else {
  setTimeout(() => {
    Promise.all([
      import('@/features/strategy-academy/store.bootstrap'),
      import('@/features/puzzle-trainer/store.bootstrap'),
      import('@/features/theory-academy/store.bootstrap'),
    ]);
  }, 0);
}

// P0-03: 同步等待 progress store bootstrap 完成，防止早期训练事件丢失
void initProgressStore().then(() => {
  // bootstrap 完成后才渲染应用，确保 subscription 已就位
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

// Register Service Worker（延迟到 bootstrap 后，避免并行竞态）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const { APP_VERSION } = await import('@/shared/constants/app');
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js?v=' + APP_VERSION).catch(() => {
      // SW registration failed, app still works normally
    });
  });
}
