import { create } from 'zustand';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import type { HandHistory, ReplayState, HandFilter } from './types';
import { clearDeviationCache } from './utils/gtoDeviation';

// ─── trainingEvents.emit 说明 ─────────────────────────────
// hand-history 是手牌复盘分析工具（导入/回放/统计），非答题训练模块，
// 没有 quiz/practice 形式的训练结果，因此不适合 emit TrainingRecord。
// AGENTS.md 中标注的"存量缺口"在此说明：hand-history 属于豁免模块。

// ─── IndexedDB Helper ────────────────────────────────────
const DB_NAME = 'hand-history-db';
const DB_VERSION = 1;
const STORE_NAME = 'hands';

function createDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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
  _dbPromise = createDB().then((db) => {
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

async function dbGetAll(): Promise<HandHistory[]> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    // HH-06：游标分批读取，避免大数据量下 getAll 一次性构造大数组阻塞主线程；
    // 每批通过 microtask 让出事件循环，UI 可渐进呈现（API 兼容原 getAll）
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const results: HandHistory[] = [];
    const BATCH = 200;
    const req = store.openCursor();
    req.onerror = () => reject(req.error);
    req.onsuccess = async () => {
      const cursor = req.result;
      if (!cursor) {
        resolve(results);
        return;
      }
      results.push(cursor.value as HandHistory);
      if (results.length % BATCH === 0) {
        // 通过 microtask 让出主线程（await Promise.resolve() === queueMicrotask）
        // IndexedDB 事务在回调返回且无 pending 请求时 auto-commit；
        // microtask 中事务仍为 active 状态，可安全调用 cursor.continue()
        await Promise.resolve();
        cursor.continue();
      } else {
        cursor.continue();
      }
    };
  });
}

async function dbPut(hands: HandHistory[]): Promise<void> {
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

async function dbDelete(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear(): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * IndexedDB 错误类型标识（存 key 而非翻译字符串——UI 渲染时经
 * t(`handHistory.dbError.${type}`) 翻译，语言切换后错误提示自动刷新）。
 * 与 src/i18n/locales/{zh,en}/handHistory.json 的 dbError.* 一一对应。
 */
export type DBErrorType = 'quotaExceeded' | 'unavailable' | 'generic';

function classifyDBError(err: unknown): DBErrorType {
  const msg = err instanceof DOMException ? err.message : '';
  const name = err instanceof DOMException ? err.name : '';
  if (name === 'QuotaExceededError' || msg.includes('quota')) {
    return 'quotaExceeded';
  }
  if (name === 'InvalidStateError' || name === 'AbortError') {
    return 'unavailable';
  }
  if (err instanceof TypeError || name === 'SecurityError') {
    return 'unavailable';
  }
  return 'generic';
}

// ─── Store ────────────────────────────────────────────────
interface HandHistoryStore {
  hands: HandHistory[];
  currentHand: HandHistory | null;
  replayState: ReplayState;
  filter: HandFilter;
  loaded: boolean;
  dbError: DBErrorType | null;

  // Data management
  loadFromDB: () => Promise<void>;
  addHands: (hands: HandHistory[]) => Promise<void>;
  deleteHand: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;

  // Replay control
  setCurrentHand: (hand: HandHistory) => void;
  startReplay: () => void;
  pauseReplay: () => void;
  nextAction: () => void;
  prevAction: () => void;
  jumpToStreet: (street: 'preflop' | 'flop' | 'turn' | 'river' | 'showdown') => void;
  setPlaybackSpeed: (speed: number) => void;

  // Annotations
  addAnnotation: (handId: string, key: string, note: string) => Promise<void>;

  // Filter
  setFilter: (filter: Partial<HandFilter>) => void;
  getFilteredHands: () => HandHistory[];
}

const INITIAL_REPLAY: ReplayState = {
  currentStreet: 'preflop',
  currentActionIndex: 0,
  isPlaying: false,
  playbackSpeed: 1,
  visibleCards: [],
  playerStacks: [],
  currentPot: 0,
};

function computeReplayState(hand: HandHistory, street: ReplayState['currentStreet'], actionIdx: number): ReplayState {
  const stacks = hand.players.map(p => p.stack);
  let pot = 0;
  const visibleCards: typeof hand.board = [];

  // Preflop: track blinds
  const preflopActions = hand.streets.preflop;

  const processActions = (actions: PlayerAction[], limit: number): void => {
    for (let i = 0; i < limit; i++) {
      const a = actions[i]!;
      const amt = a.amount ?? 0;
      if (a.type === ActionType.Call || a.type === ActionType.Raise || a.type === ActionType.AllIn) {
        stacks[a.playerIndex] = (stacks[a.playerIndex] ?? 0) - amt;
        pot += amt;
      }
    }
  };

  processActions(preflopActions, street === 'preflop' ? Math.min(actionIdx, preflopActions.length) : preflopActions.length);

  // Flop
  if (street !== 'preflop') {
    visibleCards.push(...hand.streets.flop.cards);
    const flopActions = hand.streets.flop.actions;
    processActions(flopActions, street === 'flop' ? Math.min(actionIdx, flopActions.length) : flopActions.length);
  }

  // Turn
  if (street === 'turn' || street === 'river' || street === 'showdown') {
    visibleCards.push(...hand.streets.turn.cards);
    const turnActions = hand.streets.turn.actions;
    processActions(turnActions, street === 'turn' ? Math.min(actionIdx, turnActions.length) : turnActions.length);
  }

  // River
  if (street === 'river' || street === 'showdown') {
    visibleCards.push(...hand.streets.river.cards);
    const riverActions = hand.streets.river.actions;
    processActions(riverActions, street === 'river' ? Math.min(actionIdx, riverActions.length) : riverActions.length);
  }

  if (street === 'showdown') {
    visibleCards.push(...hand.board.filter(c => !visibleCards.some(v => v.rank === c.rank && v.suit === c.suit)));
  }

  return {
    currentStreet: street,
    currentActionIndex: actionIdx,
    isPlaying: false,
    playbackSpeed: 1,
    visibleCards,
    playerStacks: stacks,
    currentPot: pot,
  };
}

function getCurrentActions(hand: HandHistory, street: ReplayState['currentStreet']): number {
  switch (street) {
    case 'preflop': return hand.streets.preflop.length;
    case 'flop': return hand.streets.flop.actions.length;
    case 'turn': return hand.streets.turn.actions.length;
    case 'river': return hand.streets.river.actions.length;
    case 'showdown': return 0;
  }
}

export const useHandHistoryStore = create<HandHistoryStore>((set, get) => ({
  hands: [],
  currentHand: null,
  replayState: { ...INITIAL_REPLAY },
  filter: { search: '', sortBy: 'date' },
  loaded: false,
  dbError: null,

  loadFromDB: async () => {
    try {
      const hands = await dbGetAll();
      set({ hands, loaded: true, dbError: null });
    } catch (err: unknown) {
      set({ loaded: true, dbError: classifyDBError(err) });
    }
  },

  addHands: async (hands) => {
    try {
      const existingIds = new Set(get().hands.map(h => h.id));
      const newHands = hands.filter(h => !existingIds.has(h.id));
      if (newHands.length === 0) return;
      await dbPut(newHands);
      set((state) => ({ hands: [...state.hands, ...newHands], dbError: null }));
    } catch (err: unknown) {
      set({ dbError: classifyDBError(err) });
    }
  },

  deleteHand: async (id) => {
    try {
      await dbDelete(id);
      // P1 fix: 删除牌局后同步清空偏差分析缓存，避免重导入同 id 显示陈旧数据
      clearDeviationCache();
      set((state) => ({ hands: state.hands.filter(h => h.id !== id), dbError: null }));
    } catch (err: unknown) {
      set({ dbError: classifyDBError(err) });
    }
  },

  clearAll: async () => {
    try {
      await dbClear();
      // P1 fix: 清空全部牌局时同步清空偏差分析缓存
      clearDeviationCache();
      set({ hands: [], dbError: null });
    } catch (err: unknown) {
      set({ dbError: classifyDBError(err) });
    }
  },

  setCurrentHand: (hand) => {
    const replayState = computeReplayState(hand, 'preflop', 0);
    set({ currentHand: hand, replayState });
  },

  startReplay: () => {
    set((state) => ({
      replayState: { ...state.replayState, isPlaying: true },
    }));
  },

  pauseReplay: () => {
    set((state) => ({
      replayState: { ...state.replayState, isPlaying: false },
    }));
  },

  nextAction: () => {
    const { currentHand, replayState } = get();
    if (!currentHand) return;

    const { currentStreet, currentActionIndex } = replayState;
    const totalActions = getCurrentActions(currentHand, currentStreet);

    if (currentActionIndex < totalActions) {
      const newState = computeReplayState(currentHand, currentStreet, currentActionIndex + 1);
      newState.isPlaying = replayState.isPlaying;
      newState.playbackSpeed = replayState.playbackSpeed;
      set({ replayState: newState });
    } else {
      // Move to next street
      const streetOrder: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
      const idx = streetOrder.indexOf(currentStreet);
      if (idx < streetOrder.length - 1) {
        const nextStreet = streetOrder[idx + 1]!;
        const newState = computeReplayState(currentHand, nextStreet, 0);
        newState.isPlaying = replayState.isPlaying;
        newState.playbackSpeed = replayState.playbackSpeed;
        set({ replayState: newState });
      } else {
        set((state) => ({
          replayState: { ...state.replayState, isPlaying: false },
        }));
      }
    }
  },

  prevAction: () => {
    const { currentHand, replayState } = get();
    if (!currentHand) return;

    const { currentStreet, currentActionIndex } = replayState;

    if (currentActionIndex > 0) {
      const newState = computeReplayState(currentHand, currentStreet, currentActionIndex - 1);
      newState.isPlaying = replayState.isPlaying;
      newState.playbackSpeed = replayState.playbackSpeed;
      set({ replayState: newState });
    } else {
      const streetOrder: ReplayState['currentStreet'][] = ['preflop', 'flop', 'turn', 'river', 'showdown'];
      const idx = streetOrder.indexOf(currentStreet);
      if (idx > 0) {
        const prevStreet = streetOrder[idx - 1]!;
        const totalActions = getCurrentActions(currentHand, prevStreet);
        const newState = computeReplayState(currentHand, prevStreet, totalActions);
        newState.isPlaying = replayState.isPlaying;
        newState.playbackSpeed = replayState.playbackSpeed;
        set({ replayState: newState });
      }
    }
  },

  jumpToStreet: (street) => {
    const { currentHand, replayState } = get();
    if (!currentHand) return;
    const newState = computeReplayState(currentHand, street, 0);
    newState.isPlaying = false;
    newState.playbackSpeed = replayState.playbackSpeed;
    set({ replayState: newState });
  },

  setPlaybackSpeed: (speed) => {
    set((state) => ({
      replayState: { ...state.replayState, playbackSpeed: speed },
    }));
  },

  addAnnotation: async (handId, key, note) => {
    const hand = get().hands.find(h => h.id === handId);
    if (!hand) return;
    const updated = { ...hand, annotations: { ...hand.annotations, [key]: note } };
    try {
      await dbPut([updated]);
      set((state) => ({
        hands: state.hands.map(h => h.id === handId ? updated : h),
        currentHand: state.currentHand?.id === handId ? updated : state.currentHand,
        dbError: null,
      }));
    } catch (err: unknown) {
      set({ dbError: classifyDBError(err) });
    }
  },

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
  },

  getFilteredHands: () => {
    const { hands, filter } = get();
    let result = [...hands];

    if (filter.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(h =>
        h.handNumber.toLowerCase().includes(q) ||
        h.players.some(p => p.name.toLowerCase().includes(q)) ||
        h.site.toLowerCase().includes(q)
      );
    }

    if (filter.site) {
      result = result.filter(h => h.site === filter.site);
    }

    if (filter.dateFrom) {
      result = result.filter(h => h.timestamp >= filter.dateFrom!);
    }

    if (filter.dateTo) {
      result = result.filter(h => h.timestamp <= filter.dateTo!);
    }

    // HH-09：显式数值判断（minPot=0 也应被识别为「任意底池」，避免 truthiness 语义模糊）
    if (typeof filter.minPot === 'number' && filter.minPot > 0) {
      result = result.filter(h => h.pot >= filter.minPot!);
    }

    result = result.toSorted((a, b) => {
      switch (filter.sortBy) {
        case 'date': return b.timestamp - a.timestamp;
        case 'pot': return b.pot - a.pot;
        case 'site': return a.site.localeCompare(b.site);
        default: return 0;
      }
    });

    return result;
  },
}));
