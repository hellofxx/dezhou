import { describe, it, expect } from 'vitest';
import type { Card, Board } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, DecisionNode } from './types';
import { computeCallAmount } from './store';

// P1-01 修复回归：computeCallAmount 在多步节点（turn/river）必须按 node 实际 board
// 重新分类 texture，而非沿用 scenario.boardTexture（flop 时刻缓存）。
// 修复前 texture 恒取 scenario.boardTexture，导致 turn/river 节点 callAmount 用错 sizing。
describe('computeCallAmount（P1-01 node 实际 board texture）', () => {
  function makeScenario(boardTexture: Scenario['boardTexture'], board?: Board): Scenario {
    const heroHand: [Card, Card] = [
      { suit: Suit.Hearts, rank: Rank.Ace },
      { suit: Suit.Hearts, rank: Rank.King },
    ];
    return {
      id: 's1',
      name: 'test',
      description: 'test',
      gameType: 'cash',
      stakes: { smallBlind: 0.5, bigBlind: 1 },
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 2,
      street: 'flop',
      board: board ?? {
        flop: [
          { suit: Suit.Hearts, rank: Rank.Ten },
          { suit: Suit.Clubs, rank: Rank.Five },
          { suit: Suit.Diamonds, rank: Rank.Two },
        ],
        turn: null,
        river: null,
      },
      potSize: 10,
      boardTexture,
      previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
      heroHand,
      difficulty: 'beginner',
    };
  }

  /** dry 结构牌面：K♠ 7♦ 2♣（三张不同花色、互不相连） */
  const dryBoard: Board = {
    flop: [
      { suit: Suit.Spades, rank: Rank.King },
      { suit: Suit.Diamonds, rank: Rank.Seven },
      { suit: Suit.Clubs, rank: Rank.Two },
    ],
    turn: null,
    river: null,
  };

  it('node.board 存在时按 node 实际 board 分类 texture（dry → 0.33）', () => {
    // scenario.boardTexture 缓存为 wet（0.66），但 node 实际 board 是 dry（0.33）
    const scenario = makeScenario('wet', dryBoard);
    const node: DecisionNode = {
      id: 'node-turn',
      street: 'turn',
      description: 'turn',
      board: dryBoard,
      potSize: 20,
      heroHand: scenario.heroHand,
      gtoStrategy: { fold: 0, call: 1, raise: 0 },
      previousActions: [{ position: Position.BTN, action: ActionType.Call, amount: 3.3 }],
    };
    // dry → sizingMultiplier 0.33 → callAmount = 20 * 0.33 = 6.6
    const callAmount = computeCallAmount(scenario, node, 20);
    expect(callAmount).toBe(6.6);
  });

  it('无 node 时回退 scenario.board 分类（与 scenario.boardTexture 不同则用实际分类）', () => {
    // scenario.boardTexture 缓存为 wet，但 scenario.board 实际是 dry → 用 dry 0.33
    const scenario = makeScenario('wet', dryBoard);
    const callAmount = computeCallAmount(scenario, undefined, 10);
    expect(callAmount).toBe(3.3);
  });

  it('preflop 仍按 raise 尺寸返回（语义不变）', () => {
    const preflopScenario: Scenario = {
      ...makeScenario(undefined),
      street: 'preflop',
      board: undefined,
      previousActions: [{ position: Position.CO, action: ActionType.Raise, amount: 2.5 }],
    };
    const callAmount = computeCallAmount(preflopScenario, undefined, 3);
    expect(callAmount).toBe(2.5);
  });
});
