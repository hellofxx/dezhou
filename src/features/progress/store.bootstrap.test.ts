import 'fake-indexeddb/auto';
import { describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

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

/**
 * initProgressStore 引导链路（Node + fake-indexeddb）：
 * 1. 等待 persist hydration；
 * 2. 把内存中的遗留 records 迁入 IndexedDB（put 幂等）；
 * 3. 从 IndexedDB 读回并与内存记录合并（按 id 去重、按 createdAt 升序）；
 * 4. 重复调用只执行一次（模块级 bootstrapped 闸门）。
 */
describe('initProgressStore 引导链路', () => {
  function buildRecord(id: string, createdAt: number): TrainingRecord {
    return {
      id,
      module: 'range-trainer',
      mode: 'quiz',
      createdAt,
      result: {
        sessionId: id,
        module: 'range-trainer',
        totalQuestions: 10,
        correctAnswers: 7,
        accuracy: 0.7,
        averageTime: 4000,
        timestamp: createdAt,
        details: [],
      },
    };
  }

  it('遗留内存记录迁入 IndexedDB，并与库内既有记录合并去重', async () => {
    const storageStub = createLocalStorageStub();
    vi.stubGlobal('localStorage', storageStub);
    vi.stubGlobal('window', { localStorage: storageStub });

    const { recordDatabase } = await import('./utils/recordDatabase');
    await recordDatabase.clear();
    await recordDatabase.add([buildRecord('idb-only', 2000)]);

    const { useProgressStore } = await import('./store');
    // 模拟升级首启：hydration 后内存里仍有 localStorage 遗留记录
    useProgressStore.setState({ records: [buildRecord('legacy', 1000)] });

    const { initProgressStore } = await import('./store.bootstrap');
    await initProgressStore();

    // 1) 遗留记录已落库 IndexedDB
    const persisted = await recordDatabase.getAll();
    expect(persisted.map((r) => r.id).toSorted()).toEqual(['idb-only', 'legacy']);

    // 2) 内存合并两侧记录，按 createdAt 升序
    expect(useProgressStore.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-only']);

    // 3) 幂等：重复引导不会重复加载 / 打乱顺序
    await initProgressStore();
    expect(useProgressStore.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-only']);
  });
});
