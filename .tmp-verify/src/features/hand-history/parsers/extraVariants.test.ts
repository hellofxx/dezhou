import { describe, it, expect } from 'vitest';
import { parsePartyPokerHand } from './partypoker';
import { parsePokerStarsHand } from './pokerstars';

// ─── HH-021：partypoker 无 showdown 段（对手 shows 手牌丢失）────
// 按 partypoker 公开导出格式惯例实现（'*** SHOW DOWN ***' 段 + 'Name shows [X, Y]' 行），
// 未经真实样例回归验证。
const PARTY_SHOWDOWN = `
***** Hand History for Game 12345678 *****
$1/$2 USD NL Texas Hold'em - Monday, January 15, 20:30:00 EST 2024
Table 1234567 (Real Money)
Seat 1 is the button
Seat 1: Hero ( $200.00 USD )
Seat 2: Villain ( $200.00 USD )
*** Dealing down cards ***
Dealt to Hero [ Ah, As ]
Hero posts small blind [$1.00 USD]
Villain posts big blind [$2.00 USD]
Hero raises [$6.00 USD]
Villain calls [$4.00 USD]
*** Dealing flop *** [ Kd, 7h, 2c ]
Villain checks
Hero bets [$4.00 USD]
Villain calls [$4.00 USD]
*** SHOW DOWN ***
Villain shows [ Qd, Js ]
Hero shows [ Ah, As ]
Hero collected $20.00 USD from pot
*** Summary ***
Total Pot: $20.00
`;

describe('HH-021 partypoker showdown 段', () => {
  it('摊牌段对手 shows 手牌被记录（此前全丢）', () => {
    const hand = parsePartyPokerHand(PARTY_SHOWDOWN);
    // 对手手牌存在
    const villain = hand.players.find(p => p.name === 'Villain');
    expect(villain?.holeCards).toBeDefined();
    expect(villain?.holeCards).toHaveLength(2);
    // 赢家来自 collected 行
    expect(hand.winner?.playerId).toBe(0);
    expect(hand.winner?.amount).toBe(20);
  });

  it('Hero 手牌仍正确（Dealt to 覆盖）', () => {
    const hand = parsePartyPokerHand(PARTY_SHOWDOWN);
    expect(hand.heroPlayerId).toBe(0);
    expect(hand.players[0]!.holeCards).toHaveLength(2);
  });

  it('raise/call 金额按统一 to 口径归一（raises [$6]=to 6，calls [$4]=增量→to 6）', () => {
    const hand = parsePartyPokerHand(PARTY_SHOWDOWN);
    const preflop = hand.streets.preflop;
    expect(preflop.map(a => a.amount)).toEqual([1, 2, 6, 6]);
  });
});

// ─── HH-022：PokerStars 现代 SUMMARY "showed [...] and won ($X)" 合并行 ──────
// 按真实 PS 现代格式惯例实现（传统 SUMMARY 该行一般为弃牌/无手牌玩家，此变体在收池摊牌局出现），
// 未经真实样例回归验证。
const PS_SHOWED_AND_WON = `
PokerStars Hand #888: Hold'em No Limit ($1/$2 USD) - 2024/01/15 23:30:00 ET
Table 'Showdown2' 2-max Seat #2 is the button
Seat 1: Hero ($300 in chips)
Seat 2: Villain ($300 in chips)
*** HOLE CARDS ***
Dealt to Hero [Ah As]
Villain: raises $6 to $12
Hero: calls $10
*** FLOP *** [Kd 7h 2c]
Villain: bets $20
Hero: raises $40 to $60
Villain: calls $40
*** TURN *** [Qh]
Villain: checks
Hero: bets $80
Villain: calls $80
*** RIVER *** [5d]
Villain: checks
Hero: bets $150
Villain: calls $150
*** SHOW DOWN ***
Villain: shows [Kd Ah] (a pair of Kings)
Hero: shows [Ah As] (a pair of Aces)
*** SUMMARY ***
Total pot $360
Seat 1: Hero showed [Ah As] and won ($360)
`;

describe('HH-022 PokerStars SUMMARY showed...and won', () => {
  it('showed [...] and won 合并行解析出赢家与赢家手牌', () => {
    const hand = parsePokerStarsHand(PS_SHOWED_AND_WON);
    expect(hand.winner?.playerId).toBe(0);
    expect(hand.winner?.amount).toBe(360);
    expect(hand.pot).toBe(360);
  });

  it('赢家手牌被记录（holeCards 已设置，showdown shows 不为 and-won 行覆盖）', () => {
    const hand = parsePokerStarsHand(PS_SHOWED_AND_WON);
    const hero = hand.players[0]!;
    expect(hero.holeCards).toHaveLength(2);
  });
});
