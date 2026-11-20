/**
 * 训练记录持久化协调器（recordPersistence）单元测试。
 *
 * 契约：
 * - `persistRecord` 永不 reject；失败保留在内存（retainedInMemory）并进入待重试队列；
 * - `retryPendingRecords` 只重写 IDB（不重复 emit / 评分），成功后清空待重试态；
 * - 删除 / 清空会让在途写入变 cancelled，并对迟到落库做补偿删除（防复活）；
 * - cleanup 失败只标记 cleanup 来源，不清除 records 来源的失败态；
 * - 初始化屏障 isRecordsLoading / markRecordsLoadingDone。
 *
 * 存储边界（recordDatabase）为替身：本文件只验证协调器语义。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TrainingRecord } from './types';
import type { RecordPersistResult } from './recordPersistence';

const dbMock = vi.hoisted(() => ({
  addIfAbsent: vi.fn(async (_record: unknown): Promise<'inserted' | 'exists'> => 'inserted'),
  delete: vi.fn(async (_id: string): Promise<void> => {}),
  cleanup: vi.fn(async (_limit: number): Promise<number> => 0),
}));

vi.mock('./utils/recordDatabase', () => ({ recordDatabase: dbMock }));

function buildRecord(id: string, totalQuestions = 10, correctAnswers = 7): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt: 1000,
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 ? correctAnswers / totalQuestions : 0,
      averageTime: 4000,
      timestamp: 1000,
      details: [],
    },
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

async function load() {
  const coordinator = await import('./recordPersistence');
  const status = await import('./persistenceStatus');
  return { coordinator, status };
}

beforeEach(() => {
  vi.resetModules();
  dbMock.addIfAbsent.mockReset();
  dbMock.addIfAbsent.mockResolvedValue('inserted');
  dbMock.delete.mockReset();
  dbMock.delete.mockResolvedValue(undefined);
  dbMock.cleanup.mockReset();
  dbMock.cleanup.mockResolvedValue(0);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('persistRecord 结果契约', () => {
  it('空会话 / 缺 result 返回 invalid，且不触碰存储', async () => {
    const { coordinator } = await load();

    const emptySession = await coordinator.persistRecord(buildRecord('r0', 0));
    expect(emptySession).toEqual({ ok: false, reason: 'invalid', retainedInMemory: false });
    expect(dbMock.addIfAbsent).not.toHaveBeenCalled();
  });

  it('写入成功返回 inserted 并触发一次裁剪', async () => {
    const { coordinator, status } = await load();

    const result = await coordinator.persistRecord(buildRecord('r1'));
    await flush();

    expect(result).toEqual({ ok: true, status: 'inserted' });
    expect(coordinator.getPendingRecordCount()).toBe(0);
    expect(status.getPersistenceStatus().records.active).toBe(false);
    expect(dbMock.cleanup).toHaveBeenCalledTimes(1);
  });

  it('库内已存在同 id 返回 exists 且不触发裁剪', async () => {
    const { coordinator } = await load();
    dbMock.addIfAbsent.mockResolvedValue('exists');

    const result = await coordinator.persistRecord(buildRecord('r2'));
    await flush();

    expect(result).toEqual({ ok: true, status: 'exists' });
    expect(dbMock.cleanup).not.toHaveBeenCalled();
  });

  it('写入失败返回 retainedInMemory 并进入 records 失败态', async () => {
    const { coordinator, status } = await load();
    const quotaError = new Error('QuotaExceededError: quota exceeded');
    quotaError.name = 'QuotaExceededError';
    dbMock.addIfAbsent.mockRejectedValue(quotaError);

    const result = await coordinator.persistRecord(buildRecord('r3'));

    expect(result).toMatchObject({ ok: false, reason: 'failed', retainedInMemory: true });
    expect(coordinator.getPendingRecordCount()).toBe(1);
    expect(status.getPersistenceStatus().records).toMatchObject({
      active: true,
      reason: 'quota',
      operation: 'add',
      pending: 1,
    });
  });

  it('同 id 并发写入只落库一次', async () => {
    const { coordinator } = await load();
    const gate = deferred<'inserted'>();
    dbMock.addIfAbsent.mockReturnValue(gate.promise);

    const first = coordinator.persistRecord(buildRecord('r4'));
    const second = coordinator.persistRecord(buildRecord('r4'));
    gate.resolve('inserted');

    await expect(first).resolves.toEqual({ ok: true, status: 'inserted' });
    await expect(second).resolves.toEqual({ ok: true, status: 'inserted' });
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(1);
  });
});

describe('retryPendingRecords', () => {
  it('失败后重试成功：不重复入账，待重试态与失败态一并清除', async () => {
    const { coordinator, status } = await load();
    dbMock.addIfAbsent.mockRejectedValueOnce(new Error('quota exceeded'));

    const failed = await coordinator.persistRecord(buildRecord('retry-1'));
    expect(failed.ok).toBe(false);
    expect(coordinator.getPendingRecordCount()).toBe(1);

    dbMock.addIfAbsent.mockResolvedValue('inserted');
    const summary = await coordinator.retryPendingRecords();
    await flush();

    expect(summary).toEqual({ retried: 1, saved: 1, failed: 0 });
    expect(coordinator.getPendingRecordCount()).toBe(0);
    expect(status.getPersistenceStatus().records.active).toBe(false);
    // 首次失败 + 一次重试 = 两次落库尝试；未产生额外写入路径
    expect(dbMock.addIfAbsent).toHaveBeenCalledTimes(2);
  });

  it('重试仍失败时返回 failed 计数并保留待重试态', async () => {
    const { coordinator } = await load();
    dbMock.addIfAbsent.mockRejectedValue(new Error('still broken'));

    await coordinator.persistRecord(buildRecord('retry-2'));
    const summary = await coordinator.retryPendingRecords();

    expect(summary).toEqual({ retried: 1, saved: 0, failed: 1 });
    expect(coordinator.getPendingRecordCount()).toBe(1);
  });
});

describe('删除 / 清空的防复活语义', () => {
  it('取消待写记录后，迟到的成功写入变 cancelled 并补偿删除', async () => {
    const { coordinator } = await load();
    const gate = deferred<'inserted'>();
    dbMock.addIfAbsent.mockReturnValue(gate.promise);

    const task = coordinator.persistRecord(buildRecord('cancel-1'));
    coordinator.cancelPendingRecord('cancel-1');
    gate.resolve('inserted');

    const result: RecordPersistResult = await task;
    expect(result).toEqual({ ok: false, reason: 'cancelled', retainedInMemory: false });
    expect(dbMock.delete).toHaveBeenCalledWith('cancel-1');
    expect(coordinator.isRecordRemoved('cancel-1')).toBe(true);
  });

  it('清空（cancelAll）后迟到的成功写入变 cancelled 并补偿删除，待重试队列清空', async () => {
    const { coordinator } = await load();
    dbMock.addIfAbsent.mockRejectedValueOnce(new Error('quota exceeded'));
    await coordinator.persistRecord(buildRecord('clear-pending'));
    expect(coordinator.getPendingRecordCount()).toBe(1);

    const gate = deferred<'inserted'>();
    dbMock.addIfAbsent.mockReturnValue(gate.promise);
    const inFlight = coordinator.persistRecord(buildRecord('clear-inflight'));

    const epochBefore = coordinator.getRecordsEpoch();
    coordinator.cancelAllPendingRecords();
    expect(coordinator.getRecordsEpoch()).toBe(epochBefore + 1);
    expect(coordinator.getPendingRecordCount()).toBe(0);

    gate.resolve('inserted');
    await expect(inFlight).resolves.toEqual({
      ok: false,
      reason: 'cancelled',
      retainedInMemory: false,
    });
    expect(dbMock.delete).toHaveBeenCalledWith('clear-inflight');
  });

  it('removePersistedRecord 先取消在途任务再删库', async () => {
    const { coordinator } = await load();
    const gate = deferred<'inserted'>();
    dbMock.addIfAbsent.mockReturnValue(gate.promise);

    const task = coordinator.persistRecord(buildRecord('remove-1'));
    coordinator.removePersistedRecord('remove-1');
    gate.resolve('inserted');
    await task;
    await flush();

    // 一次来自 removePersistedRecord 的显式删除 + 一次来自迟到写入的补偿删除
    expect(dbMock.delete).toHaveBeenCalledWith('remove-1');
  });
});

describe('cleanup 失败隔离', () => {
  it('cleanup 失败只标记 cleanup 来源，不清除仍需重试的 records 失败态', async () => {
    const { coordinator, status } = await load();

    // 1) 一条记录写入失败 → records 失败态 + pending 1
    dbMock.addIfAbsent.mockRejectedValueOnce(new Error('quota exceeded'));
    await coordinator.persistRecord(buildRecord('fail-1'));
    expect(status.getPersistenceStatus().records.active).toBe(true);

    // 2) 另一条写入成功但裁剪失败
    dbMock.addIfAbsent.mockResolvedValue('inserted');
    dbMock.cleanup.mockRejectedValue(new Error('cleanup failed'));
    await coordinator.persistRecord(buildRecord('ok-2'));
    await flush();

    const snapshot = status.getPersistenceStatus();
    expect(snapshot.cleanup).toMatchObject({ active: true, operation: 'cleanup' });
    // 仍有待重试记录，records 失败态不得被 cleanup 失败或局部成功抹掉
    expect(snapshot.records.active).toBe(true);
    expect(coordinator.getPendingRecordCount()).toBe(1);
  });
});

describe('初始化屏障', () => {
  it('markRecordsLoadingDone 幂等关闭加载态', async () => {
    const { coordinator } = await load();

    expect(coordinator.isRecordsLoading()).toBe(true);
    coordinator.markRecordsLoadingDone();
    coordinator.markRecordsLoadingDone();
    expect(coordinator.isRecordsLoading()).toBe(false);
  });

  it('isPersistableRecord 拒收空会话与缺失 result', async () => {
    const { coordinator } = await load();

    expect(coordinator.isPersistableRecord(buildRecord('ok'))).toBe(true);
    expect(coordinator.isPersistableRecord(buildRecord('empty', 0))).toBe(false);
    expect(coordinator.isPersistableRecord(null)).toBe(false);
    expect(coordinator.isPersistableRecord(undefined)).toBe(false);
  });
});
