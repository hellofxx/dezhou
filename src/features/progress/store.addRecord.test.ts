/**
 * progress store 训练记录入账 / 持久化契约（P1 持久化切片）。
 *
 * 契约：
 * - 空会话（totalQuestions <= 0）纵深防御拒收：不入 records、不写库、不参与统计；
 * - addRecord 同步入账（兼容事件总线等 fire-and-forget 调用），落库走协调器；
 * - 落库失败保留内存并进入待重试队列，retryPendingRecords 成功后不重复入账；
 * - submitRecord 返回可等待结果；同 ID（含不同载荷）返回 exists 且不覆盖内存 / 库；
 * - clearAllRecords 清空失败不假装成功：回滚内存并上报 records 来源失败。
 *
 * 存储边界（recordDatabase）为替身，本文件不依赖真实 IndexedDB。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLocalStorageStub } from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

const dbMock = vi.hoisted(() => ({
  add: vi.fn(async (_records: unknown[]): Promise<void> => {}),
  addIfAbsent: vi.fn(async (_record: unknown): Promise<'inserted' | 'exists'> => 'inserted'),
  delete: vi.fn(async (_id: string): Promise<void> => {}),
  clear: vi.fn(async (): Promise<void> => {}),
  cleanup: vi.fn(async (_limit: number): Promise<number> => 0),
  getAll: vi.fn(async (): Promise<unknown[]> => []),
}));

vi.mock('./utils/recordDatabase', () => ({ recordDatabase: dbMock }));

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function buildRecord(id: string, totalQuestions: number, correctAnswers = 0): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: Date.now(),
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
      averageTime: 5,
      timestamp: Date.now(),
      details: [],
    },
  };
}

async function loadStore() {
  const storageStub = createLocalStorageStub();
  vi.stubGlobal('localStorage', storageStub);
  vi.stubGlobal('window', { localStorage: storageStub });

  const { useProgressStore } = await import('./store');
  const status = await import('./persistenceStatus');
  const coordinator = await import('./recordPersistence');
  return { store: useProgressStore, status, coordinator };
}

beforeEach(() => {
  vi.resetModules();
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
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('addRecord 空会话拒收兜底', () => {
  it('totalQuestions <= 0 拒收；正常记录入账；重复 id 去重且不重复写库', async () => {
    const { store } = await loadStore();
    const { addRecord } = store.getState();

    addRecord(buildRecord('empty-session', 0));
    addRecord(buildRecord('negative-session', -1));
    expect(store.getState().records).toHaveLength(0);
    await flush();
    expect(dbMock.addIfAbsent).not.toHaveBeenCalled();

    addRecord(buildRecord('valid-session', 10, 7));
    const afterValid = store.getState().records;
    expect(afterValid).toHaveLength(1);
    expect(afterValid[0]!.id).toBe('valid-session');
    await flush();
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(1);

    // 重复 id 去重（既有行为不回归）：不新增内存、也不再写库
    addRecord(buildRecord('valid-session', 10, 8));
    await flush();
    expect(store.getState().records).toHaveLength(1);
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(1);

    const summary = store.getState().getStatsSummary();
    expect(summary.totalSessions).toBe(1);
    expect(summary.totalQuestions).toBe(10);
  });
});

describe('addRecord 落库失败与重试', () => {
  it('失败保留内存并进入待重试队列；重试成功后不重复入账、失败态清除', async () => {
    const { store, status, coordinator } = await loadStore();
    dbMock.addIfAbsent.mockRejectedValueOnce(new Error('quota exceeded'));

    store.getState().addRecord(buildRecord('rec-1', 10, 7));
    await flush();

    expect(store.getState().records.map((r) => r.id)).toEqual(['rec-1']);
    expect(coordinator.getPendingRecordCount()).toBe(1);
    expect(status.getPersistenceStatus().records).toMatchObject({
      active: true,
      operation: 'add',
      pending: 1,
    });

    dbMock.addIfAbsent.mockResolvedValue('inserted');
    const summary = await store.getState().retryPendingRecords();
    await flush();

    expect(summary).toEqual({ retried: 1, saved: 1, failed: 0 });
    // 重试不重复 emit / 不重复入账
    expect(store.getState().records).toHaveLength(1);
    expect(coordinator.getPendingRecordCount()).toBe(0);
    expect(status.getPersistenceStatus().records.active).toBe(false);
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(2);
  });
});

describe('submitRecord 可等待结果', () => {
  it('首次 inserted；同 ID 不同载荷返回 exists 且不覆盖内存', async () => {
    const { store } = await loadStore();

    const first = await store.getState().submitRecord(buildRecord('sub-1', 10, 6));
    expect(first).toEqual({ ok: true, status: 'inserted' });

    const duplicate = await store.getState().submitRecord(buildRecord('sub-1', 10, 10));
    expect(duplicate).toEqual({ ok: true, status: 'exists' });

    expect(store.getState().records).toHaveLength(1);
    expect(store.getState().records[0]!.result.correctAnswers).toBe(6);
    // 内存已有同 id 时不再写库（保持内存 / IDB 一致）
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(1);
  });

  it('空会话返回 invalid 且不入账', async () => {
    const { store } = await loadStore();

    const result = await store.getState().submitRecord(buildRecord('sub-empty', 0));

    expect(result).toEqual({ ok: false, reason: 'invalid', retainedInMemory: false });
    expect(store.getState().records).toHaveLength(0);
    expect(dbMock.addIfAbsent).not.toHaveBeenCalled();
  });
});

describe('clearAllRecords / deleteRecord 持久化语义', () => {
  it('清空失败不假装成功：回滚内存并上报 records 来源失败', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { store, status } = await loadStore();
    store.setState({ records: [buildRecord('c1', 10, 5)] });
    dbMock.clear.mockRejectedValueOnce(new Error('clear failed'));

    store.getState().clearAllRecords();
    expect(store.getState().records).toHaveLength(0);

    await flush();

    expect(store.getState().records.map((r) => r.id)).toEqual(['c1']);
    expect(status.getPersistenceStatus().records).toMatchObject({
      active: true,
      operation: 'clear',
    });
    expect(warn).toHaveBeenCalled();
  });

  it('清空成功清除内存与待重试态，不残留失败标记', async () => {
    const { store, status } = await loadStore();
    store.setState({ records: [buildRecord('c2', 10, 5)] });

    store.getState().clearAllRecords();
    await flush();

    expect(store.getState().records).toHaveLength(0);
    expect(status.getPersistenceStatus().records.active).toBe(false);
    expect(dbMock.clear).toHaveBeenCalledTimes(1);
  });

  it('删除记录：内存即时移除并同步删库', async () => {
    const { store } = await loadStore();
    store.setState({ records: [buildRecord('d1', 10, 5), buildRecord('d2', 10, 5)] });

    store.getState().deleteRecord('d1');
    expect(store.getState().records.map((r) => r.id)).toEqual(['d2']);

    await flush();
    expect(dbMock.delete).toHaveBeenCalledWith('d1');
  });
});
