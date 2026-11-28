import { describe, expect, it } from 'vitest';
import { Position } from '@/shared/types/position';
import { ActionType } from '@/shared/types/action';
import { Rank, Suit } from '@/shared/types/poker';
import type { Board } from '@/shared/types/poker';
import type { Scenario } from '../types';
import { computeCallAmount, getLegalActionContext } from './legalActions';

const DRY_FLOP: Board = {
  flop: [
    { suit: Suit.Spades, rank: Rank.King },
    { suit: Suit.Diamonds, rank: Rank.Seven },
    { suit: Suit.Clubs, rank: Rank.Two },
  ],
  turn: null,
  river: null,
};

function scenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    id: 's1',
    name: 'test',
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    gameVariant: 'standard',
    street: 'preflop',
    potSize: 1.5,
    previousActions: [],
    heroHand: [
      { suit: Suit.Spades, rank: Rank.Ace },
      { suit: Suit.Hearts, rank: Rank.Ace },
    ],
    difficulty: 'intermediate',
    ...overrides,
  };
}

describe('computeCallAmount 翻前', () => {
  it('BB 面对 2.5BB open 只需再跟 1.5BB', () => {
    expect(computeCallAmount(scenario({
      position: Position.BB,
      previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
    }), undefined)).toBe(1.5);
  });

  it('SB 未面对加注时补足 0.5BB，BTN 无人加注时 limp 1BB', () => {
    expect(computeCallAmount(scenario({ position: Position.SB }), undefined)).toBe(0.5);
    expect(computeCallAmount(scenario(), undefined)).toBe(1);
  });

  it('hero 已 raise-to 2.5BB 面对 9BB 3-bet 需再跟 6.5BB', () => {
    expect(computeCallAmount(scenario({
      position: Position.CO,
      previousActions: [
        { position: Position.CO, action: ActionType.Raise, amount: 2.5 },
        { position: Position.BTN, action: ActionType.Raise, amount: 9 },
      ],
    }), undefined)).toBe(6.5);
  });

  it('翻前 All-In 与 raise 一样作为到注目标，BB 只需补足差额', () => {
    expect(computeCallAmount(scenario({
      position: Position.BB,
      previousActions: [{ position: Position.BTN, action: ActionType.AllIn, amount: 2.5 }],
    }), undefined)).toBe(1.5);
  });

  it('翻后 All-In 扣除 hero 本街已投入额', () => {
    expect(computeCallAmount(scenario({
      position: Position.CO,
      street: 'flop',
      previousActions: [
        { position: Position.CO, action: ActionType.Call, amount: 2, street: 'flop' },
        { position: Position.BTN, action: ActionType.AllIn, amount: 10, street: 'flop' },
      ],
    }), undefined)).toBe(8);
  });
});

describe('getLegalActionContext', () => {
  it('BB 无下注时可过牌且最小加注 2BB', () => {
    expect(getLegalActionContext(scenario({ position: Position.BB }), undefined, 1.5)).toEqual({
      callAmount: 0,
      canCheck: true,
      minRaiseTo: 2,
      maxRaiseTo: 100,
      canRaise: true,
    });
  });

  it('面对 open 时最小 3-bet 到 4BB', () => {
    const ctx = getLegalActionContext(scenario({
      position: Position.BB,
      previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
    }), undefined, 4);
    expect(ctx).toMatchObject({ callAmount: 1.5, canCheck: false, minRaiseTo: 4, canRaise: true });
  });

  it('面对 3-bet 时最小加注到 15.5BB', () => {
    const ctx = getLegalActionContext(scenario({
      position: Position.CO,
      previousActions: [
        { position: Position.CO, action: ActionType.Raise, amount: 2.5 },
        { position: Position.BTN, action: ActionType.Raise, amount: 9 },
      ],
    }), undefined, 11.5);
    expect(ctx).toMatchObject({ callAmount: 6.5, minRaiseTo: 15.5, canRaise: true });
  });

  it('面对 All-In 时跟注合法，但没有额外加注空间', () => {
    const ctx = getLegalActionContext(scenario({
      position: Position.BB,
      effectiveStack: 2.5,
      previousActions: [{ position: Position.BTN, action: ActionType.AllIn, amount: 2.5 }],
    }), undefined, 4);
    expect(ctx).toMatchObject({ callAmount: 1.5, canCheck: false, minRaiseTo: 4, canRaise: false });
  });

  it('翻后读取本街下注：跟注/最小加注一致，筹码不足时禁止加注', () => {
    const flop = scenario({
      street: 'flop',
      board: DRY_FLOP,
      effectiveStack: 5,
      potSize: 10,
      previousActions: [{ position: Position.CO, action: ActionType.Raise, amount: 3.3, street: 'flop' }],
    });
    expect(getLegalActionContext(flop, undefined, 10)).toEqual({
      callAmount: 3.3,
      canCheck: false,
      minRaiseTo: 6.6,
      maxRaiseTo: 5,
      canRaise: false,
    });
  });

  it('翻后本街无下注时可过牌，最小下注 2BB', () => {
    const flop = scenario({ street: 'flop', board: DRY_FLOP, potSize: 10 });
    expect(getLegalActionContext(flop, undefined, 10)).toMatchObject({
      callAmount: 0,
      canCheck: true,
      minRaiseTo: 2,
    });
  });

  it('翻后最小加注忽略翻前 raise，只按本街下注计算', () => {
    const flop = scenario({
      street: 'flop',
      board: DRY_FLOP,
      potSize: 10,
      previousActions: [
        { position: Position.BTN, action: ActionType.Raise, amount: 2.5, street: 'preflop' },
        { position: Position.CO, action: ActionType.Raise, amount: 2.1, street: 'flop' },
      ],
    });
    expect(getLegalActionContext(flop, undefined, 10).minRaiseTo).toBe(4.2);
  });
});