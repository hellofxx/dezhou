import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

/**
 * initProgressStore 的合并 / 降级 / 订阅分支（Node，recordDatabase 为存储边界替身）。
 *
 * 契约：
 * - 内存 records 为空 → 直接采用 IndexedDB 记录；有遗留记录 → 先落库再合并（已有
 *   store.bootstrap.test.ts 用真实 fake-indexeddb 覆盖，本文件只锁定分支走向）；
 * - IndexedDB 读取失败 → 告警并降级为内存模式，不抛出、不丢内存记录；
 * - trainingEvents 订阅：emit 立即写入 records；成就检查走 300ms debounce，
 *   同一批多次 emit 只触发一次。
 */

const dbMock = vi.hoisted(() => ({
  add: vi.fn(async (_records: unknown[]): Promise<void> => {}),
  getAll: vi.fn(async (): Promise<unknown[]> => []),
  cleanup: vi.fn(async (_limit: number): Promise<number> => 0),
}));

vi.mock('./utils/recordDatabase', () => ({ recordDatabase: dbMock }));

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

/** 以给定的内存遗留记录启动引导，返回全新模块实例下的 store */
async function bootstrapWithMemoryRecords(memoryRecords: TrainingRecord[]) {
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });

  const { useProgressStore } = await import('./store');
  useProgressStore.setState({ records: memoryRecords });

  const { initProgressStore } = await import('./store.bootstrap');
  await initProgressStore();

  return useProgressStore;
}

beforeEach(() => {
  vi.resetModules(); // 重置模块级 bootstrapped 闸门，令每个用例可独立引导一次
  dbMock.add.mockClear();
  dbMock.cleanup.mockClear();
  dbMock.getAll.mockReset();
  dbMock.getAll.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('initProgressStore 记录合并', () => {
  it('内存无记录时直接采用 IndexedDB 记录，且不重复落库', async () => {
    dbMock.getAll.mockResolvedValue([buildRecord('idb-1', 1000), buildRecord('idb-2', 2000)]);

    const store = await bootstrapWithMemoryRecords([]);

    expect(store.getState().records.map((r) => r.id)).toEqual(['idb-1', 'idb-2']);
    expect(dbMock.add).not.toHaveBeenCalled();
  });

  it('内存有遗留记录时先落库，再与库内记录按 id 去重合并', async () => {
    dbMock.getAll.mockResolvedValue([buildRecord('idb-1', 3000)]);

    const store = await bootstrapWithMemoryRecords([buildRecord('legacy', 1000)]);

    expect(dbMock.add).toHaveBeenCalledTimes(1);
    expect(store.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-1']);
  });
});

describe('initProgressStore IndexedDB 降级', () => {
  it('读取失败时告警并保留内存记录，不抛出', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dbMock.getAll.mockRejectedValue(new Error('IndexedDB blocked'));

    const store = await bootstrapWithMemoryRecords([buildRecord('mem-1', 500)]);

    expect(store.getState().records.map((r) => r.id)).toEqual(['mem-1']);
    expect(warn).toHaveBeenCalled();
  });

  it('遗留记录迁入 IndexedDB 失败时告警但继续引导，内存记录不丢', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dbMock.add.mockRejectedValueOnce(new Error('quota exceeded'));
    dbMock.getAll.mockResolvedValue([buildRecord('idb-1', 3000)]);

    const store = await bootstrapWithMemoryRecords([buildRecord('legacy', 1000)]);

    expect(warn).toHaveBeenCalled();
    // 迁入失败不影响随后的加载与合并
    expect(store.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-1']);
  });
});

describe('initProgressStore 事件总线订阅', () => {
  it('emit 立即写入 records；300ms debounce 内多次 emit 只触发一次成就检查', async () => {
    const store = await bootstrapWithMemoryRecords([]);
    const checkAchievements = vi.fn(async (): Promise<void> => {});
    store.setState({ checkAchievements });

    const { trainingEvents } = await import('@/shared/stores/trainingEvents');

    vi.useFakeTimers();
    trainingEvents.emit(buildRecord('e1', 1000));
    trainingEvents.emit(buildRecord('e2', 2000));

    // 记录写入是同步的（不等 debounce）
    expect(store.getState().records.map((r) => r.id)).toEqual(['e1', 'e2']);
    expect(checkAchievements).not.toHaveBeenCalled();

    vi.advanceTimersByTime(299);
    expect(checkAchievements).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(checkAchievements).toHaveBeenCalledTimes(1);
  });
});
