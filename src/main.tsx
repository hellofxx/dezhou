import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'
import '@/i18n/config'
import { APP_VERSION } from '@/shared/constants/app'
import App from './App'

// 启动引导：
// - progress：hydration 完成后后台加载 IndexedDB records + 事件总线订阅 + 成就检查 debounce
// - 三学院 bootstrap：后台注册 achievement & curriculum 数据源 + initial ELO sync
// 首屏只等待 persist hydration（localStorage 同步层）；records 与数据源就绪后经
// store 订阅 / useAcademyDataSource 的 late-registration 自愈触发重渲染。
import { initProgressStore, waitForProgressHydration } from '@/features/progress/store.bootstrap'

// 兜底：hydration 回调若因存储异常不触发，3 秒后仍渲染应用，避免永久白屏。
async function bootstrapAndRender() {
  // 后台任务与 hydration 并行启动，不阻塞首屏
  void initProgressStore().catch((err: unknown) => {
    console.error('[bootstrap] Progress init failed:', err);
  });
  void Promise.all([
    import('@/features/strategy-academy/store.bootstrap'),
    import('@/features/puzzle-trainer/store.bootstrap'),
    import('@/features/theory-academy/store.bootstrap'),
  ]).catch((err: unknown) => {
    console.error('[bootstrap] Feature data sources failed:', err);
  });

  try {
    await Promise.race([
      waitForProgressHydration(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('[bootstrap] HydrationTimeout')), 3000),
      ),
    ]);
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    // 无论何种异常都渲染应用（可能某些功能不可用），避免白屏
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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js?v=' + APP_VERSION).catch(() => {
      // SW registration failed, app still works normally
    });
  });
}
