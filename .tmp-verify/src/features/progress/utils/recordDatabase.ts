/**
 * P2-01 阶段 A：训练记录 IndexedDB 持久层。
 *
 * 背景：progress store 的 records 数组无上限裁剪，随训练记录累积导致每次 set()
 * 都将整个 state JSON.stringify 写入 localStorage，性能阻塞。
 * 阶段 A 将 records 持久化外迁至 IndexedDB（复用 hand-history 的惰性连接模式）：
 * - 内存仍保留 records 供实时查询/统计（getStatsSummary / getRecentRecords 等）；
 * - localStorage 经 partialize 排除 records（见 store.ts persist 配置）；
 * - 写入 / 删除 / 清空由 progress store 的 action side-effect 调用本模块。
 *
 * 裁剪策略：cleanup(limit) 保留最近 N 条（按 createdAt 降序），删除历史旧数据。
 * 所有方法均为幂等（put 以 id 为主键，重复写入同 id 覆盖旧值）。
 */
import type { TrainingRecord } from '@/shared/types/training';

const DB_NAME = 'poker-training-records';
const DB_VERSION = 1;
const STORE_NAME = 'records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('module', 'module', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let _db: IDBDatabase | null = null;
let _dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  if (_dbPromise) return _dbPromise;
  _dbPromise = openDB().then((db) => {
    db.onclose = () => { _db = null; _dbPromise = null; };
    db.onversionchange = () => { db.close(); _db = null; _dbPromise = null; };
    _db = db;
    _dbPromise = null;
    return db;
  }).catch((err: unknown) => {
    _dbPromise = null;
    throw err;
  });
  return _dbPromise;
}

export const recordDatabase = {
  async add(records: TrainingRecord[]): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const record of records) {
        store.put(record);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async getAll(): Promise<TrainingRecord[]> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => reject(req.error);
    });
  },

  async delete(id: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async clear(): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  async cleanup(limit: number = 1000): Promise<number> {
    // 保留最近 N 条，删除历史旧数据
    const all = await this.getAll();
    const sorted = all.toSorted((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    const toDelete = sorted.slice(limit);

    for (const record of toDelete) {
      await this.delete(record.id);
    }
    return toDelete.length;
  },
};
