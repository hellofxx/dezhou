import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';

/**
 * 首屏渲染闸门：只等待 persist hydration，不等 IndexedDB records。
 * 该函数若永挂，main.tsx 会依赖 3s 超时兜底；本测试锁定其正常路径可解析。
 */
describe('waitForProgressHydration', () => {
  it('persist hydration 完成后解析', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { waitForProgressHydration } = await import('./store.bootstrap');
    await expect(waitForProgressHydration()).resolves.toBeUndefined();
  });
});
