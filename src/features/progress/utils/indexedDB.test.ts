/**
 * progress IndexedDB 封装（utils/indexedDB.ts）单元测试（Node + fake-indexeddb）。
 *
 * 契约：
 * - openDB 建库（version 1）时创建 records / hands 两个 objectStore（keyPath: id）；
 * - openDB 幂等：模块级 dbPromise 缓存，多次调用复用同一连接；
 * - saveToStore 走 put 语义（同 id 覆盖，不产生重复行）；
 * - loadFromStore getAll 读回全部记录；
 * - clearStore 只清空指定 store，不影响其他 store；
 * - 未知 store 名由 IDB 事务抛 NotFoundError（save / load / clear 三个入口均 reject）。
 *
 * 隔离：实现持有模块级连接缓存，故每个用例后必须先取回该连接并 close()，再删除同名
 * fake DB（连接未关时 deleteDatabase 会被 blocked，且 fake-indexeddb 不回调 onblocked，
 * 表现为下一次 beforeEach 静默超时）；每个用例前 resetModules 后重新 import。
 */
import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type IndexedDbModule = typeof import('./indexedDB');

/** 与实现同名的库名；仅用于测试侧清理 fake DB，不参与断言 */
const DB_NAME = 'poker-training';

interface SampleRecord {
  id: string;
  value: number;
}

let module_: IndexedDbModule;

async function deleteDatabase(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error ?? new Error('deleteDatabase 失败'));
    request.onblocked = () => resolve();
  });
}

/** 返回拒绝错误名（成功时返回 'resolved'），避免依赖 DOMException 具体文案 */
async function rejectionName(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    return (error as { name?: string }).name ?? 'unknown';
  }
}

beforeEach(async () => {
  // 上一用例的 afterEach 已关闭连接并删除 DB，此处处于干净状态
  await deleteDatabase();
  vi.resetModules();
  module_ = await import('./indexedDB');
});

afterEach(async () => {
  // 取回模块缓存中的连接并关闭；否则 deleteDatabase 静默 blocked
  const db = await module_.openDB();
  db.close();
  await deleteDatabase();
});

describe('openDB 建库', () => {
  it('建库时创建 records / hands 两个 store，主键均为 id', async () => {
    const db = await module_.openDB();

    expect(db.version).toBe(1);
    expect(db.objectStoreNames.contains('records')).toBe(true);
    expect(db.objectStoreNames.contains('hands')).toBe(true);

    const tx = db.transaction(['records', 'hands'], 'readonly');
    expect(tx.objectStore('records').keyPath).toBe('id');
    expect(tx.objectStore('hands').keyPath).toBe('id');
  });

  it('多次调用复用同一连接（模块级缓存不重复建库）', async () => {
    const first = await module_.openDB();
    const second = await module_.openDB();

    expect(second).toBe(first);
  });
});

describe('saveToStore / loadFromStore 读写往返', () => {
  it('写入多条后读回全部记录', async () => {
    const payload: SampleRecord[] = [
      { id: 'r1', value: 1 },
      { id: 'r2', value: 2 },
    ];
    await module_.saveToStore('records', payload);

    const all = await module_.loadFromStore<SampleRecord>('records');

    expect(all).toHaveLength(2);
    expect(all.map((r) => r.id).toSorted()).toEqual(['r1', 'r2']);
    expect(all.find((r) => r.id === 'r2')?.value).toBe(2);
  });

  it('同一 id 重复写入覆盖旧值，不产生重复行（put 语义）', async () => {
    await module_.saveToStore('records', [{ id: 'dup', value: 1 }]);
    await module_.saveToStore('records', [{ id: 'dup', value: 99 }]);

    const all = await module_.loadFromStore<SampleRecord>('records');

    expect(all).toHaveLength(1);
    expect(all[0]?.value).toBe(99);
  });

  it('records 与 hands 互相隔离，clearStore 只清空指定 store', async () => {
    await module_.saveToStore('records', [{ id: 'a', value: 1 }]);
    await module_.saveToStore('hands', [{ id: 'h1', value: 2 }]);

    await module_.clearStore('records');

    expect(await module_.loadFromStore('records')).toEqual([]);
    expect(await module_.loadFromStore<SampleRecord>('hands')).toHaveLength(1);
  });

  it('写入空数组不报错且不产生记录', async () => {
    await expect(module_.saveToStore('records', [])).resolves.toBeUndefined();

    expect(await module_.loadFromStore('records')).toEqual([]);
  });
});

describe('未知 store 名', () => {
  it('save / load / clear 三个入口均以 NotFoundError 拒绝', async () => {
    expect(await rejectionName(module_.saveToStore('missing', [{ id: 'x' }]))).toBe('NotFoundError');
    expect(await rejectionName(module_.loadFromStore('missing'))).toBe('NotFoundError');
    expect(await rejectionName(module_.clearStore('missing'))).toBe('NotFoundError');
  });

  it('未知 store 失败后数据库仍可用（错误不污染连接缓存）', async () => {
    await rejectionName(module_.loadFromStore('missing'));

    await module_.saveToStore('records', [{ id: 'after-error', value: 7 }]);
    const all = await module_.loadFromStore<SampleRecord>('records');

    expect(all.map((r) => r.id)).toEqual(['after-error']);
  });
});
