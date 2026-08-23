import { describe, it, expect } from 'vitest';
import { calculateHeroStats } from './handStats';
import type { HandHistory, Player } from '../types';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import type { PlayerAction } from '@/shared/types/action';
import { Suit, Rank } from '@/shared/types/poker';

// ─── 测试构造工具 ──────────────────────────────────────────

function makePlayer(idx: number, name: string, position: Position): Player {
  return { id: idx, name, position, seatNumber: idx + 1, stack: 200 };
}

function makeHand(
  heroIdx: number,
  players: Player[],
  preflop: PlayerAction[],
  opts: {
    flopActions?: PlayerAction[];
    turnActions?: PlayerAction[];
    riverActions?: PlayerAction[];
    winnerId?: number;
  } = {},
): HandHistory {
  const flopCards = (opts.flopActions ?? opts.turnActions ?? opts.riverActions) ? [{ suit: Suit.Hearts, rank: Rank.King }] : [];
  return {
    id: `test-${heroIdx}-${players.length}-${preflop.length}`,
    site: 'pokerstars',
    handNumber: '1',
    timestamp: 0,
    gameType: "No Limit Hold'em",
    stakes: { smallBlind: 1, bigBlind: 2 },
    players,
    board: flopCards,
    streets: {
      preflop,
      flop: { cards: flopCards, actions: opts.flopActions ?? [] },
      turn: { cards: [], actions: opts.turnActions ?? [] },
      river: { cards: [], actions: opts.riverActions ?? [] },
    },
    pot: 10,
    winner: opts.winnerId !== undefined ? { playerId: opts.winnerId, amount: 10 } : undefined,
    annotations: {},
  };
}

const HERO = 'Hero';

// ─── VPIP（盲注判定修复）───────────────────────────────────

describe('VPIP 盲注判定', () => {
  it('SB 补齐跟注（limp）计入 VPIP（修复前 amount=SB 被误判 forced blind）', () => {
    // 6-max：hero 是 seat5 SB。UTG/HJ/CO/BTN 全弃，SB posts $1 + calls $1 补齐，BB check
    const players = [
      makePlayer(0, 'UTG', Position.UTG),
      makePlayer(1, 'HJ', Position.HJ),
      makePlayer(2, 'CO', Position.CO),
      makePlayer(3, 'BTN', Position.BTN),
      makePlayer(4, HERO, Position.SB),
      makePlayer(5, 'BB', Position.BB),
    ];
    const preflop: PlayerAction[] = [
      { type: ActionType.Fold, playerIndex: 0 },
      { type: ActionType.Fold, playerIndex: 1 },
      { type: ActionType.Fold, playerIndex: 2 },
      { type: ActionType.Fold, playerIndex: 3 },
      { type: ActionType.Call, amount: 1, playerIndex: 4 }, // posts SB
      { type: ActionType.Call, amount: 1, playerIndex: 4 }, // 补齐 limp
      { type: ActionType.Check, playerIndex: 5 },
    ];
    const stats = calculateHeroStats([makeHand(4, players, preflop)], HERO);
    expect(stats.vpip).toBe(100);
  });

  it('UTG open-limp 计入 VPIP（修复前 amount=BB 被误判 forced blind）', () => {
    const players = [
      makePlayer(0, HERO, Position.UTG),
      makePlayer(1, 'HJ', Position.HJ),
      makePlayer(2, 'CO', Position.CO),
      makePlayer(3, 'BTN', Position.BTN),
      makePlayer(4, 'SB', Position.SB),
      makePlayer(5, 'BB', Position.BB),
    ];
    const preflop: PlayerAction[] = [
      { type: ActionType.Call, amount: 2, playerIndex: 0 }, // open limp $2（=BB）
      { type: ActionType.Fold, playerIndex: 1 },
      { type: ActionType.Fold, playerIndex: 2 },
      { type: ActionType.Fold, playerIndex: 3 },
      { type: ActionType.Fold, playerIndex: 4 },
      { type: ActionType.Check, playerIndex: 5 },
    ];
    const stats = calculateHeroStats([makeHand(0, players, preflop)], HERO);
    expect(stats.vpip).toBe(100);
  });

  it('SB 仅 post 盲注后无人加注直接结束（BB 赢）不计 VPIP', () => {
    const players = [
      makePlayer(0, 'UTG', Position.UTG),
      makePlayer(1, 'HJ', Position.HJ),
      makePlayer(2, 'CO', Position.CO),
      makePlayer(3, 'BTN', Position.BTN),
      makePlayer(4, HERO, Position.SB),
      makePlayer(5, 'BB', Position.BB),
    ];
    const preflop: PlayerAction[] = [
      { type: ActionType.Fold, playerIndex: 0 },
      { type: ActionType.Fold, playerIndex: 1 },
      { type: ActionType.Fold, playerIndex: 2 },
      { type: ActionType.Fold, playerIndex: 3 },
      { type: ActionType.Fold, playerIndex: 4 }, // SB 弃牌
    ];
    const stats = calculateHeroStats([makeHand(4, players, preflop)], HERO);
    expect(stats.vpip).toBe(0);
  });
});

// ─── WTSD（摊牌判定与分母修复）────────────────────────────

describe('WTSD 摊牌判定', () => {
  const heroIdx = 0;
  const oppIdx = 1;
  const players = [makePlayer(0, HERO, Position.BTN), makePlayer(1, 'Villain', Position.BB)];

  it('hero 下注后对手全弃直接收池不算摊牌（修复前 winner 存在即误判 WTSD）', () => {
    // hero flop c-bet 收池：对手 flop 弃牌，hero collected pot（winner=hero）
    const hand = makeHand(heroIdx, players, [
      { type: ActionType.Call, amount: 1, playerIndex: 0 },
      { type: ActionType.Check, playerIndex: 1 },
    ], {
      flopActions: [
        { type: ActionType.Raise, amount: 4, playerIndex: 0 }, // hero bets
        { type: ActionType.Fold, playerIndex: 1 }, // 对手弃牌
      ],
      winnerId: heroIdx,
    });
    const stats = calculateHeroStats([hand], HERO);
    expect(stats.wtsd).toBe(0);
  });

  it('对手未弃牌到达河牌后摊牌计入 WTSD，分母为见翻牌手数（不含翻前弃牌局）', () => {
    // 手牌 A：hero 到摊牌（对手未弃牌）
    const showdownHand = makeHand(heroIdx, players, [
      { type: ActionType.Call, amount: 1, playerIndex: 0 },
      { type: ActionType.Check, playerIndex: 1 },
    ], {
      flopActions: [
        { type: ActionType.Check, playerIndex: 1 },
        { type: ActionType.Check, playerIndex: 0 },
      ],
      riverActions: [
        { type: ActionType.Check, playerIndex: 1 },
        { type: ActionType.Check, playerIndex: 0 },
      ],
      winnerId: oppIdx,
    });
    // 手牌 B：hero flop c-bet 收池（见翻牌但非摊牌）
    const pickupHand = makeHand(heroIdx, players, [
      { type: ActionType.Call, amount: 1, playerIndex: 0 },
      { type: ActionType.Check, playerIndex: 1 },
    ], {
      flopActions: [
        { type: ActionType.Raise, amount: 4, playerIndex: 0 },
        { type: ActionType.Fold, playerIndex: 1 },
      ],
      winnerId: heroIdx,
    });
    // 手牌 C：hero 翻前弃牌（不见翻牌，不计分母）
    const foldHand = makeHand(heroIdx, players, [
      { type: ActionType.Call, amount: 1, playerIndex: 0 },
      { type: ActionType.Raise, amount: 6, playerIndex: 1 },
      { type: ActionType.Fold, playerIndex: 0 },
    ]);
    const stats = calculateHeroStats([showdownHand, pickupHand, foldHand], HERO);
    // 分母 = 见翻牌 2 手（A、B），摊牌 1 手（A）→ 50%（修复前分母为全部 3 手 → 33%）
    expect(stats.wtsd).toBe(50);
  });
});

// ─── 3-Bet（分母口径修复）─────────────────────────────────

describe('3-Bet 分母', () => {
  function threeBetPlayers(): Player[] {
    return [
      makePlayer(0, 'UTG', Position.UTG),
      makePlayer(1, HERO, Position.UTG1),
      makePlayer(2, 'CO', Position.CO),
      makePlayer(3, 'BTN', Position.BTN),
      makePlayer(4, 'SB', Position.SB),
      makePlayer(5, 'BB', Position.BB),
    ];
  }

  it('面对加注弃牌计入分母（修复前 fold 不算 facedRaise，3bet% 虚高）', () => {
    // 手牌 A：hero 面对加注弃牌（分母 +1）
    const foldHand = makeHand(1, threeBetPlayers(), [
      { type: ActionType.Raise, amount: 6, playerIndex: 0 }, // UTG open raise
      { type: ActionType.Fold, playerIndex: 1 }, // hero fold 面对加注
      { type: ActionType.Fold, playerIndex: 2 },
      { type: ActionType.Fold, playerIndex: 3 },
      { type: ActionType.Fold, playerIndex: 4 },
      { type: ActionType.Fold, playerIndex: 5 },
    ], { winnerId: 0 });
    // 手牌 B：hero 面对加注 3-bet（分子 +1）
    const threeBetHand = makeHand(1, threeBetPlayers(), [
      { type: ActionType.Raise, amount: 6, playerIndex: 0 },
      { type: ActionType.Raise, amount: 18, playerIndex: 1 }, // hero 3-bet
      { type: ActionType.Fold, playerIndex: 0 },
    ], { winnerId: 1 });
    // 手牌 C：hero 无加注直接 open raise（既非 3bet 也不该入分母）
    const openHand = makeHand(1, threeBetPlayers(), [
      { type: ActionType.Call, amount: 2, playerIndex: 0 }, // UTG limp（非加注）
      { type: ActionType.Raise, amount: 8, playerIndex: 1 }, // hero iso raise
      { type: ActionType.Fold, playerIndex: 0 },
    ], { winnerId: 1 });

    const stats = calculateHeroStats([foldHand, threeBetHand, openHand], HERO);
    // 分母 = 2（A、B），分子 = 1（B）→ 50%（修复前分母 = 1 → 100%）
    expect(stats.threeBetPercent).toBe(50);
  });
});
