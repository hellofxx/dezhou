import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n/config'
import App from './App'

// 启动引导（副作用注册，须在首次渲染前执行）：
// - progress：事件总线订阅 + 成就检查 debounce（P1 副作用外移）
// - academy data source registry: achievement & curriculum data source 注册 + initial ELO sync（P2-2 依赖倒置）
import { initProgressStore } from '@/features/progress/store.bootstrap'

// P0-03 T2/A2 时序修复：将三学院 bootstrap 纳入渲染前的同一 async 链，而非 requestIdleCallback。
// Dashboard（routes.tsx:84）等首屏组件经 useAcademyProgressSnapshot()/getAchievementSources() 读 registry，
// 若注册晚于挂载则订阅固化为空函数且不自愈。显式 await Promise.all([...]) 建立同步点，
// 确保所有数据源注册完成后再渲染，消除间歇性静默失效。
// T3/C3 超时兜底：initProgressStore 依赖 localStorage persist + IndexedDB，若 hydration 回调不触发/IndexedDB 挂起
// 则 Promise 永挂 → 白屏。Promise.race with 3s timeout 降级渲染（带 visible hint），避免永久等待。
async function bootstrapAndRender() {
  try {
    // 先等待 progress store hydration & IndexedDB records 加载（含 3s 超时兜底）
    const initPromise = initProgressStore();
    const INIT_TIMEOUT_MS = 3000; // 超时阈值：3 秒后降级渲染
    await Promise.race([
      initPromise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('[bootstrap] InitTimeout')), INIT_TIMEOUT_MS)),
    ]);
    
    // 同时注册三学院数据源（必须全部完成才渲染）
    await Promise.all([
      import('@/features/strategy-academy/store.bootstrap'),
      import('@/features/puzzle-trainer/store.bootstrap'),
      import('@/features/theory-academy/store.bootstrap'),
    ]);
    
    // Registry 已就位，安全渲染
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    // C3 兜底：无论何种异常都渲染应用（可能某些功能不可用），避免白屏
    console.error('[bootstrap] Failed or timed out, rendering anyway:', err);
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--danger)' }}>
          <h1>平台初始化异常</h1>
          <p>进度数据可能不完整，刷新页面重试。</p>
        </div>
        <App />
      </StrictMode>,
    );
  }
}

// 启动 Bootstrap + 渲染（含 Service Worker 延迟注册）
bootstrapAndRender();

// Register Service Worker（延迟到 bootstrap 后，避免并行竞态）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    const { APP_VERSION } = await import('@/shared/constants/app');
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js?v=' + APP_VERSION).catch(() => {
      // SW registration failed, app still works normally
    });
  });
}
