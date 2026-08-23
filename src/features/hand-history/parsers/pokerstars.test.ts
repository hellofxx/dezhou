import { describe, it, expect } from 'vitest';
import { parsePokerStarsHand, parsePokerStarsMultiple } from './pokerstars';
import { assignPositions } from './common';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';

// ─── assignPositions（人数感知位置分配）─────────────────────
// 修复前三个解析器共用 6 人序列：HU 非按钮位被错标 SB（应为 BB，HU 按钮即小盲）、
// 4 人桌第 4 位被错标 UTG（应为 CO）、5 人桌出现不存在的 UTG。
describe('assignPositions 人数感知', () => {
  it('HU（2 人）：按钮位 BTN（即 SB），另一位 BB', () => {
    // 座位环 BTN=seat1 → seat2
    expect(assignPositions(2, 1, [1, 2])).toEqual([Position.BTN, Position.BB]);
    expect(assignPositions(2, 2, [1, 2])).toEqual([Position.BB, Position.BTN]);
  });

  it('4 人：BTN → SB → BB → CO', () => {
    // 座位环 BTN=seat2 → seat3(SB) → seat4(BB) → seat1(CO)
    expect(assignPositions(4, 2, [1, 2, 3, 4])).toEqual([
      Position.CO, Position.BTN, Position.SB, Position.BB,
    ]);
  });

  it('5 人：BTN → SB → BB → HJ → CO（无 UTG）', () => {
    expect(assignPositions(5, 1, [1, 2, 3, 4, 5])).toEqual([
      Position.BTN, Position.SB, Position.BB, Position.HJ, Position.CO,
    ]);
  });

  it('6 人：BTN → SB → BB → UTG → HJ → CO', () => {
    expect(assignPositions(6, 3, [1, 2, 3, 4, 5, 6])).toEqual([
      Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB, Position.UTG,
    ]);
  });
});

// ─── parsePokerStarsHand（6-max 标准牌局）──────────────────
const SIX_MAX = `
PokerStars Hand #123456789: Hold'em No Limit ($1/$2 USD) - 2024/01/15 20:30:00 ET
Table 'Aurora' 6-max Seat #3 is the button
Seat 1: Alice ($200 in chips)
Seat 2: Bob ($200 in chips)
Seat 3: Carol ($200 in chips)
Seat 4: Dave ($200 in chips)
Seat 5: Eve ($200 in chips)
Seat 6: Frank ($200 in chips)
*** HOLE CARDS ***
Dealt to Alice [Ah Kd]
Frank: folds
Alice: raises $4 to $6
Bob: folds
Carol: folds
Dave: folds
Eve: folds
*** SUMMARY ***
Total pot $9
Alice collected $9 from pot
`;

describe('parsePokerStarsHand 6-max', () => {
  const hand = parsePokerStarsHand(SIX_MAX);

  it('stakes / handNumber / pot 解析', () => {
    expect(hand.handNumber).toBe('123456789');
    expect(hand.stakes).toEqual({ smallBlind: 1, bigBlind: 2 });
    expect(hand.pot).toBe(9);
  });

  it('raises X to Y 取 to 金额（总注额口径）', () => {
    const raise = hand.streets.preflop.find(a => a.type === ActionType.Raise);
    expect(raise?.amount).toBe(6);
  });

  it('heroPlayerId 指向 "Dealt to" 玩家', () => {
    expect(hand.heroPlayerId).toBe(0);
    expect(hand.players[hand.heroPlayerId!]!.name).toBe('Alice');
  });

  it('winner 为收集底池玩家', () => {
    expect(hand.winner?.playerId).toBe(0);
    expect(hand.winner?.amount).toBe(9);
  });
});

// ─── parsePokerStarsHand（HU 牌局）────────────────────────
const HEADS_UP = `
PokerStars Hand #222: Hold'em No Limit ($1/$2 USD) - 2024/01/15 21:00:00 ET
Table 'Duel' 2-max Seat #1 is the button
Seat 1: Hero ($200 in chips)
Seat 2: Villain ($200 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah As]
Hero: raises $4 to $6
Villain: calls $4
*** FLOP *** [Kd 7h 2c]
Villain: checks
Hero: bets $6
Villain: folds
Uncalled bet ($6) returned to Hero
*** SUMMARY ***
Total pot $15
Hero collected $15 from pot
`;

describe('parsePokerStarsHand heads-up', () => {
  const hand = parsePokerStarsHand(HEADS_UP);

  it('HU 位置：按钮位 BTN（即 SB），另一位 BB（修复前另一位被错标 SB）', () => {
    expect(hand.players[0]!.position).toBe(Position.BTN);
    expect(hand.players[1]!.position).toBe(Position.BB);
  });

  it('flop 牌与 postflop 动作解析', () => {
    expect(hand.streets.flop.cards).toHaveLength(3);
    expect(hand.streets.flop.actions.map(a => a.type)).toEqual([
      ActionType.Check, ActionType.Raise, ActionType.Fold,
    ]);
  });
});

// ─── winnerHand 优先取赢家 shows 行 ────────────────────────
const SHOWDOWN = `
PokerStars Hand #333: Hold'em No Limit ($1/$2 USD) - 2024/01/15 22:00:00 ET
Table 'Showdown' 2-max Seat #2 is the button
Seat 1: Hero ($200 in chips)
Seat 2: Villain ($200 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah As]
Hero: calls $1
Villain: checks
*** FLOP *** [Kd 7h 2c]
Villain: checks
Hero: bets $2
Villain: calls $2
*** SHOW DOWN ***
Villain: shows [Kd Qh] (a pair of Kings)
Hero: shows [Ah As] (a pair of Aces)
Hero collected $10 from pot
*** SUMMARY ***
Total pot $10
`;

describe('parsePokerStarsHand winnerHand', () => {
  it('winnerHand 取赢家的手牌描述而非第一个摊牌玩家（修复前取到输家的 pair of Kings）', () => {
    const hand = parsePokerStarsHand(SHOWDOWN);
    expect(hand.winner?.playerId).toBe(0);
    expect(hand.winner?.hand).toBe('a pair of Aces');
  });

  it('showdown 段所有摊牌玩家手牌被记录', () => {
    const hand = parsePokerStarsHand(SHOWDOWN);
    expect(hand.players[1]!.holeCards).toBeDefined();
  });
});

// ─── 多手解析 ──────────────────────────────────────────────
describe('parsePokerStarsMultiple', () => {
  it('按 "PokerStars Hand #" 分割解析多手', () => {
    const hands = parsePokerStarsMultiple(SIX_MAX + HEADS_UP);
    expect(hands).toHaveLength(2);
    expect(hands[0]!.handNumber).toBe('123456789');
    expect(hands[1]!.handNumber).toBe('222');
  });

  it('空文本返回空数组（不抛错）', () => {
    expect(parsePokerStarsMultiple('')).toEqual([]);
    expect(parsePokerStarsMultiple('random text')).toEqual([]);
  });
});
