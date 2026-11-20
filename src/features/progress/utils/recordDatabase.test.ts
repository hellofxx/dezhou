/**
 * recordDatabase（训练记录 IndexedDB 持久层）单元测试（Node + fake-indexeddb）。
 *
 * 契约（见 recordDatabase.ts 顶部注释）：
 * - add 以 id 为主键 put，重复写入同 id 幂等覆盖；
 * - addIfAbsent 在同一事务内「判重 + 插入」，库内已有同 id 时返回 exists 且不覆盖；
 * - getAll 返回全部记录；delete 按 id 删除；clear 清空；
 * - cleanup(limit) 保留最近 N 条（按 createdAt 降序），返回被删除条数，且读 + 删同事务；
 * - 事务成功只认 oncomplete：onerror / onabort 一律失败，绝不返回成功；
 * - open 被 blocked 时结束等待（不永久挂起），后续调用可重试。
 *
 * 隔离：DB 名为模块内常量（跨用例共享），故每个用例前 clear() 清库；
 * 需要独立模块状态（连接缓存）的用例用 vi.resetModules() + 动态 import。
 */
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, beforeEach, vi } from 'vitest';
import { recordDatabase } from './recordDatabase';
import type { TrainingRecord } from '@/shared/types/training';

function buildRecord(
  id: string,
  createdAt: number,
  module: TrainingRecord['module'] = 'range-trainer',
): TrainingRecord {
  return {
    id,
    module,
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module,
      totalQuestions: 10,
      correctAnswers: 7,
      accuracy: 0.7,
      averageTime: 4200,
      timestamp: createdAt,
      details: [],
    },
  };
}

interface FakeOpenRequest {
  result: unknown;
  error: unknown;
  onsuccess: (() => void) | null;
  onerror: (() => void) | null;
  onblocked: (() => void) | null;
  onupgradeneeded: (() => void) | null;
}

function createFakeRequest(): FakeOpenRequest {
  return {
    result: undefined,
    error: null,
    onsuccess: null,
    onerror: null,
    onblocked: null,
    onupgradeneeded: null,
  };
}

/** 伪 IndexedDB：open 成功，但写事务只发 onabort（永不发 oncomplete）。 */
function createAbortingIndexedDB(): unknown {
  return {
    open: () => {
      const request = createFakeRequest();
      const tx = {
        error: null as unknown as Error,
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        onabort: null as (() => void) | null,
        objectStore: () => ({
          put: () => {
            queueMicrotask(() => {
              tx.error = new Error('IndexedDB transaction aborted');
              tx.onabort?.();
            });
          },
        }),
      };
      request.result = {
        objectStoreNames: { contains: () => true },
        transaction: () => tx,
        close: () => {},
        onclose: null,
        onversionchange: null,
      };
      queueMicrotask(() => request.onsuccess?.());
      return request;
    },
  };
}

/** 伪 IndexedDB：open 永远被 blocked（另一标签页持有旧版本连接）。 */
function createBlockedIndexedDB(): unknown {
  return {
    open: () => {
      const request = createFakeRequest();
      queueMicrotask(() => request.onblocked?.());
      return request;
    },
  };
}

describe('recordDatabase（IndexedDB 训练记录持久层）', () => {
  beforeEach(async () => {
    await recordDatabase.clear();
  });

  it('add + getAll 往返：写入的记录可原样读回', async () => {
    await recordDatabase.add([buildRecord('r1', 1000), buildRecord('r2', 2000, 'pot-odds')]);

    const all = await recordDatabase.getAll();
    expect(all).toHaveLength(2);
    expect(all.map((r) => r.id).toSorted()).toEqual(['r1', 'r2']);
    // 记录内容不带部分字段（result 完整性）
    const r2 = all.find((r) => r.id === 'r2');
    expect(r2?.module).toBe('pot-odds');
    expect(r2?.result.totalQuestions).toBe(10);
  });

  it('同一 id 重复 add 幂等覆盖，不产生重复行', async () => {
    await recordDatabase.add([buildRecord('dup', 1000)]);
    const updated = buildRecord('dup', 1000);
    updated.result.correctAnswers = 10;
    updated.result.accuracy = 1;
    await recordDatabase.add([updated]);

    const all = await recordDatabase.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.result.correctAnswers).toBe(10);
  });

  it('addIfAbsent：首次写入 inserted，重复 id 返回 exists 且不覆盖库内内容', async () => {
    const first = await recordDatabase.addIfAbsent(buildRecord('absent-1', 1000));
    expect(first).toBe('inserted');

    const updated = buildRecord('absent-1', 1000);
    updated.result.correctAnswers = 10;
    updated.result.accuracy = 1;
    const second = await recordDatabase.addIfAbsent(updated);

    expect(second).toBe('exists');
    const all = await recordDatabase.getAll();
    expect(all).toHaveLength(1);
    expect(all[0]!.result.correctAnswers).toBe(7);
  });

  it('addIfAbsent 并发调用同一 id 只落库一条', async () => {
    const record = buildRecord('race-1', 1000);
    const outcomes = await Promise.all([
      recordDatabase.addIfAbsent(record),
      recordDatabase.addIfAbsent(record),
      recordDatabase.addIfAbsent(record),
    ]);

    expect(await recordDatabase.getAll()).toHaveLength(1);
    // 至少一次 inserted，其余 exists（同一事务序列内语义）
    expect(outcomes.filter((o) => o === 'inserted').length).toBeGreaterThanOrEqual(1);
  });

  it('delete 按 id 删除，其余记录保留', async () => {
    await recordDatabase.add([buildRecord('keep', 1000), buildRecord('drop', 2000)]);

    await recordDatabase.delete('drop');

    const all = await recordDatabase.getAll();
    expect(all.map((r) => r.id)).toEqual(['keep']);
  });

  it('cleanup(limit) 保留最近 N 条并返回被删除条数', async () => {
    await recordDatabase.add([
      buildRecord('oldest', 1000),
      buildRecord('middle', 2000),
      buildRecord('newest', 3000),
    ]);

    const removed = await recordDatabase.cleanup(2);

    expect(removed).toBe(1);
    const remaining = await recordDatabase.getAll();
    expect(remaining.map((r) => r.id).toSorted()).toEqual(['middle', 'newest']);
  });

  it('cleanup 在记录数未超限时不删除任何数据', async () => {
    await recordDatabase.add([buildRecord('a', 1000), buildRecord('b', 2000)]);

    const removed = await recordDatabase.cleanup(1000);

    expect(removed).toBe(0);
    expect(await recordDatabase.getAll()).toHaveLength(2);
  });

  it('cleanup(0) 清空全部记录（读 + 删同事务）', async () => {
    await recordDatabase.add([buildRecord('a', 1000), buildRecord('b', 2000)]);

    const removed = await recordDatabase.cleanup(0);

    expect(removed).toBe(2);
    expect(await recordDatabase.getAll()).toEqual([]);
  });

  it('clear 清空全部记录', async () => {
    await recordDatabase.add([buildRecord('a', 1000), buildRecord('b', 2000)]);

    await recordDatabase.clear();

    expect(await recordDatabase.getAll()).toEqual([]);
  });
});

describe('recordDatabase 事务 / 连接失效语义', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('事务 abort 时写操作 reject，不返回成功', async () => {
    vi.resetModules();
    const realIndexedDB = indexedDB;
    vi.stubGlobal('indexedDB', createAbortingIndexedDB());

    const { recordDatabase: freshDb } = await import('./recordDatabase');
    await expect(freshDb.add([buildRecord('abort-1', 1000)])).rejects.toThrow(/abort/i);

    vi.stubGlobal('indexedDB', realIndexedDB);
  });

  it('open 被 blocked 时结束等待，连接复位后下一次调用可重试', async () => {
    vi.resetModules();
    const realIndexedDB = indexedDB;
    vi.stubGlobal('indexedDB', createBlockedIndexedDB());

    const { recordDatabase: freshDb } = await import('./recordDatabase');
    await expect(freshDb.getAll()).rejects.toThrow(/blocked/i);

    // 复位为真实 IndexedDB：同一模块实例的下一次调用应重新 open 并成功
    vi.stubGlobal('indexedDB', realIndexedDB);
    await expect(freshDb.add([buildRecord('after-blocked', 1000)])).resolves.toBeUndefined();
    const all = await freshDb.getAll();
    expect(all.map((r) => r.id)).toContain('after-blocked');
    await freshDb.delete('after-blocked');
  });
});
