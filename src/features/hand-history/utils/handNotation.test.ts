import { describe, expect, it } from 'vitest';
import { cardToNotation, cardsToNotation, formatAction, formatDate, formatHandSummary } from './handNotation';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { HandHistory } from '../types';

/**
 * 牌局记法与文本格式工具（L1）。
 * 关键口径：HH-020 —— amount 为「to 金额」，formatAction 对 Call 显示增量，
 * 对 Raise / AllIn 显示总额，调用方负责传入本街先前已投入的 priorAmount。
 */

const PLAYERS = [
  { id: 0, name: 'Alice', position: Position.BTN, seatNumber: 1, stack: 100 },
  { id: 1, name: 'Bob', position: Position.BB, seatNumber: 2, stack: 100 },
];

function hand(overrides: Partial<HandHistory> = {}): HandHistory {
  return {
    id: 'h1',
    site: 'pokerstars',
    handNumber: '12345',
    timestamp: new Date(2024, 0, 15, 20, 30).getTime(),
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players: PLAYERS,
    board: [],
    streets: {
      preflop: [],
      flop: { cards: [], actions: [] },
      turn: { cards: [], actions: [] },
      river: { cards: [], actions: [] },
    },
    pot: 42,
    annotations: {},
    ...overrides,
  };
}

describe('cardToNotation / cardsToNotation', () => {
  it('单张牌转短记法（rank + suit 字符）', () => {
    expect(cardToNotation({ rank: Rank.Ace, suit: Suit.Hearts })).toBe('Ah');
    expect(cardToNotation({ rank: Rank.Ten, suit: Suit.Spades })).toBe('Ts');
    expect(cardToNotation({ rank: Rank.Two, suit: Suit.Diamonds })).toBe('2d');
  });

  it('多张牌按顺序拼接', () => {
    expect(
      cardsToNotation([
        { rank: Rank.Ace, suit: Suit.Hearts },
        { rank: Rank.King, suit: Suit.Spades },
        { rank: Rank.Queen, suit: Suit.Diamonds },
      ]),
    ).toBe('AhKsQd');
    expect(cardsToNotation([])).toBe('');
  });
});

describe('formatAction（HH-020 to 金额 → 可见增量）', () => {
  it('fold / check 不带金额', () => {
    expect(formatAction({ type: ActionType.Fold, playerIndex: 0 }, PLAYERS)).toBe('Alice: folds');
    expect(formatAction({ type: ActionType.Check, playerIndex: 1 }, PLAYERS)).toBe('Bob: checks');
  });

  it('Call 显示增量：to 6 且本街已投入 2 → calls $4', () => {
    const call: PlayerAction = { type: ActionType.Call, amount: 6, playerIndex: 0 };
    expect(formatAction(call, PLAYERS, 2)).toBe('Alice: calls $4');
    // 缺省 priorAmount=0 时即全额
    expect(formatAction(call, PLAYERS)).toBe('Alice: calls $6');
  });

  it('Call 的增量不会被 prior 反超成负数', () => {
    const call: PlayerAction = { type: ActionType.Call, amount: 2, playerIndex: 0 };
    expect(formatAction(call, PLAYERS, 5)).toBe('Alice: calls $0');
  });

  it('Raise 显示 to 总额，AllIn 显示总额', () => {
    expect(formatAction({ type: ActionType.Raise, amount: 12, playerIndex: 0 }, PLAYERS, 6))
      .toBe('Alice: raises to $12');
    expect(formatAction({ type: ActionType.AllIn, amount: 250, playerIndex: 1 }, PLAYERS))
      .toBe('Bob: all-in $250');
  });

  it('玩家索引越界回退为 Seat N', () => {
    expect(formatAction({ type: ActionType.Fold, playerIndex: 4 }, PLAYERS)).toBe('Seat 5: folds');
  });

  it('未知动作类型回退为动作字面量', () => {
    const odd = { type: 'time-bank', playerIndex: 0 } as unknown as PlayerAction;
    expect(formatAction(odd, PLAYERS)).toBe('Alice: time-bank');
  });
});

describe('formatHandSummary', () => {
  it('包含手牌号 / 盲注 / 赢家 / 底池', () => {
    const summary = formatHandSummary(hand({ winner: { playerId: 1, amount: 42 } }));
    expect(summary).toContain('#12345');
    expect(summary).toContain('1/2');
    expect(summary).toContain('Winner: Bob');
    expect(summary).toContain('$42');
  });

  it('无 winner 时显示 N/A；winner.playerId 悬空时显示 Unknown', () => {
    expect(formatHandSummary(hand())).toContain('Winner: N/A');
    expect(formatHandSummary(hand({ winner: { playerId: 9, amount: 10 } }))).toContain('Winner: Unknown');
  });
});

describe('formatDate', () => {
  it('默认 zh-CN 输出含年份，且随 locale 变化（调用方传 i18n.language）', () => {
    const ts = new Date(2024, 0, 15, 20, 30).getTime();
    const zh = formatDate(ts);
    const en = formatDate(ts, 'en-US');
    expect(zh).toContain('2024');
    expect(en).toContain('2024');
    // 语言跟随：两种 locale 的排版不同（不锁定具体分隔符，避免 ICU 版本敏感）
    expect(en).not.toBe(zh);
    // 小时与分钟参与格式化
    expect(zh).toContain('30');
  });
});
