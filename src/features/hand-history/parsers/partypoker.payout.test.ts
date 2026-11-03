import { describe, expect, it } from 'vitest';
import { parsePartyPokerHand, parsePartyPokerMultiple } from './partypoker';
import { Rank, Suit } from '@/shared/types/poker';

/**
 * partypoker 摊牌与收池口径（L1）：shows 写入底牌、摊牌段 / SUMMARY 的 collected、
 * rake 行、returned uncalled bet 不干扰收池、side pot 多赢家、多手文本拆分与坏手跳过。
 * 逐街动作与金额（HH-020 to 口径）见 `partypoker.test.ts`。
 */

// 收池局：摊牌 shows → returned uncalled bet → 摊牌段 collected → SUMMARY（Total Pot | Rake + Seat N collected）
const PAYOUT = `***** Hand History for Game 111222 *****
$1/$2 USD NL Texas Hold'em - Saturday, May 11, 09:00:00 EST 2024
Seat 1 is the button
Seat 1: Hero ( $100.00 USD )
Seat 2: Villain ( $100.00 USD )
** Dealing down cards **
Dealt to Hero [ Qs, Qd ]
Hero posts small blind [$1.00 USD]
Villain posts big blind [$2.00 USD]
Hero raises [$6.00 USD]
Villain calls [$4.00 USD]
** Dealing flop ** [ 7s, 6s, 5s ]
Hero bets [$8.00 USD]
Villain calls [$8.00 USD]
*** SHOW DOWN ***
Villain shows [ Kc, Kd ]
Hero shows [ Qs, Qd ]
Villain returned uncalled bet [$8.00 USD]
Hero collected [$28.00 USD] from pot
*** Summary ***
Total Pot $28.00 | Rake $1.00
Seat 1: Hero collected ($27.00)
`;

// side pot：SUMMARY 中多条 Seat N: collected 行（不应被当作座位行重复登记玩家）
const SIDE_POT = `***** Hand History for Game 31337 *****
$1/$2 USD NL Texas Hold'em - Saturday, May 11, 10:00:00 EST 2024
Seat 2 is the button
Seat 1: Hero ( $100.00 USD )
Seat 2: Alice ( $100.00 USD )
Seat 3: Bob ( $100.00 USD )
** Dealing down cards **
Dealt to Hero [ Ac, Ad ]
Bob posts small blind [$1.00 USD]
Hero posts big blind [$2.00 USD]
Alice folds.
Bob is all-In [$99.00 USD]
Hero calls [$98.00 USD]
*** Summary ***
Total Pot $200.00
Seat 3: Bob collected [$40.00 USD] from main pot
Seat 1: Hero collected [$120.00 USD] from side pot
`;

const MULTI_HEADER_HAND = `***** Hand History for Game 42 *****
$1/$2 USD NL Texas Hold'em
Seat 1 is the button
Seat 1: Hero ( $10.00 USD )
Seat 2: Villain ( $10.00 USD )
Dealt to Hero [ Ac, Ad ]
Hero folds.
*** Summary ***
Total Pot $1.00
`;

describe('partypoker 摊牌底牌', () => {
  it('摊牌段 shows 写入双方底牌（hero 以 Dealt to 为准，逗号分隔）', () => {
    const hand = parsePartyPokerHand(PAYOUT);
    expect(hand.players[0]!.holeCards).toEqual([
      { rank: Rank.Queen, suit: Suit.Spades },
      { rank: Rank.Queen, suit: Suit.Diamonds },
    ]);
    expect(hand.players[1]!.holeCards).toEqual([
      { rank: Rank.King, suit: Suit.Clubs },
      { rank: Rank.King, suit: Suit.Diamonds },
    ]);
  });
});

describe('partypoker 收池口径', () => {
  it('SUMMARY 收池 + rake：pot 取 Total Pot（rake 前总额），winner 取 collected 净额', () => {
    const hand = parsePartyPokerHand(PAYOUT);
    expect(hand.pot).toBe(28);
    // 摊牌段的 collected（28）被 SUMMARY 的净额行覆盖
    expect(hand.winner).toEqual({ playerId: 0, amount: 27 });
  });

  it('摊牌段 collected 且无 SUMMARY 收池行：winner 与 pot 由摊牌行兜底', () => {
    const noSummary = PAYOUT
      .split('\n')
      .filter(line => !line.includes('Total Pot') && !line.includes('collected ($27.00)'))
      .join('\n');
    const hand = parsePartyPokerHand(noSummary);
    expect(hand.winner).toEqual({ playerId: 0, amount: 28 });
    expect(hand.pot).toBe(28);
  });

  it('side pot（多条 collected）：当前单赢家模型取最后一条，pot 以 Total Pot 为准且玩家不重复', () => {
    const hand = parsePartyPokerHand(SIDE_POT);
    expect(hand.pot).toBe(200);
    // 单赢家字段无法表达多个赢家：保留最后一条 collected（已知模型限制）
    expect(hand.winner).toEqual({ playerId: 0, amount: 120 });
    // Seat N: ... collected 行不被座位解析重复登记
    expect(hand.players.map(p => p.name)).toEqual(['Hero', 'Alice', 'Bob']);
  });
});

describe('parsePartyPokerMultiple', () => {
  it('按牌局头拆分多手并逐手解析', () => {
    const hands = parsePartyPokerMultiple(
      `${MULTI_HEADER_HAND}${MULTI_HEADER_HAND.replace('Game 42', 'Game 43')}`,
    );
    expect(hands.map(h => h.handNumber)).toEqual(['42', '43']);
    expect(new Set(hands.map(h => h.id)).size).toBe(2);
  });

  it('单手中解析失败（非法牌面）被跳过，其余手牌保留', () => {
    const broken = MULTI_HEADER_HAND.replace('[ Ac, Ad ]', '[ Zz, Ad ]');
    expect(() => parsePartyPokerHand(broken)).toThrow();
    expect(parsePartyPokerMultiple(`${MULTI_HEADER_HAND}${broken}`).map(h => h.handNumber)).toEqual(['42']);
  });

  it('无牌局头的文本 / 空文本返回空数组', () => {
    expect(parsePartyPokerMultiple('some unrelated text')).toEqual([]);
    expect(parsePartyPokerMultiple('')).toEqual([]);
  });
});
