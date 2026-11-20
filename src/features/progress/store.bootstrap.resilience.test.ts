/**
 * initProgressStore 的启动顺序 / 幂等 / 可重试 / 防复活分支（Node，recordDatabase 为替身）。
 *
 * 契约：
 * - 先订阅后恢复：init 完成前 emit 的训练事件仍然入账；
 * - 并发调用只订阅一次并共享同一 promise；
 * - init 失败后闸门复位，可再次调用重试；
 * - records 恢复（延迟 getAll）与 clear 交错时旧快照作废，不复活已清空数据；
 * - IndexedDB 读取失败 → 告警并降级为内存模式，不抛出、不丢内存记录；
 * - 成就检查走 300ms debounce，同一批多次 emit 只触发一次。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

const dbMock = vi.hoisted(() => ({
  add: vi.fn(async (_records: unknown[]): Promise<void> => {}),
  addIfAbsent: vi.fn(async (_record: unknown): Promise<'inserted' | 'exists'> => 'inserted'),
  delete: vi.fn(async (_id: string): Promise<void> => {}),
  clear: vi.fn(async (): Promise<void> => {}),
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function loadBootstrap() {
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });

  const storeModule = await import('./store');
  const bootstrapModule = await import('./store.bootstrap');
  return { store: storeModule.useProgressStore, initProgressStore: bootstrapModule.initProgressStore };
}

beforeEach(() => {
  vi.resetModules(); // 重置模块级引导闸门，令每个用例可独立引导一次
  dbMock.add.mockClear();
  dbMock.addIfAbsent.mockReset();
  dbMock.addIfAbsent.mockResolvedValue('inserted');
  dbMock.delete.mockClear();
  dbMock.delete.mockResolvedValue(undefined);
  dbMock.clear.mockReset();
  dbMock.clear.mockResolvedValue(undefined);
  dbMock.cleanup.mockClear();
  dbMock.cleanup.mockResolvedValue(0);
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
    const { store, initProgressStore } = await loadBootstrap();

    await initProgressStore();

    expect(store.getState().records.map((r) => r.id)).toEqual(['idb-1', 'idb-2']);
    expect(dbMock.add).not.toHaveBeenCalled();
  });

  it('内存有遗留记录时先落库，再与库内记录按 id 去重合并', async () => {
    dbMock.getAll.mockResolvedValue([buildRecord('idb-1', 3000)]);
    const { store, initProgressStore } = await loadBootstrap();
    store.setState({ records: [buildRecord('legacy', 1000)] });

    await initProgressStore();

    expect(dbMock.add).toHaveBeenCalledTimes(1);
    expect(store.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-1']);
  });

  it('恢复结束（成功或降级）后关闭加载屏障', async () => {
    const coordinator = await import('./recordPersistence');
    expect(coordinator.isRecordsLoading()).toBe(true);

    const { initProgressStore } = await loadBootstrap();
    await initProgressStore();

    expect(coordinator.isRecordsLoading()).toBe(false);
  });
});

describe('initProgressStore 启动顺序与幂等', () => {
  it('init 完成前 emit 的训练事件仍然入账（先订阅后恢复）', async () => {
    const gate = deferred<TrainingRecord[]>();
    dbMock.getAll.mockReturnValue(gate.promise);
    const { store, initProgressStore } = await loadBootstrap();
    const { trainingEvents } = await import('@/shared/stores/trainingEvents');

    const initializing = initProgressStore();
    trainingEvents.emit(buildRecord('early', 1000));
    expect(store.getState().records.map((r) => r.id)).toEqual(['early']);

    gate.resolve([buildRecord('stored', 2000)]);
    await initializing;

    // 早期事件不被随后的恢复覆盖，并与其按 createdAt 升序合并
    expect(store.getState().records.map((r) => r.id)).toEqual(['early', 'stored']);
  });

  it('并发调用共享同一 promise，且只订阅一次', async () => {
    const gate = deferred<TrainingRecord[]>();
    dbMock.getAll.mockReturnValue(gate.promise);
    const { initProgressStore } = await loadBootstrap();
    const { trainingEvents } = await import('@/shared/stores/trainingEvents');
    const subscribe = vi.spyOn(trainingEvents, 'subscribe');

    const first = initProgressStore();
    const second = initProgressStore();
    expect(second).toBe(first);

    gate.resolve([]);
    await Promise.all([first, second]);

    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it('init 失败后闸门复位，可再次调用重试', async () => {
    const { store, initProgressStore } = await loadBootstrap();
    const { trainingEvents } = await import('@/shared/stores/trainingEvents');
    const subscribe = vi
      .spyOn(trainingEvents, 'subscribe')
      .mockImplementationOnce(() => {
        throw new Error('bus unavailable');
      });

    await expect(initProgressStore()).rejects.toThrow('bus unavailable');

    await expect(initProgressStore()).resolves.toBeUndefined();
    expect(subscribe).toHaveBeenCalledTimes(2);
    expect(store.getState().records).toHaveLength(0);
  });
});

describe('initProgressStore 与删除 / 清空的交错', () => {
  it('延迟 getAll 期间发生清空：返回的旧快照作废，已清空数据不复活', async () => {
    const gate = deferred<TrainingRecord[]>();
    dbMock.getAll.mockReturnValue(gate.promise);
    const { store, initProgressStore } = await loadBootstrap();

    const initializing = initProgressStore();
    await flush();

    store.getState().clearAllRecords();
    await flush();

    gate.resolve([buildRecord('stale', 1000)]);
    await initializing;

    expect(store.getState().records).toHaveLength(0);
  });

  it('延迟 getAll 期间被删除的记录不再复活', async () => {
    const gate = deferred<TrainingRecord[]>();
    dbMock.getAll.mockReturnValue(gate.promise);
    const { store, initProgressStore } = await loadBootstrap();

    const initializing = initProgressStore();
    await flush();

    store.getState().deleteRecord('gone');
    await flush();

    gate.resolve([buildRecord('gone', 1000), buildRecord('kept', 2000)]);
    await initializing;

    expect(store.getState().records.map((r) => r.id)).toEqual(['kept']);
  });
});

describe('initProgressStore IndexedDB 降级', () => {
  it('读取失败时告警并保留内存记录，不抛出', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dbMock.getAll.mockRejectedValue(new Error('IndexedDB blocked'));
    const { store, initProgressStore } = await loadBootstrap();
    store.setState({ records: [buildRecord('mem-1', 500)] });

    await expect(initProgressStore()).resolves.toBeUndefined();

    expect(store.getState().records.map((r) => r.id)).toEqual(['mem-1']);
    expect(warn).toHaveBeenCalled();
  });

  it('遗留记录迁入 IndexedDB 失败时告警但继续引导，内存记录不丢', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    dbMock.add.mockRejectedValueOnce(new Error('quota exceeded'));
    dbMock.getAll.mockResolvedValue([buildRecord('idb-1', 3000)]);
    const { store, initProgressStore } = await loadBootstrap();
    store.setState({ records: [buildRecord('legacy', 1000)] });

    await initProgressStore();

    expect(warn).toHaveBeenCalled();
    expect(store.getState().records.map((r) => r.id)).toEqual(['legacy', 'idb-1']);
  });
});

describe('initProgressStore 事件总线订阅', () => {
  it('emit 立即写入 records；300ms debounce 内多次 emit 只触发一次成就检查', async () => {
    const { store, initProgressStore } = await loadBootstrap();
    await initProgressStore();
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
