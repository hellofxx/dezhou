import { describe, it, expect, beforeEach } from 'vitest';
import { normalizeToAmounts } from './common';
import { parsePokerStarsHand } from './pokerstars';
import { useHandHistoryStore } from '../store';
import type { HandHistory, Player } from '../types';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';

// ─── HH-020：PlayerAction.amount 统一为「to 金额」（本街累计总投注额）──────────
describe('HH-020 normalizeToAmounts 金额口径统一', () => {
  it('call 后 raise-to：Call 增量累加为 to，Raise 直接保留 to', () => {
    // 输入：pokerstars/gg 语义（Call=增量、Raise=to 总额 + posts 盲注）
    const action: PlayerAction[] = [
      { type: ActionType.Call, amount: 1, playerIndex: 0 },   // Hero 贴 SB
      { type: ActionType.Call, amount: 2, playerIndex: 1 },   // Villain 贴 BB
      { type: ActionType.Raise, amount: 6, playerIndex: 0 },  // "raises $4 to $6" → to=6
      { type: ActionType.Call, amount: 4, playerIndex: 1 },   // Villain call $4 → to=2+4=6
    ];
    expect(normalizeToAmounts(action).map(a => a.amount)).toEqual([1, 2, 6, 6]);
  });

  it('同一街多个 raise 的 to 依次累计正确（3-bet 场景）', () => {
    const action: PlayerAction[] = [
      { type: ActionType.Raise, amount: 6, playerIndex: 0 },   // open raise to 6
      { type: ActionType.Raise, amount: 18, playerIndex: 1 },  // 3-bet to 18
      { type: ActionType.Raise, amount: 40, playerIndex: 0 },  // 4-bet to 40
    ];
    // Raise 已是 to：保持不变
    expect(normalizeToAmounts(action).map(a => a.amount)).toEqual([6, 18, 40]);
  });

  it('AllIn 带 to 金额保持为 to（"is all-in $12"）', () => {
    const action: PlayerAction[] = [
      { type: ActionType.Call, amount: 2, playerIndex: 0 },
      { type: ActionType.AllIn, amount: 12, playerIndex: 0 },
    ];
    expect(normalizeToAmounts(action).map(a => a.amount)).toEqual([2, 12]);
  });

  it('多街重置：每条街从 0 重新累计', () => {
    const flop: PlayerAction[] = [
      { type: ActionType.Raise, amount: 10, playerIndex: 0 },  // flop bet 10（to=10）
    ];
    expect(normalizeToAmounts(flop).map(a => a.amount)).toEqual([10]);
  });

  it('real PS push 文本解析后 preflop 金额为 to', () => {
    const hand = parsePokerStarsHand(`
PokerStars Hand #700: Hold'em No Limit ($1/$2 USD) - 2024/01/15 23:00:00 ET
Table 'Fix' 2-max Seat #1 is the button
Seat 1: Hero ($100 in chips)
Seat 2: Villain ($100 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah As]
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises $4 to $6
Villain: calls $4
*** SUMMARY ***
Total pot $12
Hero collected $12 from pot
`);
    expect(hand.streets.preflop.map(a => a.amount)).toEqual([1, 2, 6, 6]);
  });
});

// ─── HH-020：computeReplayState 扣减不重复计算 raise 的 to 总额 ──────────────
// 通过 store 验证回放 stack / pot：同街「先 call 2 再 raise to 6」只实投 6，不扣 2+6=10。
function makePlayer(idx: number, name: string, position: Position): Player {
  return { id: idx, name, position, seatNumber: idx + 1, stack: 100 };
}

function makeHUHand(): HandHistory {
  return {
    id: 'hh-hu',
    site: 'pokerstars',
    handNumber: '1',
    timestamp: 0,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: [makePlayer(0, 'Hero', Position.BTN), makePlayer(1, 'Villain', Position.BB)],
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Call, amount: 1, playerIndex: 0 }, // Hero 贴 SB（to=1）
        { type: ActionType.Call, amount: 2, playerIndex: 1 }, // Villain 贴 BB（to=2）
        { type: ActionType.Raise, amount: 6, playerIndex: 0 }, // Hero raise to 6（delta=5）
        { type: ActionType.Call, amount: 6, playerIndex: 1 }, // Villain call to 6（delta=4）
      ],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 12,
    winner: { playerId: 0, amount: 12 },
    annotations: {},
  };
}

function makeSixMaxAllInHand(): HandHistory {
  const players: Player[] = [
    makePlayer(0, 'UTG', Position.UTG),
    makePlayer(1, 'HJ', Position.HJ),
    makePlayer(2, 'CO', Position.CO),
    makePlayer(3, 'BTN', Position.BTN),
    makePlayer(4, 'SB', Position.SB),
    makePlayer(5, 'BB', Position.BB),
  ];
  return {
    id: 'hh-6max',
    site: 'pokerstars',
    handNumber: '2',
    timestamp: 0,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players,
    board: [],
    streets: {
      preflop: [
        { type: ActionType.Call, amount: 1, playerIndex: 4 },  // SB post（to=1）
        { type: ActionType.Call, amount: 2, playerIndex: 5 },  // BB post（to=2）
        { type: ActionType.AllIn, amount: 50, playerIndex: 0 }, // UTG all-in to 50
        { type: ActionType.Call, amount: 50, playerIndex: 1 },  // HJ 跟注 to 50
        { type: ActionType.Call, amount: 50, playerIndex: 2 },  // CO 跟注 to 50
        { type: ActionType.Fold, playerIndex: 3 },              // BTN 弃牌
        { type: ActionType.Fold, playerIndex: 4 },              // SB 弃牌
        { type: ActionType.Fold, playerIndex: 5 },              // BB 弃牌
      ],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 153,
    winner: { playerId: 0, amount: 153 },
    annotations: {},
  };
}

function resetStore(): void {
  useHandHistoryStore.setState({
    hands: [],
    currentHand: null,
    replayState: {
      currentStreet: 'preflop', currentActionIndex: 0, isPlaying: false, playbackSpeed: 1,
      visibleCards: [], playerStacks: [], currentPot: 0,
    },
  });
}

describe('HH-020 computeReplayState', () => {
  beforeEach(() => {
    resetStore();
  });

  it('HU「call 后 raise to」扣减正确：Hero/Villain 各实投 6，池 $12', () => {
    const store = useHandHistoryStore.getState();
    store.setCurrentHand(makeHUHand());
    store.jumpToStreet('showdown');

    const state = useHandHistoryStore.getState().replayState;
    expect(state.playerStacks).toEqual([94, 94]); // 100 - 6 各
    expect(state.currentPot).toBe(12);
  });

  it('HU 逐步 nextAction 到 preflop 末尾同样正确', () => {
    const store = useHandHistoryStore.getState();
    store.setCurrentHand(makeHUHand());
    store.nextAction();
    store.nextAction();
    store.nextAction();
    store.nextAction();
    const state = useHandHistoryStore.getState().replayState;
    expect(state.currentStreet).toBe('preflop');
    expect(state.currentActionIndex).toBe(4);
    expect(state.playerStacks).toEqual([94, 94]);
    expect(state.currentPot).toBe(12);
  });

  it('6-max 多人 all-in：普通扣减正确，无重复扣减（P0/P1/P2 各实投 50，盲注 1/2）', () => {
    const store = useHandHistoryStore.getState();
    store.setCurrentHand(makeSixMaxAllInHand());
    store.jumpToStreet('showdown');

    const state = useHandHistoryStore.getState().replayState;
    expect(state.playerStacks).toEqual([50, 50, 50, 100, 99, 98]);
    expect(state.currentPot).toBe(153);
  });
});
