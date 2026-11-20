import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildPersistPayload,
  createLocalStorageStub,
  type LocalStorageStub,
} from '@/shared/utils/localStorageStub';
import type { TrainingRecord } from './types';

/**
 * 升级首启 legacy records 桥接（Node + fake-indexeddb + 真实 persist 包装）。
 *
 * v13 起 persist partialize 排除 records，但旧载荷里仍有 records；Zustand hydrate
 * 在 migrate 之后会立即写回 partialize 结果（不含 records）。桥接负责：
 * 1. hydrate 读取原始载荷时捕获旧 records；
 * 2. 桥接激活期间把旧 records 合并回每次写回；
 * 3. bootstrap 经 recordPersistence 幂等迁入 IndexedDB，成功后才从原载荷摘除。
 *
 * 用例锁定：成功路径、IndexedDB 写失败可重试、原载荷写回失败可重试、
 * 迁移期间新增训练不进入旧副本、同 id 冲突以已持久化内容为准、重复 init 不重复写。
 */

const LEGACY_VERSION = 12; // 旧版本载荷：触发 hydrate 后的 migrate 写回（当前版本只增不减）
const PERSIST_KEY = 'poker-training-progress';

const writeGate = { fail: false };

function buildRecord(id: string, createdAt: number, correctAnswers = 7): TrainingRecord {
  return {
    id,
    module: 'range-trainer',
    mode: 'quiz',
    createdAt,
    result: {
      sessionId: id,
      module: 'range-trainer',
      totalQuestions: 10,
      correctAnswers,
      accuracy: correctAnswers / 10,
      averageTime: 4000,
      timestamp: createdAt,
      details: [],
    },
  };
}

function createGatedStorage(seed: Record<string, string>): LocalStorageStub {
  const stub = createLocalStorageStub(seed);
  const baseSetItem = stub.setItem;
  stub.setItem = (key: string, value: string) => {
    if (writeGate.fail) {
      const error = new Error('QuotaExceededError: quota exceeded');
      error.name = 'QuotaExceededError';
      throw error;
    }
    baseSetItem(key, value);
  };
  return stub;
}

function payloadState(stub: LocalStorageStub): Record<string, unknown> {
  const raw = stub.getItem(PERSIST_KEY);
  if (raw === null) throw new Error('persist payload missing');
  return (JSON.parse(raw) as { state: Record<string, unknown> }).state;
}

function payloadRecordIds(stub: LocalStorageStub): string[] {
  const records = payloadState(stub).records;
  return Array.isArray(records) ? records.map((record) => (record as TrainingRecord).id) : [];
}

interface BootOptions {
  legacy: TrainingRecord[];
  idbSeed?: TrainingRecord[];
}

async function boot(options: BootOptions) {
  vi.resetModules();
  const stub = createGatedStorage({
    [PERSIST_KEY]: buildPersistPayload({ records: options.legacy }, LEGACY_VERSION),
  });
  vi.stubGlobal('localStorage', stub);
  vi.stubGlobal('window', { localStorage: stub });

  const { recordDatabase } = await import('./utils/recordDatabase');
  await recordDatabase.clear();
  if (options.idbSeed && options.idbSeed.length > 0) await recordDatabase.add(options.idbSeed);

  const storeModule = await import('./store');
  const bootstrap = await import('./store.bootstrap');
  const coordinator = await import('./recordPersistence');
  const bridge = await import('./utils/legacyRecordsBridge');
  const status = await import('./persistenceStatus');
  // hydrate（含 migrate 写回）完成后用例才能稳定断言桥接状态
  await bootstrap.waitForProgressHydration();

  return {
    stub,
    recordDatabase,
    store: storeModule.useProgressStore,
    initProgressStore: bootstrap.initProgressStore,
    coordinator,
    bridge,
    status,
  };
}

beforeEach(() => {
  writeGate.fail = false;
  vi.resetModules();
});

afterEach(() => {
  writeGate.fail = false;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('legacy records 桥接（升级首启）', () => {
  it('旧版本载荷含 records：迁入 IDB、写回载荷移除 records、桥接释放', async () => {
    const { stub, recordDatabase, store, initProgressStore, coordinator, bridge } = await boot({
      legacy: [buildRecord('legacy-1', 1000), buildRecord('legacy-2', 2000)],
    });

    // hydrate 迁移写回后旧 records 未被擦除（桥接生效）
    expect(bridge.isLegacyBridgeActive()).toBe(true);
    expect(payloadRecordIds(stub)).toEqual(['legacy-1', 'legacy-2']);

    await initProgressStore();

    const persisted = await recordDatabase.getAll();
    expect(persisted.map((record) => record.id).toSorted()).toEqual(['legacy-1', 'legacy-2']);
    expect(payloadState(stub)).not.toHaveProperty('records');
    expect(bridge.isLegacyBridgeActive()).toBe(false);
    expect(coordinator.isRecordsLoading()).toBe(false);
    expect(store.getState().records.map((record) => record.id)).toEqual([
      'legacy-1',
      'legacy-2',
    ]);
  });

  it('IDB 写入失败：原载荷保留旧 records、桥接保持激活，重试成功后清理', async () => {
    const { stub, recordDatabase, initProgressStore, coordinator, bridge, status } = await boot({
      legacy: [buildRecord('legacy-1', 1000), buildRecord('legacy-2', 2000)],
    });
    const spy = vi
      .spyOn(recordDatabase, 'addIfAbsent')
      .mockRejectedValue(new Error('IndexedDB write failed'));

    await initProgressStore();

    expect(payloadRecordIds(stub)).toEqual(['legacy-1', 'legacy-2']);
    expect(bridge.isLegacyBridgeActive()).toBe(true);
    expect(status.getPersistenceStatus().records.active).toBe(true);
    // 桥接未完成：加载屏障不关闭（不开放破坏性操作）
    expect(coordinator.isRecordsLoading()).toBe(true);

    spy.mockRestore();
    await initProgressStore();

    const persisted = await recordDatabase.getAll();
    expect(persisted.map((record) => record.id).toSorted()).toEqual(['legacy-1', 'legacy-2']);
    expect(payloadState(stub)).not.toHaveProperty('records');
    expect(bridge.isLegacyBridgeActive()).toBe(false);
    expect(coordinator.isRecordsLoading()).toBe(false);
  });

  it('迁入成功但原载荷写回失败：桥接不释放并上报；重试成功后释放', async () => {
    const { stub, initProgressStore, coordinator, bridge, status } = await boot({
      legacy: [buildRecord('legacy-1', 1000)],
    });

    writeGate.fail = true;
    await initProgressStore();

    expect(bridge.isLegacyBridgeActive()).toBe(true);
    expect(payloadRecordIds(stub)).toEqual(['legacy-1']);
    expect(coordinator.isRecordsLoading()).toBe(true);
    expect(status.getPersistenceStatus().records).toMatchObject({
      active: true,
      operation: 'legacy-cleanup',
      reason: 'quota',
    });

    writeGate.fail = false;
    await initProgressStore();

    expect(bridge.isLegacyBridgeActive()).toBe(false);
    expect(payloadState(stub)).not.toHaveProperty('records');
    expect(coordinator.isRecordsLoading()).toBe(false);
    expect(status.getPersistenceStatus().records.active).toBe(false);
  });

  it('迁移期间新增训练不进入旧副本、不被覆盖；重复 init 不重复写', async () => {
    const { stub, recordDatabase, store, initProgressStore, bridge } = await boot({
      legacy: [buildRecord('legacy-1', 1000)],
    });

    // 桥接激活期间提交新训练：setItem 只回填旧记录
    const submitted = await store.getState().submitRecord(buildRecord('fresh', 3000));
    expect(submitted.ok).toBe(true);
    expect(payloadRecordIds(stub)).toEqual(['legacy-1']);

    const spy = vi.spyOn(recordDatabase, 'addIfAbsent');
    await initProgressStore();

    expect(spy).toHaveBeenCalledTimes(1); // 只迁移桥接中的 legacy-1
    expect(payloadState(stub)).not.toHaveProperty('records');
    expect(bridge.isLegacyBridgeActive()).toBe(false);
    expect(store.getState().records.map((record) => record.id)).toEqual(['legacy-1', 'fresh']);

    // 已完成引导：再次 init 复用同一 promise，不重复写库
    spy.mockClear();
    await initProgressStore();
    expect(spy).not.toHaveBeenCalled();
  });

  it('同 id 冲突：已持久化内容优先，不静默覆盖', async () => {
    const { stub, recordDatabase, initProgressStore, bridge } = await boot({
      legacy: [buildRecord('dup', 1000, 5)],
      idbSeed: [buildRecord('dup', 1000, 9)],
    });

    await initProgressStore();

    const stored = (await recordDatabase.getAll()).filter((record) => record.id === 'dup');
    expect(stored).toHaveLength(1);
    expect(stored[0]?.result.correctAnswers).toBe(9);
    expect(payloadState(stub)).not.toHaveProperty('records');
    expect(bridge.isLegacyBridgeActive()).toBe(false);
  });
});
