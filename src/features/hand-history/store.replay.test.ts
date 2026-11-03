import { beforeEach, describe, expect, it } from 'vitest';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import { useHandHistoryStore } from './store';
import type { HandHistory } from './types';

/**
 * hand-history 回放状态机公共 API 边界（L1，不写 IDB）。
 *
 * 覆盖：各街动作数驱动换街、showdown 末尾结束播放、无 currentHand 时的 no-op 守卫、
 * jumpToAction 越界 clamp 与播放速度保留、showdown 可见牌按 board 去重补齐。
 * 持久化 / dbError 见 `store.indexeddb.test.ts` 与 `store.dbError.test.ts`。
 */

function card(rank: Rank, suit: Suit) {
  return { rank, suit };
}

const BOARD = [
  card(Rank.Ace, Suit.Spades),
  card(Rank.King, Suit.Hearts),
  card(Rank.Queen, Suit.Diamonds),
  card(Rank.Two, Suit.Clubs),
  card(Rank.Three, Suit.Hearts),
];

// 动作数刻意分街不等（preflop 4 / flop 2 / turn 1 / river 0），用于验证换街计数来源
function makeHand(): HandHistory {
  return {
    id: 'replay-1',
    site: 'partypoker',
    handNumber: '1',
    timestamp: 0,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [
      { id: 0, name: 'Hero', position: Position.BTN, seatNumber: 1, stack: 100 },
      { id: 1, name: 'Villain', position: Position.BB, seatNumber: 2, stack: 100 },
    ],
    board: BOARD,
    streets: {
      preflop: [
        { type: ActionType.Call, amount: 1, playerIndex: 0 },
        { type: ActionType.Call, amount: 2, playerIndex: 1 },
        { type: ActionType.Raise, amount: 6, playerIndex: 0 },
        { type: ActionType.Call, amount: 6, playerIndex: 1 },
      ],
      flop: {
        cards: BOARD.slice(0, 3),
        actions: [
          { type: ActionType.Check, playerIndex: 1 },
          { type: ActionType.Check, playerIndex: 0 },
        ],
      },
      turn: { cards: BOARD.slice(3, 4), actions: [{ type: ActionType.Check, playerIndex: 1 }] },
      river: { cards: BOARD.slice(4, 5), actions: [] },
    },
    pot: 12,
    annotations: {},
  };
}

function state() {
  return useHandHistoryStore.getState();
}

beforeEach(() => {
  useHandHistoryStore.setState({
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
  });
});

describe('回放换街与结束', () => {
  it('换街由该街动作数决定（preflop 4 步后进 flop），逐街推进到 showdown', () => {
    state().setCurrentHand(makeHand());

    // 4 个动作需 4 步全部展示，第 5 步才换街
    for (let i = 0; i < 4; i++) state().nextAction();
    expect(state().replayState.currentStreet).toBe('preflop');
    expect(state().replayState.currentActionIndex).toBe(4);

    state().nextAction();
    expect(state().replayState.currentStreet).toBe('flop');
    expect(state().replayState.currentActionIndex).toBe(0);

    const entered: string[] = [];
    for (let i = 0; i < 20; i++) {
      const before = state().replayState.currentStreet;
      state().nextAction();
      const after = state().replayState.currentStreet;
      if (after !== before) entered.push(after);
      if (after === 'showdown') break;
    }
    expect(entered).toEqual(['turn', 'river', 'showdown']);
    expect(state().replayState.playerStacks).toEqual([94, 94]);
    expect(state().replayState.currentPot).toBe(12);
  });

  it('showdown 末尾再 nextAction 只结束播放，不再前进', () => {
    state().setCurrentHand(makeHand());
    state().jumpToStreet('showdown');
    state().startReplay();
    expect(state().replayState.isPlaying).toBe(true);

    state().nextAction();

    expect(state().replayState.currentStreet).toBe('showdown');
    expect(state().replayState.currentActionIndex).toBe(0);
    expect(state().replayState.isPlaying).toBe(false);
  });

  it('无 currentHand 时 nextAction / prevAction / jumpToStreet / jumpToAction 均为 no-op', () => {
    const initial = state().replayState;
    state().nextAction();
    state().prevAction();
    state().jumpToStreet('river');
    state().jumpToAction('flop', 1);
    expect(state().replayState).toEqual(initial);
  });
});

describe('jumpToAction 与可见牌', () => {
  it('越界索引 clamp 到该街动作数 / 0，并保留播放速度且暂停播放', () => {
    state().setCurrentHand(makeHand());
    state().startReplay();
    state().setPlaybackSpeed(4);

    state().jumpToAction('preflop', 99);
    expect(state().replayState.currentActionIndex).toBe(4);
    expect(state().replayState.playerStacks).toEqual([94, 94]);
    expect(state().replayState.currentPot).toBe(12);

    state().jumpToAction('flop', -3);
    expect(state().replayState.currentActionIndex).toBe(0);
    // flop 起点：preflop 全部 + flop 0 步
    expect(state().replayState.playerStacks).toEqual([94, 94]);

    expect(state().replayState.playbackSpeed).toBe(4);
    expect(state().replayState.isPlaying).toBe(false);
  });

  it('showdown 可见牌与各街牌去重（board 不重复追加）', () => {
    state().setCurrentHand(makeHand());
    state().jumpToStreet('showdown');

    const visible = state().replayState.visibleCards;
    expect(visible).toHaveLength(5);
    expect(visible.map(c => `${c.rank}${c.suit}`)).toEqual(
      BOARD.map(c => `${c.rank}${c.suit}`),
    );
  });
});
