import { create } from 'zustand';
import type { HandHistory, ReplayState, HandFilter } from './types';

// ─── IndexedDB Helper ────────────────────────────────────
const DB_NAME = 'hand-history-db';
const DB_VERSION = 1;
const STORE_NAME = 'hands';

function openDB(): Promise<IDBDatabase> {
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

async function dbGetAll(): Promise<HandHistory[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(hands: HandHistory[]): Promise<void> {
  const db = await openDB();
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
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbClear(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ─── Store ────────────────────────────────────────────────
interface HandHistoryStore {
  hands: HandHistory[];
  currentHand: HandHistory | null;
  replayState: ReplayState;
  filter: HandFilter;
  loaded: boolean;

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
  const processedPreflop = street === 'preflop' ? Math.min(actionIdx, preflopActions.length) : preflopActions.length;

  for (let i = 0; i < processedPreflop; i++) {
    const a = preflopActions[i]!;
    const amt = a.amount ?? 0;
    if (a.type === 'call' || a.type === 'raise') {
      stacks[a.playerIndex] = (stacks[a.playerIndex] ?? 0) - amt;
      pot += amt;
    } else if (a.type === 'fold') {
      // folded
    }
  }

  // Flop
  if (street !== 'preflop') {
    visibleCards.push(...hand.streets.flop.cards);
    const flopActions = hand.streets.flop.actions;
    const processedFlop = street === 'flop' ? Math.min(actionIdx, flopActions.length) : flopActions.length;
    for (let i = 0; i < processedFlop; i++) {
      const a = flopActions[i]!;
      const amt = a.amount ?? 0;
      if (a.type === 'call' || a.type === 'raise') {
        stacks[a.playerIndex] = (stacks[a.playerIndex] ?? 0) - amt;
        pot += amt;
      }
    }
  }

  // Turn
  if (street === 'turn' || street === 'river' || street === 'showdown') {
    visibleCards.push(...hand.streets.turn.cards);
    const turnActions = hand.streets.turn.actions;
    const processedTurn = street === 'turn' ? Math.min(actionIdx, turnActions.length) : turnActions.length;
    for (let i = 0; i < processedTurn; i++) {
      const a = turnActions[i]!;
      const amt = a.amount ?? 0;
      if (a.type === 'call' || a.type === 'raise') {
        stacks[a.playerIndex] = (stacks[a.playerIndex] ?? 0) - amt;
        pot += amt;
      }
    }
  }

  // River
  if (street === 'river' || street === 'showdown') {
    visibleCards.push(...hand.streets.river.cards);
    const riverActions = hand.streets.river.actions;
    const processedRiver = street === 'river' ? Math.min(actionIdx, riverActions.length) : riverActions.length;
    for (let i = 0; i < processedRiver; i++) {
      const a = riverActions[i]!;
      const amt = a.amount ?? 0;
      if (a.type === 'call' || a.type === 'raise') {
        stacks[a.playerIndex] = (stacks[a.playerIndex] ?? 0) - amt;
        pot += amt;
      }
    }
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

  loadFromDB: async () => {
    try {
      const hands = await dbGetAll();
      set({ hands, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  addHands: async (hands) => {
    await dbPut(hands);
    set((state) => ({ hands: [...state.hands, ...hands] }));
  },

  deleteHand: async (id) => {
    await dbDelete(id);
    set((state) => ({ hands: state.hands.filter(h => h.id !== id) }));
  },

  clearAll: async () => {
    await dbClear();
    set({ hands: [] });
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
    await dbPut([updated]);
    set((state) => ({
      hands: state.hands.map(h => h.id === handId ? updated : h),
      currentHand: state.currentHand?.id === handId ? updated : state.currentHand,
    }));
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

    if (filter.minPot) {
      result = result.filter(h => h.pot >= filter.minPot!);
    }

    result.sort((a, b) => {
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
