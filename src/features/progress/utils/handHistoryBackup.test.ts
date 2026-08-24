/**
 * handHistoryBackup.test.ts
 *
 * Node unit 环境无原生 indexedDB，此处用极简 in-memory mock 覆盖 handHistoryBackup
 * 用到的能力（open + getAll + put），验证：读取回写、按 id 幂等去重。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadAllHands, saveAllHands } from './handHistoryBackup';

function createFakeIndexedDB(): IDBFactory {
  const hands = new Map<string, unknown>();

  const db = {
    objectStoreNames: { contains: () => true },
    createObjectStore: () => undefined,
    close: () => undefined,
    onclose: null as unknown,
    onversionchange: null as unknown,
    transaction: () => {
      const store = {
        getAll: () => {
          const req = { onsuccess: null as null | (() => void), onerror: null as null | (() => void), result: [...hands.values()] };
          queueMicrotask(() => req.onsuccess?.());
          return req as unknown as IDBRequest;
        },
        put: (val: unknown) => {
          const obj = val as { id?: unknown };
          hands.set(String(obj.id), val);
          const req = { onsuccess: null as null | (() => void), onerror: null as null | (() => void), result: undefined };
          queueMicrotask(() => req.onsuccess?.());
          return req as unknown as IDBRequest;
        },
      };
      const tx = {
        objectStore: () => store,
        oncomplete: null as null | (() => void),
        onerror: null as null | (() => void),
        error: null as unknown,
      };
      queueMicrotask(() => tx.oncomplete?.());
      return tx as unknown as IDBTransaction;
    },
  } as unknown as IDBDatabase;

  const openReq = {
    result: db,
    onupgradeneeded: null as null | (() => void),
    onsuccess: null as null | (() => void),
    onerror: null as null | (() => void),
    error: null as unknown,
  };
  // 事件在 open() 调用时调度：openDB 会在同一同步块内先挂 handler 再交出事件循环，
  // 确保 onsuccess/onupgradeneeded 在微任务刷新前已赋值（与 beforeEach 阶段的提前调度区分）。
  return {
    open: () => {
      queueMicrotask(() => {
        openReq.onupgradeneeded?.();
        queueMicrotask(() => openReq.onsuccess?.());
      });
      return openReq;
    },
  } as unknown as IDBFactory;
}



beforeEach(() => {
  vi.unstubAllGlobals();
  vi.stubGlobal('indexedDB', createFakeIndexedDB());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('handHistoryBackup', () => {
  it('空库读取返回空数组', async () => {
    await expect(loadAllHands()).resolves.toEqual([]);
  });

  it('saveAllHands 写入后 loadAllHands 可回读全部', async () => {
    await saveAllHands([
      { id: 'h1', pot: 100, site: 'stars' },
      { id: 'h2', pot: 220, site: 'gg' },
    ]);
    const hands = await loadAllHands();
    expect(hands.map((h) => h.id)).toEqual(['h1', 'h2']);
    expect(hands[0]).toMatchObject({ id: 'h1', pot: 100 });
  });

  it('重复导入同 id 覆盖旧值、不产生重复记录（幂等去重）', async () => {
    await saveAllHands([{ id: 'h1', pot: 100 }]);
    await saveAllHands([
      { id: 'h1', pot: 999 }, // 同 id 覆盖
      { id: 'h2', pot: 50 },
    ]);
    const hands = await loadAllHands();
    expect(hands).toHaveLength(2);
    const h1 = hands.find((h) => h.id === 'h1');
    expect(h1?.pot).toBe(999);
  });
});