/**
 * 训练记录 IndexedDB 持久层（P2-01 阶段 A 起，P1 持久化切片加固）。
 *
 * 背景：progress store 的 records 数组随训练记录累积，历史实现每次 set() 都把
 * 整个 state JSON.stringify 写入 localStorage。records 已外迁 IndexedDB：
 * - 内存仍保留 records 供实时查询 / 统计（getStatsSummary / getRecentRecords 等）；
 * - localStorage 经 partialize 排除 records（见 store.ts persist 配置）；
 * - 写入 / 删除 / 清空 / 裁剪由 progress store 与 recordPersistence 调用本模块。
 *
 * 事务语义（本切片的硬约束）：
 * - 写操作以 `tx.oncomplete` 判定成功，`onerror` / `onabort` 一律 reject（绝不返回成功）；
 * - `addIfAbsent` 的「判重 + 插入」在同一 readwrite 事务内完成，避免 TOCTOU；
 * - `cleanup(limit)` 在单个 readwrite 事务内完成「读全量 + 删历史」，不做多次往返；
 * - `open` 被阻塞（onblocked）或连接失效（onclose / onversionchange / InvalidStateError）
 *   时立即结束等待并复位连接，下一次调用可重试一次。
 *
 * 裁剪策略：cleanup(limit) 保留最近 N 条（按 createdAt 降序），删除历史旧数据。
 */
import type { TrainingRecord } from '@/shared/types/training';

const DB_NAME = 'poker-training-records';
const DB_VERSION = 1;
const STORE_NAME = 'records';

/** addIfAbsent 的结果：inserted = 本次写入；exists = 库内已有同 id（不覆盖） */
export type AddOutcome = 'inserted' | 'exists';

interface TransactionContext {
  tx: IDBTransaction;
  store: IDBObjectStore;
}

function toError(error: unknown, fallback: string): Error {
  if (error instanceof Error) return error;
  if (typeof error === 'string' && error.length > 0) return new Error(error);
  return new Error(fallback);
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined' || indexedDB === null) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    let settled = false;
    const fail = (error: unknown): void => {
      if (settled) return;
      settled = true;
      reject(toError(error, 'IndexedDB open failed'));
    };

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (error) {
      fail(error);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('module', 'module', { unique: false });
      }
    };
    request.onsuccess = () => {
      if (settled) {
        // blocked 之后迟到的成功：关闭连接，避免泄漏（调用方已按失败处理）
        try {
          request.result.close();
        } catch {
          /* 连接已不可用 */
        }
        return;
      }
      settled = true;
      resolve(request.result);
    };
    request.onerror = () => fail(request.error);
    // 其他标签页持有旧版本连接时 open 会被阻塞：必须结束等待，由调用方稍后重试
    request.onblocked = () => fail(new Error('IndexedDB open blocked'));
  });
}

let cachedDb: IDBDatabase | null = null;
let pendingDb: Promise<IDBDatabase> | null = null;

function resetConnection(): void {
  const db = cachedDb;
  cachedDb = null;
  pendingDb = null;
  if (!db) return;
  try {
    db.close();
  } catch {
    /* 连接已关闭 */
  }
}

function getDatabase(): Promise<IDBDatabase> {
  if (cachedDb) return Promise.resolve(cachedDb);
  if (pendingDb) return pendingDb;
  const promise = openDatabase()
    .then((db) => {
      db.onclose = () => {
        if (cachedDb === db) {
          cachedDb = null;
          pendingDb = null;
        }
      };
      db.onversionchange = () => {
        if (cachedDb === db) resetConnection();
      };
      cachedDb = db;
      pendingDb = null;
      return db;
    })
    .catch((error: unknown) => {
      pendingDb = null;
      throw error;
    });
  pendingDb = promise;
  return promise;
}

/** 连接被其他上下文关闭 / 版本变更导致的失败——可断开重建后重试一次。 */
function isStaleConnectionError(error: unknown): boolean {
  const name = error instanceof Error ? error.name : '';
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    name === 'InvalidStateError' ||
    name === 'TransactionInactiveError' ||
    message.includes('closing') ||
    message.includes('closed') ||
    message.includes('invalid state')
  );
}

/** 事务完成语义：只有 oncomplete 算成功，onerror / onabort 一律失败。 */
function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(toError(tx.error, 'IndexedDB transaction failed'));
    tx.onabort = () => reject(toError(tx.error, 'IndexedDB transaction aborted'));
  });
}

async function withTransaction<T>(
  mode: IDBTransactionMode,
  run: (context: TransactionContext) => Promise<T>,
): Promise<T> {
  const attempt = async (): Promise<T> => {
    const db = await getDatabase();
    const tx = db.transaction(STORE_NAME, mode);
    return run({ tx, store: tx.objectStore(STORE_NAME) });
  };
  try {
    return await attempt();
  } catch (error) {
    if (!isStaleConnectionError(error)) throw error;
    resetConnection();
    return attempt();
  }
}

/** 事务内的同步异常（如 DataCloneError）：主动 abort，让结果走 onabort 失败路径。 */
function abortQuietly(tx: IDBTransaction): void {
  try {
    tx.abort();
  } catch {
    /* 事务已结束 */
  }
}

export const recordDatabase = {
  async add(records: TrainingRecord[]): Promise<void> {
    if (records.length === 0) return;
    await withTransaction('readwrite', async ({ tx, store }) => {
      const done = transactionDone(tx);
      try {
        for (const record of records) store.put(record);
      } catch (error) {
        abortQuietly(tx);
        throw error;
      }
      await done;
    });
  },

  /** 判重 + 插入同一事务：库内已有同 id 时返回 'exists' 且不覆盖。 */
  async addIfAbsent(record: TrainingRecord): Promise<AddOutcome> {
    return withTransaction('readwrite', async ({ tx, store }) => {
      const done = transactionDone(tx);
      let outcome: AddOutcome = 'exists';
      let writeError: unknown;
      const request = store.get(record.id);
      request.onsuccess = () => {
        if (request.result !== undefined) return;
        try {
          store.put(record);
          outcome = 'inserted';
        } catch (error) {
          // 克隆 / 键路径异常：abort 并抛出，绝不把失败谎报成 exists
          writeError = error;
          abortQuietly(tx);
        }
      };
      await done;
      if (writeError !== undefined) throw toError(writeError, 'IndexedDB write failed');
      return outcome;
    });
  },

  async getAll(): Promise<TrainingRecord[]> {
    return withTransaction('readonly', async ({ tx, store }) => {
      const done = transactionDone(tx);
      const request = store.getAll();
      await done;
      return (request.result ?? []) as TrainingRecord[];
    });
  },

  async delete(id: string): Promise<void> {
    await withTransaction('readwrite', async ({ tx, store }) => {
      const done = transactionDone(tx);
      store.delete(id);
      await done;
    });
  },

  async clear(): Promise<void> {
    await withTransaction('readwrite', async ({ tx, store }) => {
      const done = transactionDone(tx);
      store.clear();
      await done;
    });
  },

  /** 保留最近 limit 条（createdAt 降序），读 + 删在同一个 readwrite 事务内完成。 */
  async cleanup(limit: number = 1000): Promise<number> {
    const keep = Math.max(0, Math.floor(limit));
    return withTransaction('readwrite', async ({ tx, store }) => {
      const done = transactionDone(tx);
      const request = store.getAll();
      let removed = 0;
      request.onsuccess = () => {
        const all = (request.result ?? []) as TrainingRecord[];
        const sorted = all.toSorted((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        const stale = sorted.slice(keep);
        removed = stale.length;
        try {
          for (const record of stale) store.delete(record.id);
        } catch {
          abortQuietly(tx);
        }
      };
      await done;
      return removed;
    });
  },
};
