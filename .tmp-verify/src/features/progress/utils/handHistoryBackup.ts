/**
 * XMOD-012：hand-history 牌局复盘数据（IndexedDB `hand-history-db`/`hands`）的
 * 备份读写封装，供设置页数据管理导出/导入使用。遵循 recordDatabase 的
 * 「模块内 IndexedDB 持久层」模式（单一消费方留存在本模块内）。
 *
 * 幂等性：`hands` objectStore 以 `id` 为主键，写入采用 put 语义——重复写入
 * 同 id 覆盖旧值而非新增，因此重复导入同一备份文件天然去重，不产生重复牌局。
 * 备份完整性：导出一次性 getAll 读取全部牌局，由调用方（设置页导出）负责最终
 * 序列化；当前不设容量上限，实测数据量在 JSON 导出可接受范围内。
 */
const DB_NAME = 'hand-history-db';
const DB_VERSION = 1;
const STORE_NAME = 'hands';

let _db: IDBDatabase | null = null;
let _dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    // 另一标签页持有旧版本连接时，open 会停在 blocked 态而非报错；不在此 reject
    // 则该 Promise 永不 settle，getDB 缓存的 _dbPromise 会连带卡死后续所有调用。
    req.onblocked = () =>
      reject(new Error('IDB_BLOCKED: hand-history-db open blocked by another tab'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

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

/** 单条牌局数据的备份形态（不依赖 hand-history 模块类型，防模块间直接引用）。 */
export type BackupHand = Record<string, unknown>;

/** 读取全部牌局复盘数据（用于导出序列化）。 */
export async function loadAllHands(): Promise<BackupHand[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as BackupHand[] | undefined) ?? []);
    req.onerror = () => reject(req.error);
  });
}

/** 恢复牌局复盘数据。以 id 为主键 put，天然幂等去重（重复导入覆盖旧值）。 */
export async function saveAllHands(hands: BackupHand[]): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    for (const hand of hands) {
      store.put(hand);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}