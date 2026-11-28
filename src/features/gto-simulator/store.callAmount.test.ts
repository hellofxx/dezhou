import { describe, it, expect } from 'vitest';
import type { Card, Board } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, DecisionNode } from './types';
import { computeCallAmount, useGTOSimulatorStore } from './store';
import { calculateEVFromAction, estimateHeroEquity } from './utils/strategyCompare';

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
      previousActions: [{ position: Position.CO, action: ActionType.Raise, amount: 6.6, street: 'turn' }],
    };
    const callAmount = computeCallAmount(scenario, node);
    expect(callAmount).toBe(6.6);
  });

  it('无 node 时读取本街实际下注额', () => {
    const scenario = {
      ...makeScenario('wet', dryBoard),
      previousActions: [{ position: Position.CO, action: ActionType.Raise, amount: 3.3, street: 'flop' as const }],
    };
    const callAmount = computeCallAmount(scenario, undefined);
    expect(callAmount).toBe(3.3);
  });

  it('本街无下注时返回 0（可过牌），不再虚构 c-bet', () => {
    const scenario = makeScenario('wet', dryBoard);
    expect(computeCallAmount(scenario, undefined)).toBe(0);
  });

  it('BB 面对 2.5BB open 只需再跟 1.5BB', () => {
    const preflopScenario: Scenario = {
      ...makeScenario(undefined),
      position: Position.BB,
      street: 'preflop',
      board: undefined,
      previousActions: [{ position: Position.CO, action: ActionType.Raise, amount: 2.5 }],
    };
    expect(computeCallAmount(preflopScenario, undefined)).toBe(1.5);
  });

  it('SB 未面对加注时只需补足 0.5BB', () => {
    const preflopScenario: Scenario = {
      ...makeScenario(undefined),
      position: Position.SB,
      street: 'preflop',
      board: undefined,
      previousActions: [],
    };
    expect(computeCallAmount(preflopScenario, undefined)).toBe(0.5);
  });

  it('hero 已 raise-to 2.5BB，面对 9BB 3-bet 需再跟 6.5BB', () => {
    const preflopScenario: Scenario = {
      ...makeScenario(undefined),
      position: Position.CO,
      street: 'preflop',
      board: undefined,
      previousActions: [
        { position: Position.CO, action: ActionType.Raise, amount: 2.5 },
        { position: Position.BTN, action: ActionType.Raise, amount: 9 },
      ],
    };
    expect(computeCallAmount(preflopScenario, undefined)).toBe(6.5);
  });

  it('store 用 BB 实际已投入 1BB 转换 raise-to EV', () => {
    const scenario: Scenario = {
      ...makeScenario(undefined),
      position: Position.BB,
      street: 'preflop',
      board: undefined,
      potSize: 4,
      previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
      decisionNodes: [{
        id: 'bb-raise',
        street: 'preflop',
        description: 'BB raise-to 4',
        potSize: 4,
        heroHand: makeScenario(undefined).heroHand,
        gtoStrategy: { fold: 0, call: 0, raise: 1, raiseAmount: 4 },
        previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
      }],
    };
    const store = useGTOSimulatorStore.getState();
    store.resetSession();
    useGTOSimulatorStore.setState({ exploitMode: false, selectedOpponent: null });
    store.startSession([scenario]);
    store.submitDecision({ action: ActionType.Raise, amount: 4 });

    const equity = estimateHeroEquity(scenario.heroHand, undefined, 'preflop');
    expect(useGTOSimulatorStore.getState().feedback!.userEV).toBeCloseTo(
      calculateEVFromAction('raise', equity, 4, 1.5, 3),
      10
    );
  });
});
