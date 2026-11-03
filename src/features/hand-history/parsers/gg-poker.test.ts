import { describe, expect, it } from 'vitest';
import { parseGGPokerHand, parseGGPokerMultiple } from './gg-poker';
import { detectFormat } from './common';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';

/**
 * GGPoker 解析器单元测试（L1）。
 *
 * 样本按 GG Poker 公开导出格式惯例书写，并遵循本解析器的州约定：
 * 盲注动作行位于 `*** HOLE CARDS ***` 之后（州机在 header 阶段丢弃动作行）；
 * TURN / RIVER 行第一个方括号是完整公共牌，第二个方括号才是新增牌。
 * 断言口径：HH-020 —— PlayerAction.amount 为「该动作结束后本街累计总投注额（to）」。
 */

const SIX_MAX = `
GGPoker Hand #HD-123456789: Hold'em No Limit ($0.50/$1) - 2024/01/15 20:30:00
Table 'RushAndCash' 6-max Seat #3 is the button
Seat 1: Alice ($100)
Seat 2: Bob ($100)
Seat 3: Carol ($100)
Seat 4: Dave ($100)
Seat 5: Eve ($100)
Seat 6: Frank ($100)
*** HOLE CARDS ***
Dealt to Alice [Ah Kd]
Alice: posts small blind $0.50
Bob: posts big blind $1
Carol: raises $2 to $3
Dave: folds
Eve: folds
Frank: folds
Alice: calls $2.50
Bob: folds
*** FLOP *** [Kd 7h 2c]
Alice: checks
Carol: bets $4
Alice: calls $4
*** TURN *** [Kd 7h 2c] [Qh]
Alice: checks
Carol: checks
*** RIVER *** [Kd 7h 2c Qh] [5d]
Alice: bets $8
Carol: calls $8
*** SHOWDOWN ***
Alice: shows [Ah Kd]
Carol: shows [Kc Qc]
Alice collected $30 from pot
*** SUMMARY ***
Total pot $30 | Rake $1.50
Board: [Kd 7h 2c Qh 5d]
Seat 3: Carol showed [Kc Qc] and lost
`;

// 收池局（bet & fold，无 SHOWDOWN 段）：collected 行只出现在 SUMMARY。
const BET_AND_FOLD = `
GGPoker Hand #HD-222: Hold'em No Limit ($1/$2) - 2024/02/01 10:00:00
Table 'Beta' 2-max Seat #1 is the button
Seat 1: Hero ($200)
Seat 2: Villain ($200)
*** HOLE CARDS ***
Dealt to Hero [Qs Qd]
Hero: posts small blind $1
Villain: posts big blind $2
Hero: raises $4 to $6
Villain: folds
*** SUMMARY ***
Total pot $8
Seat 1: Hero collected $8
`;

// emoji 前缀动作行（stripEmoji 回退）+ all-in + 千分位金额。
const EMOJI_ALL_IN = `
GGPoker Hand #HD-444: Hold'em No Limit ($5/$10) - 2024/03/02 12:00:00
Table 'Gamma' 2-max Seat #1 is the button
Seat 1: Shark ($1,000)
Seat 2: Fish ($1,000)
*** HOLE CARDS ***
Dealt to Shark [As Ah]
🦈 Shark: is all-in ($1,000)
Fish: calls $990
*** FLOP *** [Kd 7h 2c]
*** SHOWDOWN ***
🦈 Shark: shows [As Ah]
Fish: shows [Kd Kc]
🦈 Shark collected $2,010
*** SUMMARY ***
Total pot $2,010
`;

describe('parseGGPokerHand 6-max 标准牌局', () => {
  const hand = parseGGPokerHand(SIX_MAX);

  it('头信息：手牌号 / 站点 / 时间戳 / 盲注（盲注取自头信息行括号）', () => {
    expect(hand.site).toBe('ggpoker');
    expect(hand.handNumber).toBe('123456789');
    expect(hand.timestamp).toBe(new Date(2024, 0, 15, 20, 30, 0).getTime());
    // 修复前头信息行在 stakes 解析前 continue，盲注恒为 0/0
    expect(hand.stakes).toEqual({ smallBlind: 0.5, bigBlind: 1 });
    expect(hand.id).toBe(`gg-123456789-${hand.timestamp}`);
  });

  it('座位与位置：按钮 seat3 → BTN，环上依次 SB/BB/UTG/HJ/CO', () => {
    expect(hand.players.map(p => p.seatNumber)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(hand.players.map(p => p.position)).toEqual([
      Position.HJ, Position.CO, Position.BTN, Position.SB, Position.BB, Position.UTG,
    ]);
    expect(hand.players.map(p => p.stack)).toEqual([100, 100, 100, 100, 100, 100]);
  });

  it('hero 取自 "Dealt to" 玩家并回填底牌', () => {
    expect(hand.heroPlayerId).toBe(0);
    expect(hand.players[0]!.name).toBe('Alice');
    expect(hand.players[0]!.holeCards).toEqual([
      { rank: Rank.Ace, suit: Suit.Hearts },
      { rank: Rank.King, suit: Suit.Diamonds },
    ]);
  });

  it('翻前动作类型顺序与 post/raise/call 口径', () => {
    expect(hand.streets.preflop.map(a => a.type)).toEqual([
      ActionType.Call, ActionType.Call, ActionType.Raise, ActionType.Fold,
      ActionType.Fold, ActionType.Fold, ActionType.Call, ActionType.Fold,
    ]);
    // posts 盲注是增量但归一为 to：SB 0.5、BB 1；raise to 3 保持 to；补齐跟注 0.5+2.5=3
    expect(hand.streets.preflop.map(a => a.amount)).toEqual([
      0.5, 1, 3, undefined, undefined, undefined, 3, undefined,
    ]);
  });

  it('逐街公共牌：flop 3 张 + turn/river 各 1 张，不重复累计', () => {
    expect(hand.board).toEqual([
      { rank: Rank.King, suit: Suit.Diamonds },
      { rank: Rank.Seven, suit: Suit.Hearts },
      { rank: Rank.Two, suit: Suit.Clubs },
      { rank: Rank.Queen, suit: Suit.Hearts },
      { rank: Rank.Five, suit: Suit.Diamonds },
    ]);
    expect(hand.streets.flop.cards).toHaveLength(3);
    expect(hand.streets.turn.cards).toEqual([{ rank: Rank.Queen, suit: Suit.Hearts }]);
    expect(hand.streets.river.cards).toEqual([{ rank: Rank.Five, suit: Suit.Diamonds }]);
  });

  it('翻后动作：check/bet(→Raise)/call 与金额归一', () => {
    expect(hand.streets.flop.actions.map(a => a.type)).toEqual([
      ActionType.Check, ActionType.Raise, ActionType.Call,
    ]);
    expect(hand.streets.flop.actions.map(a => a.amount)).toEqual([undefined, 4, 4]);
    expect(hand.streets.turn.actions.map(a => a.type)).toEqual([ActionType.Check, ActionType.Check]);
    expect(hand.streets.river.actions.map(a => a.amount)).toEqual([8, 8]);
  });

  it('摊牌：双方 shows 手牌均写入，赢家与底池来自 collected / Total pot', () => {
    expect(hand.players[2]!.holeCards).toEqual([
      { rank: Rank.King, suit: Suit.Clubs },
      { rank: Rank.Queen, suit: Suit.Clubs },
    ]);
    expect(hand.winner).toEqual({ playerId: 0, amount: 30 });
    expect(hand.pot).toBeCloseTo(30, 10);
    expect(hand.annotations).toEqual({});
  });
});

describe('parseGGPokerHand 收池局（SUMMARY 段 collected）', () => {
  const hand = parseGGPokerHand(BET_AND_FOLD);

  it('无 SHOWDOWN 段时 winner 仍从 SUMMARY 的 collected 行解析', () => {
    expect(hand.winner).toEqual({ playerId: 0, amount: 8 });
    expect(hand.pot).toBe(8);
  });

  it('HU 位置：按钮位 BTN（即 SB），另一位 BB', () => {
    expect(hand.players.map(p => p.position)).toEqual([Position.BTN, Position.BB]);
  });

  it('HU 翻前 to 金额：SB 1 / BB 2 / raise to 6', () => {
    expect(hand.streets.preflop.map(a => a.amount)).toEqual([1, 2, 6, undefined]);
  });
});

describe('parseGGPokerHand 脏数据兼容', () => {
  it('emoji 前缀动作行按去 emoji 名称匹配玩家；千分位金额正确解析', () => {
    const hand = parseGGPokerHand(EMOJI_ALL_IN);

    const allIn = hand.streets.preflop.find(a => a.type === ActionType.AllIn);
    expect(allIn?.playerIndex).toBe(0);
    expect(allIn?.amount).toBe(1000);
    expect(hand.players[1]!.holeCards).toHaveLength(2);
    expect(hand.winner).toEqual({ playerId: 0, amount: 2010 });
    expect(hand.pot).toBe(2010);
    expect(hand.stakes).toEqual({ smallBlind: 5, bigBlind: 10 });
  });

  it('独立 stakes 行（无限注无括号写法）仍可回退识别盲注', () => {
    const hand = parseGGPokerHand(`
GGPoker Hand #HD-555: Hold'em No Limit - 2024/04/01 09:00:00
$0.10/$0.25
Table 'Delta' 2-max Seat #1 is the button
Seat 1: A ($10)
Seat 2: B ($10)
*** HOLE CARDS ***
Dealt to A [2c 3d]
A: checks
*** SUMMARY ***
Total pot $0
`);
    expect(hand.stakes).toEqual({ smallBlind: 0.1, bigBlind: 0.25 });
    expect(hand.streets.preflop).toEqual([{ type: ActionType.Check, playerIndex: 0 }]);
  });

  it('无匹配行时不崩溃：返回空玩家/空底池的最小结构', () => {
    const hand = parseGGPokerHand('random text without any hand structure');
    expect(hand.players).toEqual([]);
    expect(hand.board).toEqual([]);
    expect(hand.pot).toBe(0);
    expect(hand.winner).toBeUndefined();
    expect(hand.heroPlayerId).toBeUndefined();
  });

  it('空文本抛错（调用方 HandImporter 捕获为 parseError）', () => {
    expect(() => parseGGPokerHand('')).toThrow('Empty hand history text');
    expect(() => parseGGPokerHand('   \n  ')).toThrow('Empty hand history text');
  });
});

describe('parseGGPokerMultiple', () => {
  it('按 "Hand #" 切分并解析多手', () => {
    const hands = parseGGPokerMultiple(`${SIX_MAX}\n${BET_AND_FOLD}`);
    expect(hands).toHaveLength(2);
    expect(hands.map(h => h.handNumber)).toEqual(['123456789', '222']);
  });

  it('无法解析的分片被跳过（不中断整批）', () => {
    const broken = `
GGPoker Hand #HD-999: Hold'em No Limit ($1/$2) - 2024/05/01 10:00:00
Table 'Broken' 2-max Seat #1 is the button
Seat 1: X ($10)
*** HOLE CARDS ***
Dealt to X [Zz Zz]
`;
    const hands = parseGGPokerMultiple(`${broken}\n${BET_AND_FOLD}`);
    expect(hands.map(h => h.handNumber)).toEqual(['222']);
  });

  it('空文本 / 非 GG 文本返回空数组（不抛错）', () => {
    expect(parseGGPokerMultiple('')).toEqual([]);
    expect(parseGGPokerMultiple('no hands here')).toEqual([]);
  });
});

describe('detectFormat 识别 GG 变体写法', () => {
  it('GGPoker Hand # / Hand #HD- / "... - GGPoker" 均判为 ggpoker', () => {
    expect(detectFormat('GGPoker Hand #HD-1')).toBe('ggpoker');
    expect(detectFormat('Hand #HD-1')).toBe('ggpoker');
    expect(detectFormat('Poker Hand #123 - GGPoker')).toBe('ggpoker');
  });
});
