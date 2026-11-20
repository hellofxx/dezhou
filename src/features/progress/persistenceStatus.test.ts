/**
 * 持久化失败运行态（persistenceStatus）单元测试。
 *
 * 契约：
 * - 按来源分治（localStorage / records / cleanup），互不覆盖；
 * - 每次失败让该来源代次 +1 且通知订阅者（可重复通知）；
 * - 成功只清自己的来源，且携带过期代次时不清（迟到的成功不抹更新的失败）；
 * - `pending > 0` 时保留失败态，只更新待重试计数；
 * - retryLocalStorageWrite 由 store 注入的 handler 驱动，未注入时返回 false。
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

async function loadStatus() {
  return import('./persistenceStatus');
}

beforeEach(() => {
  vi.resetModules();
});

describe('persistenceStatus 读写', () => {
  it('初始三个来源均为 inactive，快照引用稳定', async () => {
    const { getPersistenceStatus } = await loadStatus();
    const snapshot = getPersistenceStatus();

    expect(snapshot.localStorage.active).toBe(false);
    expect(snapshot.records.active).toBe(false);
    expect(snapshot.cleanup.active).toBe(false);
    // useSyncExternalStore 要求内容不变时返回同一引用
    expect(getPersistenceStatus()).toBe(snapshot);
  });

  it('上报失败：只置对应来源 active，代次递增，订阅者收到通知', async () => {
    const { getPersistenceStatus, getPersistenceGeneration, reportPersistenceFailure, subscribePersistenceStatus } =
      await loadStatus();
    const listener = vi.fn();
    subscribePersistenceStatus(listener);

    const generation = reportPersistenceFailure('records', {
      reason: 'quota',
      operation: 'add',
      pending: 2,
    });

    expect(generation).toBe(1);
    expect(getPersistenceGeneration('records')).toBe(1);
    expect(getPersistenceStatus().records).toEqual({
      active: true,
      reason: 'quota',
      operation: 'add',
      at: expect.any(Number),
      pending: 2,
    });
    expect(getPersistenceStatus().localStorage.active).toBe(false);
    expect(getPersistenceStatus().cleanup.active).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('可重复通知：连续两次失败各通知一次，代次累加', async () => {
    const { getPersistenceGeneration, reportPersistenceFailure, subscribePersistenceStatus } = await loadStatus();
    const listener = vi.fn();
    subscribePersistenceStatus(listener);

    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });
    reportPersistenceFailure('localStorage', { reason: 'quota', operation: 'write' });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(getPersistenceGeneration('localStorage')).toBe(2);
  });
});

describe('persistenceStatus 清除语义', () => {
  it('成功只清对应来源，其他来源失败态保留', async () => {
    const { getPersistenceGeneration, getPersistenceStatus, reportPersistenceFailure, reportPersistenceSuccess } =
      await loadStatus();

    reportPersistenceFailure('records', { reason: 'quota', operation: 'add', pending: 1 });
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });

    reportPersistenceSuccess('records', { generation: getPersistenceGeneration('records') });

    expect(getPersistenceStatus().records.active).toBe(false);
    expect(getPersistenceStatus().cleanup.active).toBe(true);
  });

  it('过期代次的成功不清除更新的失败', async () => {
    const { getPersistenceGeneration, getPersistenceStatus, reportPersistenceFailure, reportPersistenceSuccess } =
      await loadStatus();

    const staleGeneration = reportPersistenceFailure('records', { reason: 'quota', operation: 'add' });
    reportPersistenceFailure('records', { reason: 'unavailable', operation: 'add' });

    reportPersistenceSuccess('records', { generation: staleGeneration });
    expect(getPersistenceStatus().records.active).toBe(true);
    expect(getPersistenceStatus().records.reason).toBe('unavailable');

    reportPersistenceSuccess('records', { generation: getPersistenceGeneration('records') });
    expect(getPersistenceStatus().records.active).toBe(false);
  });

  it('pending > 0 时保留失败态，只更新待重试计数', async () => {
    const { getPersistenceStatus, reportPersistenceFailure, reportPersistenceSuccess } = await loadStatus();

    reportPersistenceFailure('records', { reason: 'quota', operation: 'add', pending: 3 });
    reportPersistenceSuccess('records', { pending: 1 });

    const records = getPersistenceStatus().records;
    expect(records.active).toBe(true);
    expect(records.pending).toBe(1);

    reportPersistenceSuccess('records', { pending: 0 });
    expect(getPersistenceStatus().records.active).toBe(false);
  });

  it('clearPersistenceFailure 只清指定来源', async () => {
    const { clearPersistenceFailure, getPersistenceStatus, reportPersistenceFailure } = await loadStatus();

    reportPersistenceFailure('records', { reason: 'quota', operation: 'add' });
    reportPersistenceFailure('cleanup', { reason: 'unknown', operation: 'cleanup' });

    clearPersistenceFailure('records');

    expect(getPersistenceStatus().records.active).toBe(false);
    expect(getPersistenceStatus().cleanup.active).toBe(true);
  });
});

describe('persistenceStatus 重试入口与错误分类', () => {
  it('retryLocalStorageWrite：未注册 handler 返回 false，注册后调用并回传结果', async () => {
    const { retryLocalStorageWrite, setLocalStorageRetryHandler } = await loadStatus();

    expect(retryLocalStorageWrite()).toBe(false);

    const handler = vi.fn(() => true);
    setLocalStorageRetryHandler(handler);
    expect(retryLocalStorageWrite()).toBe(true);
    expect(handler).toHaveBeenCalledTimes(1);

    setLocalStorageRetryHandler(null);
    expect(retryLocalStorageWrite()).toBe(false);
  });

  it('classifyPersistenceReason：quota / unavailable / unknown 归类', async () => {
    const { classifyPersistenceReason } = await loadStatus();

    const quota = new Error('quota exceeded');
    quota.name = 'QuotaExceededError';
    expect(classifyPersistenceReason(quota)).toBe('quota');

    const insecure = new Error('The operation is insecure');
    insecure.name = 'SecurityError';
    expect(classifyPersistenceReason(insecure)).toBe('unavailable');

    expect(classifyPersistenceReason(new Error('boom'))).toBe('unknown');
    expect(classifyPersistenceReason(undefined)).toBe('unknown');
  });
});
