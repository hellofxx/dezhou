import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from './types';

/**
 * hand-history IndexedDB 持久化测试（Node + fake-indexeddb）。
 *
 * 覆盖 store 的真实 IDB 行为：建库/读写/删除/清空、重复导入幂等、
 * 批注持久化与空值删除、筛选排序、回放状态机冒烟。
 * 每个用例重置模块并清空同一 fake DB，避免模块级 _db 缓存与用例顺序耦合。
 */

type StoreModule = typeof import('./store');

function card(rank: Rank, suit: Suit) {
  return { rank, suit };
}

function playersNamed(name: string): HandHistory['players'] {
  return [
    { id: 0, name, position: Position.BTN, seatNumber: 1, stack: 100 },
    { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 100 },
  ];
}

function makeHand(id: string, overrides: Partial<HandHistory> = {}): HandHistory {
  return {
    id,
    site: 'pokerstars',
    handNumber: `HN-${id}`,
    timestamp: 1_700_000_000_000,
    gameType: 'NLHE',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    players: playersNamed('Hero'),
    board: [
      card(Rank.Ace, Suit.Spades),
      card(Rank.King, Suit.Hearts),
      card(Rank.Queen, Suit.Diamonds),
      card(Rank.Two, Suit.Clubs),
      card(Rank.Three, Suit.Hearts),
    ],
    streets: {
      preflop: [
        { type: ActionType.Raise, amount: 3, playerIndex: 0 },
        { type: ActionType.Call, amount: 3, playerIndex: 1 },
      ],
      flop: {
        cards: [
          card(Rank.Ace, Suit.Spades),
          card(Rank.King, Suit.Hearts),
          card(Rank.Queen, Suit.Diamonds),
        ],
        actions: [],
      },
      turn: { cards: [card(Rank.Two, Suit.Clubs)], actions: [] },
      river: { cards: [card(Rank.Three, Suit.Hearts)], actions: [] },
    },
    pot: 6,
    annotations: {},
    ...overrides,
  };
}

let storeModule: StoreModule;

async function resetStore(): Promise<StoreModule> {
  vi.resetModules();
  const module = await import('./store');
  await module.useHandHistoryStore.getState().clearAll();
  module.useHandHistoryStore.setState({
    hands: [],
    currentHand: null,
    replayState: {
      currentStreet: 'preflop',
      currentActionIndex: 0,
      isPlaying: false,
      playbackSpeed: 1,
      visibleCards: [],
      playerStacks: [],
      currentPot: 0,
    },
    loaded: false,
    dbError: null,
    filter: { search: '', sortBy: 'date' },
  });
  return module;
}

beforeEach(async () => {
  storeModule = await resetStore();
});

describe('hand-history IndexedDB 持久化', () => {
  it('空库加载：hands 为空且 loaded=true', async () => {
    await storeModule.useHandHistoryStore.getState().loadFromDB();

    const state = storeModule.useHandHistoryStore.getState();
    expect(state.hands).toEqual([]);
    expect(state.loaded).toBe(true);
    expect(state.dbError).toBeNull();
  });

  it('addHands 写入 IDB 并同步内存；重复 id 幂等', async () => {
    const { useHandHistoryStore } = storeModule;
    const h1 = makeHand('h1');
    const h2 = makeHand('h2');

    await useHandHistoryStore.getState().addHands([h1, h2]);
    expect(useHandHistoryStore.getState().hands.map((hand) => hand.id)).toEqual(['h1', 'h2']);

    await useHandHistoryStore.getState().addHands([h1, h2]);
    expect(useHandHistoryStore.getState().hands.map((hand) => hand.id)).toEqual(['h1', 'h2']);

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();
    expect(useHandHistoryStore.getState().hands.map((hand) => hand.id).toSorted()).toEqual([
      'h1',
      'h2',
    ]);
  });

  it('deleteHand 同时删除 IDB 与内存记录', async () => {
    const { useHandHistoryStore } = storeModule;
    await useHandHistoryStore.getState().addHands([makeHand('h1'), makeHand('h2')]);

    await useHandHistoryStore.getState().deleteHand('h1');

    expect(useHandHistoryStore.getState().hands.map((hand) => hand.id)).toEqual(['h2']);

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();
    expect(useHandHistoryStore.getState().hands.map((hand) => hand.id)).toEqual(['h2']);
  });

  it('clearAll 清空 IDB 与内存记录', async () => {
    const { useHandHistoryStore } = storeModule;
    await useHandHistoryStore.getState().addHands([makeHand('h1')]);

    await useHandHistoryStore.getState().clearAll();

    expect(useHandHistoryStore.getState().hands).toEqual([]);

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();
    expect(useHandHistoryStore.getState().hands).toEqual([]);
  });

  it('addAnnotation 持久化批注；空白内容删除批注', async () => {
    const { useHandHistoryStore } = storeModule;
    await useHandHistoryStore.getState().addHands([makeHand('h1')]);

    await useHandHistoryStore.getState().addAnnotation('h1', 'note', 'river bluff');
    expect(useHandHistoryStore.getState().hands[0]!.annotations).toEqual({ note: 'river bluff' });

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();
    expect(useHandHistoryStore.getState().hands[0]!.annotations).toEqual({ note: 'river bluff' });

    await useHandHistoryStore.getState().addAnnotation('h1', 'note', '   ');
    expect(useHandHistoryStore.getState().hands[0]!.annotations).toEqual({});

    useHandHistoryStore.setState({ hands: [], loaded: false });
    await useHandHistoryStore.getState().loadFromDB();
    expect(useHandHistoryStore.getState().hands[0]!.annotations).toEqual({});
  });
});

describe('hand-history 筛选与排序', () => {
  const h1 = makeHand('h1', {
    handNumber: 'AA111',
    timestamp: 100,
    pot: 10,
    site: 'pokerstars',
    players: playersNamed('Alice'),
  });
  const h2 = makeHand('h2', {
    handNumber: 'BB222',
    timestamp: 200,
    pot: 50,
    site: 'ggpoker',
    players: playersNamed('Bob'),
  });
  const h3 = makeHand('h3', {
    handNumber: 'CC333',
    timestamp: 300,
    pot: 30,
    site: 'pokerstars',
    players: playersNamed('Alice'),
  });

  beforeEach(() => {
    storeModule.useHandHistoryStore.setState({ hands: [h1, h2, h3] });
  });

  it('默认按时间倒序', () => {
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h3', 'h2', 'h1']);
  });

  it('按玩家名 / 牌局号 / 站点搜索', () => {
    const store = storeModule.useHandHistoryStore.getState();

    store.setFilter({ search: 'alice' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h3', 'h1']);

    store.setFilter({ search: 'bb' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h2']);

    store.setFilter({ search: 'ggpoker' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h2']);
  });

  it('按站点 / 时间 / 最小底池过滤', () => {
    const store = storeModule.useHandHistoryStore.getState();

    store.setFilter({ search: '', site: 'pokerstars' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h3', 'h1']);

    store.setFilter({ site: undefined, dateFrom: 200 });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h3', 'h2']);

    store.setFilter({ dateFrom: undefined, minPot: 40 });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h2']);
  });

  it('按底池 / 站点排序', () => {
    const store = storeModule.useHandHistoryStore.getState();

    store.setFilter({ minPot: undefined, sortBy: 'pot' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h2', 'h3', 'h1']);

    store.setFilter({ sortBy: 'site' });
    expect(
      storeModule.useHandHistoryStore.getState().getFilteredHands().map((hand) => hand.id),
    ).toEqual(['h2', 'h1', 'h3']);
  });
});

describe('hand-history 回放状态冒烟', () => {
  it('setCurrentHand / nextAction / jumpToStreet 的栈、底池与可见牌推进', () => {
    const { useHandHistoryStore } = storeModule;
    const hand = makeHand('replay');

    useHandHistoryStore.getState().setCurrentHand(hand);
    expect(useHandHistoryStore.getState().replayState).toMatchObject({
      currentStreet: 'preflop',
      currentActionIndex: 0,
      playerStacks: [100, 100],
      currentPot: 0,
    });

    useHandHistoryStore.getState().nextAction();
    expect(useHandHistoryStore.getState().replayState.playerStacks).toEqual([97, 100]);
    expect(useHandHistoryStore.getState().replayState.currentPot).toBe(3);

    useHandHistoryStore.getState().nextAction();
    expect(useHandHistoryStore.getState().replayState.playerStacks).toEqual([97, 97]);
    expect(useHandHistoryStore.getState().replayState.currentPot).toBe(6);

    useHandHistoryStore.getState().nextAction();
    expect(useHandHistoryStore.getState().replayState.currentStreet).toBe('flop');
    expect(useHandHistoryStore.getState().replayState.visibleCards).toHaveLength(3);
    expect(useHandHistoryStore.getState().replayState.currentPot).toBe(6);

    useHandHistoryStore.getState().jumpToStreet('river');
    expect(useHandHistoryStore.getState().replayState.currentStreet).toBe('river');
    expect(useHandHistoryStore.getState().replayState.visibleCards).toHaveLength(5);
    expect(useHandHistoryStore.getState().replayState.currentPot).toBe(6);
  });
});
