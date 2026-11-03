import { describe, expect, it } from 'vitest';
import { parsePartyPokerHand } from './partypoker';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';

/**
 * partypoker 解析器单元测试（L1）：头部 / 座位位置 / 公共牌 / 动作金额 / 容错。
 *
 * 样本按 partypoker 导出惯例书写：两星段标记（`** Dealing down cards **`）、
 * 逗号分隔牌面、`[$X.XX USD]` 金额。摊牌收池与多手拆分见 `partypoker.payout.test.ts`。
 * 断言口径：HH-020 —— PlayerAction.amount 为「该动作结束后本街累计总投注额（to）」。
 */

// 三街完整牌局：盲注 / raise-to / check / bet / 摊牌 shows / returned uncalled bet / rake。
const FULL_HAND = `***** Hand History for Game 2345678 *****
$0.50/$1 USD NL Texas Hold'em - Tuesday, February 06, 21:05:00 EST 2024
Table 998877 (Real Money)
Seat 2 is the button
Seat 1: Hero ( $50.00 USD )
Seat 2: Alice ( $50.00 USD )
Seat 3: Bob ( $50.00 USD )
** Dealing down cards **
Dealt to Hero [ Ah, Kh ]
Bob posts small blind [$0.50 USD].
Hero posts big blind [$1.00 USD].
Alice raises [$3.00 USD]
Bob folds.
Hero calls [$2.00 USD]
** Dealing flop ** [ Qh, Jh, 2c ]
Hero checks
Alice bets [$4.00 USD]
Hero calls [$4.00 USD]
** Dealing turn ** [ Th ]
Hero checks
Alice bets [$10.00 USD]
Hero calls [$10.00 USD]
** Dealing river ** [ 3d ]
Hero checks
Alice checks
** SHOW DOWN **
Hero shows [ Ah, Kh ]
Alice shows [ Qc, Qd ]
Alice returned uncalled bet [$12.00 USD]
*** Summary ***
Total Pot $34 | Rake $1
Board [ Qh, Jh, 2c, Th, 3d ]
Seat 1: Hero collected ($33.00)
`;

// 单挑 PL：ante + all-in + 无「Dealing down cards」标记（Dealt to 在 header 阶段触发位置分配）。
const PL_ALL_IN_ANTE = `***** Hand History for Game 777777 *****
$2/$4 USD PL Texas Hold'em - Sunday, March 03, 12:00:00 EST 2024
Seat 1 is the button
Seat 1: Hero ( $100.00 USD )
Seat 2: Villain ( $60.00 USD )
Dealt to Hero [ Qs, Qd ]
Hero posts ante [$0.50 USD]
Villain posts ante [$0.50 USD]
Hero posts small blind [$2.00 USD]
Villain posts big blind [$4.00 USD]
Hero raises [$16.00 USD]
Villain is all-In [$55.50 USD]
Hero calls [$39.50 USD]
*** Summary ***
Total Pot $112.00
`;

// 截断导出：未知玩家动作行 / 非动作行 / Dealt to 的玩家不在座位表。
const TRUNCATED = `***** Hand History for Game 505050 *****
$1/$2 USD NL Texas Hold'em - Monday, June 03, 10:00:00 EST 2024
Seat 1 is the button
Seat 1: Hero ( $20.00 USD )
Seat 2: Villain ( $20.00 USD )
Dealt to Bystander [ Ac, Kc ]
Ghost calls [$2.00 USD]
Hero sits out
Villain raises [$6.00 USD]
Hero calls [$6.00 USD]
*** Summary ***
Total Pot $13.00
`;

// 仅替换 stakes 行的最小牌局，用于 gameType 派生。
function minimalHand(stakesLine: string): string {
  return `***** Hand History for Game 42 *****
${stakesLine}
Seat 1 is the button
Seat 1: Hero ( $10.00 USD )
Seat 2: Villain ( $10.00 USD )
Dealt to Hero [ Ac, Ad ]
Hero folds.
*** Summary ***
Total Pot $1.00
`;
}

describe('partypoker 头部与牌局元信息', () => {
  it('牌局号 / 大小盲 / 时间戳 / 默认 NL 类型', () => {
    const hand = parsePartyPokerHand(FULL_HAND);
    expect(hand.site).toBe('partypoker');
    expect(hand.handNumber).toBe('2345678');
    expect(hand.stakes).toEqual({ smallBlind: 0.5, bigBlind: 1 });
    expect(hand.gameType).toBe("No Limit Hold'em");
    // 解析器用 new Date(y, m, d, h, mi, s) 本地构造，断言同口径
    expect(hand.timestamp).toBe(new Date(2024, 1, 6, 21, 5, 0).getTime());
    expect(hand.id).toBe(`party-2345678-${hand.timestamp}`);
  });

  it('stakes 行的限注类型派生 gameType（NL / PL / Limit / 缺省）', () => {
    const cases: Array<[string, string]> = [
      ['$1/$2 USD NL Texas Hold\'em', "No Limit Hold'em"],
      ['$1/$2 USD PL Texas Hold\'em', "Pot Limit Hold'em"],
      ['$1/$2 USD Limit Texas Hold\'em', "Limit Hold'em"],
      ['$1/$2 USD Texas Hold\'em', "No Limit Hold'em"],
    ];
    for (const [stakesLine, expected] of cases) {
      expect(parsePartyPokerHand(minimalHand(stakesLine)).gameType).toBe(expected);
    }
  });
});

describe('partypoker 座位与位置', () => {
  it('按座位环分配位置（3 人桌 BTN / SB / BB）并识别 hero', () => {
    const hand = parsePartyPokerHand(FULL_HAND);
    expect(hand.players.map(p => p.name)).toEqual(['Hero', 'Alice', 'Bob']);
    expect(hand.players.map(p => p.position)).toEqual([Position.BB, Position.BTN, Position.SB]);
    expect(hand.heroPlayerId).toBe(0);
    expect(hand.players[0]!.seatNumber).toBe(1);
    expect(hand.players[0]!.stack).toBe(50);
  });

  it('HU 桌按钮位即小盲（BTN / BB），无「Dealing down cards」标记也分配位置', () => {
    const hand = parsePartyPokerHand(PL_ALL_IN_ANTE);
    expect(hand.players.map(p => p.position)).toEqual([Position.BTN, Position.BB]);
    expect(hand.heroPlayerId).toBe(0);
  });
});

describe('partypoker 公共牌', () => {
  it('三街标记逐街累积为 5 张（逗号分隔 + 转牌/河牌单牌）', () => {
    const hand = parsePartyPokerHand(FULL_HAND);
    expect(hand.board).toEqual([
      { rank: Rank.Queen, suit: Suit.Hearts },
      { rank: Rank.Jack, suit: Suit.Hearts },
      { rank: Rank.Two, suit: Suit.Clubs },
      { rank: Rank.Ten, suit: Suit.Hearts },
      { rank: Rank.Three, suit: Suit.Diamonds },
    ]);
    expect(hand.streets.turn.cards).toEqual([{ rank: Rank.Ten, suit: Suit.Hearts }]);
    expect(hand.streets.river.cards).toEqual([{ rank: Rank.Three, suit: Suit.Diamonds }]);
  });
});

describe('partypoker 动作金额（HH-020 to 口径）', () => {
  it('翻前：盲注增量累加为 to，raises [$X] 按 to 保留', () => {
    const preflop = parsePartyPokerHand(FULL_HAND).streets.preflop;
    expect(preflop.map(a => a.type)).toEqual([
      ActionType.Call, // Bob 小盲
      ActionType.Call, // Hero 大盲
      ActionType.Raise, // Alice raise to 3
      ActionType.Fold, // Bob
      ActionType.Call, // Hero 补齐到 3
    ]);
    expect(preflop.map(a => a.amount)).toEqual([0.5, 1, 3, undefined, 3]);
  });

  it('翻牌 / 转牌：check 不带金额，bet 后的 call 累加为同一 to；河牌无金额动作', () => {
    const hand = parsePartyPokerHand(FULL_HAND);
    expect(hand.streets.flop.actions.map(a => a.amount)).toEqual([undefined, 4, 4]);
    expect(hand.streets.flop.actions[0]!.type).toBe(ActionType.Check);
    expect(hand.streets.turn.actions.map(a => a.amount)).toEqual([undefined, 10, 10]);
    expect(hand.streets.river.actions).toEqual([
      { type: ActionType.Check, playerIndex: 0 },
      { type: ActionType.Check, playerIndex: 1 },
    ]);
  });

  it('ante 计入本街投入：ante + 盲注 + raise to + all-in + 跟注均归一到 to', () => {
    const preflop = parsePartyPokerHand(PL_ALL_IN_ANTE).streets.preflop;
    expect(preflop.map(a => a.type)).toEqual([
      ActionType.Call, // ante
      ActionType.Call, // ante
      ActionType.Call, // 小盲
      ActionType.Call, // 大盲
      ActionType.Raise, // raise to 16
      ActionType.AllIn, // all-in 到 55.5
      ActionType.Call, // 补齐到 55.5
    ]);
    expect(preflop.map(a => a.amount)).toEqual([0.5, 0.5, 2.5, 4.5, 16, 55.5, 55.5]);
  });

  it('无方括号的金额写法（raises $6 / calls $6）同样解析', () => {
    const noBrackets = TRUNCATED
      .replace('Villain raises [$6.00 USD]', 'Villain raises $6')
      .replace('Hero calls [$6.00 USD]', 'Hero calls $6');
    const hand = parsePartyPokerHand(noBrackets);
    expect(hand.streets.preflop.map(a => a.amount)).toEqual([6, 6]);
  });
});

describe('partypoker 容错（截断导出 / 无效输入）', () => {
  it('空文本与纯空白抛错', () => {
    expect(() => parsePartyPokerHand('')).toThrow('Empty hand history text');
    expect(() => parsePartyPokerHand('   \n  ')).toThrow('Empty hand history text');
  });

  it('未知玩家动作行与非动作行被忽略，其余动作照常解析', () => {
    const hand = parsePartyPokerHand(TRUNCATED);
    // Ghost 不在座位表内（截断导出）→ 丢弃；sits out 非动作动词 → 丢弃
    expect(hand.streets.preflop).toEqual([
      { type: ActionType.Raise, amount: 6, playerIndex: 1 },
      { type: ActionType.Call, amount: 6, playerIndex: 0 },
    ]);
    expect(hand.pot).toBe(13);
  });

  it('Dealt to 的玩家不在座位表内：不抛错，heroPlayerId 保持 undefined', () => {
    const hand = parsePartyPokerHand(TRUNCATED);
    expect(hand.heroPlayerId).toBeUndefined();
    expect(hand.players.every(p => p.holeCards === undefined)).toBe(true);
  });
});
