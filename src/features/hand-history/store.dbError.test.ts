import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { HandHistory } from './types';

/**
 * hand-history IndexedDB 失败分支（Node + fake-indexeddb）。
 *
 * 覆盖 store 的 dbError 分类与「失败不污染内存状态」契约：open 被 blocked（另一标签页
 * 持有旧连接）、open 失败（quota / 不可用 / 通用）、读游标失败、写事务中止、
 * versionchange 后连接缓存重置、>200 条游标分批读取。
 * 每个用例 `vi.resetModules()` 重建 store（模块级 _db / _dbPromise 归零）并清空记录。
 */

const DB_NAME = 'hand-history-db';
const STORE_NAME = 'hands';

type DBErrorType = 'quotaExceeded' | 'unavailable' | 'generic';
type StoreModule = typeof import('./store');
type AnyHandler = (() => void) | null;

let storeModule: StoreModule;

function makeHand(id: string): HandHistory {
  return {
    id,
    site: 'partypoker',
    handNumber: `HN-${id}`,
    timestamp: 1_700_000_000_000,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      { id: 0, name: 'Hero', position: Position.BTN, seatNumber: 1, stack: 100 },
      { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: [],
    streets: {
      preflop: [{ type: ActionType.Raise, amount: 6, playerIndex: 0 }],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 6,
    annotations: {},
  };
}

/** 在 store 之外单独开连接清空记录（不删库：删库会被其它用例残留的连接 blocked） */
async function clearRecords(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * mock indexedDB.open：在 createDB 注册完 handler 之后（microtask）触发
 * onblocked / onerror，模拟 Node 环境无法自然构造的浏览器态
 * （另一标签页持有旧连接、配额超限、隐私模式拒绝）。
 */
function mockOpenFailure(kind: 'blocked' | 'error', error?: unknown): void {
  vi.spyOn(indexedDB, 'open').mockImplementation(() => {
    const request: Record<string, unknown> = {
      error,
      result: undefined,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
    };
    const handlerKey = kind === 'blocked' ? 'onblocked' : 'onerror';
    queueMicrotask(() => {
      const handler = request[handlerKey] as AnyHandler;
      handler?.();
    });
    return request as unknown as IDBOpenDBRequest;
  });
}

/**
 * open 成功但后续请求失败：openCursor 报错（读链路）或事务 onerror（写链路）。
 * 事务对象在 microtask 中触发 onerror，此时 store 已同步注册完 handler。
 */
function mockOpenWithFakeDb(opts: { txError?: unknown; cursorError?: unknown }): void {
  vi.spyOn(indexedDB, 'open').mockImplementation(() => {
    const objectStore = {
      put: () => ({}),
      delete: () => ({}),
      clear: () => ({}),
      openCursor: () => {
        const cursorRequest: Record<string, unknown> = {
          error: opts.cursorError,
          result: null,
          onsuccess: null,
          onerror: null,
        };
        queueMicrotask(() => {
          const handler = cursorRequest.onerror as AnyHandler;
          handler?.();
        });
        return cursorRequest;
      },
    };
    const fakeDb = {
      onclose: null,
      onversionchange: null,
      close: () => {},
      transaction: () => {
        const tx: Record<string, unknown> = {
          error: opts.txError,
          oncomplete: null,
          onerror: null,
          objectStore: () => objectStore,
        };
        queueMicrotask(() => {
          const handler = tx.onerror as AnyHandler;
          handler?.();
        });
        return tx;
      },
    };
    const request: Record<string, unknown> = {
      result: fakeDb,
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
      onblocked: null,
    };
    queueMicrotask(() => {
      const handler = request.onsuccess as AnyHandler;
      handler?.();
    });
    return request as unknown as IDBOpenDBRequest;
  });
}

beforeEach(async () => {
  vi.resetModules();
  await clearRecords();
  storeModule = await import('./store');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dbError 分类（open 阶段失败）', () => {
  const cases: Array<[string, unknown, DBErrorType]> = [
    ['QuotaExceededError', new DOMException('quota', 'QuotaExceededError'), 'quotaExceeded'],
    ['消息含 quota 的非标准 name', new DOMException('Disk quota exceeded', 'UnknownError'), 'quotaExceeded'],
    ['TypeError（IDB 被禁用）', new TypeError('indexedDB is not available'), 'unavailable'],
    ['AbortError', new DOMException('The transaction was aborted', 'AbortError'), 'unavailable'],
    ['InvalidStateError', new DOMException('The connection is closing', 'InvalidStateError'), 'unavailable'],
    ['SecurityError', new DOMException('The operation is insecure', 'SecurityError'), 'unavailable'],
    ['普通 Error', new Error('boom'), 'generic'],
  ];

  for (const [label, error, expected] of cases) {
    it(`${label} → ${expected}`, async () => {
      mockOpenFailure('error', error);
      await storeModule.useHandHistoryStore.getState().loadFromDB();

      const state = storeModule.useHandHistoryStore.getState();
      expect(state.loaded).toBe(true);
      expect(state.dbError).toBe(expected);
      expect(state.hands).toEqual([]);
    });
  }

  it('open blocked：不悬挂（loadFromDB 及时结束），loaded=true 且报错', async () => {
    mockOpenFailure('blocked');
    await storeModule.useHandHistoryStore.getState().loadFromDB();

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.dbError).toBe('generic');
  });

  it('open blocked 后缓存被重置：阻塞解除后同一 store 可正常读库（回归锁）', async () => {
    mockOpenFailure('blocked');
    await storeModule.useHandHistoryStore.getState().loadFromDB();
    expect(storeModule.useHandHistoryStore.getState().dbError).not.toBeNull();

    vi.restoreAllMocks();
    await storeModule.useHandHistoryStore.getState().loadFromDB();
    const state = storeModule.useHandHistoryStore.getState();
    expect(state.dbError).toBeNull();
    expect(state.hands).toEqual([]);
  });
});

describe('数据操作失败不污染内存', () => {
  it('读游标失败（quota）：loaded=true + quotaExceeded，列表保持空', async () => {
    mockOpenWithFakeDb({ cursorError: new DOMException('quota', 'QuotaExceededError') });
    await storeModule.useHandHistoryStore.getState().loadFromDB();

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.loaded).toBe(true);
    expect(state.dbError).toBe('quotaExceeded');
    expect(state.hands).toEqual([]);
  });

  it('写事务中止（AbortError）：dbError=unavailable 且内存不追加记录', async () => {
    mockOpenWithFakeDb({ txError: new DOMException('aborted', 'AbortError') });
    await storeModule.useHandHistoryStore.getState().addHands([makeHand('h1')]);

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.hands).toEqual([]);
    expect(state.dbError).toBe('unavailable');
  });

  it('删除事务中止：内存记录保留，dbError=unavailable', async () => {
    storeModule.useHandHistoryStore.setState({ hands: [makeHand('h1')] });
    mockOpenWithFakeDb({ txError: new DOMException('aborted', 'AbortError') });
    await storeModule.useHandHistoryStore.getState().deleteHand('h1');

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.hands.map(h => h.id)).toEqual(['h1']);
    expect(state.dbError).toBe('unavailable');
  });

  it('清空事务中止：记录保留，dbError=unavailable', async () => {
    storeModule.useHandHistoryStore.setState({ hands: [makeHand('h1'), makeHand('h2')] });
    mockOpenWithFakeDb({ txError: new DOMException('aborted', 'AbortError') });
    await storeModule.useHandHistoryStore.getState().clearAll();

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.hands.map(h => h.id)).toEqual(['h1', 'h2']);
    expect(state.dbError).toBe('unavailable');
  });

  it('批注保存事务中止：批注不写入内存（含 currentHand）', async () => {
    const hand = makeHand('h1');
    storeModule.useHandHistoryStore.setState({ hands: [hand], currentHand: hand });
    mockOpenWithFakeDb({ txError: new DOMException('aborted', 'AbortError') });
    await storeModule.useHandHistoryStore.getState().addAnnotation('h1', 'note', 'river bluff');

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.hands[0]!.annotations).toEqual({});
    expect(state.currentHand?.annotations).toEqual({});
    expect(state.dbError).toBe('unavailable');
  });
});

describe('真实 IDB 连接生命周期（fake-indexeddb）', () => {
  it('versionchange（外部删除数据库）：连接与缓存重置，后续读库重建空库', async () => {
    const { useHandHistoryStore } = storeModule;
    await useHandHistoryStore.getState().addHands([makeHand('h1')]);

    // 未在 onversionchange 中 close() 时 deleteDatabase 会被 blocked 而永不完成
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('deleteDatabase 被阻塞：versionchange 未关闭连接'));
    });

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();

    const state = useHandHistoryStore.getState();
    expect(state.hands).toEqual([]);
    expect(state.dbError).toBeNull();
    expect(state.loaded).toBe(true);
  });

  it('超过 200 条记录走游标分批（microtask 让出）后仍全部返回', async () => {
    const { useHandHistoryStore } = storeModule;
    const hands = Array.from({ length: 250 }, (_, i) => makeHand(`h${i}`));
    await useHandHistoryStore.getState().addHands(hands);
    expect(useHandHistoryStore.getState().hands).toHaveLength(250);

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();

    const loaded = useHandHistoryStore.getState().hands;
    expect(loaded).toHaveLength(250);
    expect(new Set(loaded.map(h => h.id)).size).toBe(250);
    expect(useHandHistoryStore.getState().dbError).toBeNull();
  });
});
