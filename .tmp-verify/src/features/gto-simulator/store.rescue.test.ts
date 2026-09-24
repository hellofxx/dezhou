import { describe, it, expect, beforeEach } from 'vitest';
import type { Card, Board } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, GTODecision } from './types';
import { useGTOSimulatorStore } from './store';

/** 构造一个可判分的 flop 场景（hero BTN raise，面对 c-bet 决策） */
function makeFlopScenario(id: string): Scenario {
  const heroHand: [Card, Card] = [
    { suit: Suit.Hearts, rank: Rank.Ace },
    { suit: Suit.Hearts, rank: Rank.King },
  ];
  const board: Board = {
    flop: [
      { suit: Suit.Hearts, rank: Rank.Ten },
      { suit: Suit.Clubs, rank: Rank.Five },
      { suit: Suit.Diamonds, rank: Rank.Two },
    ],
    turn: null,
    river: null,
  };
  return {
    id,
    name: 'flop-test',
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 2,
    street: 'flop',
    board,
    potSize: 10,
    boardTexture: 'dry',
    previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
    heroHand,
    difficulty: 'beginner',
    decisionNodes: [
      {
        id: `node-${id}`,
        street: 'flop',
        description: 'test node',
        board,
        potSize: 10,
        heroHand,
        gtoStrategy: { fold: 1, call: 0, raise: 0 },
        previousActions: [{ position: Position.BTN, action: ActionType.Raise, amount: 2.5 }],
      },
    ],
  };
}

function makeDecision(scenarioId: string, isOptimal: boolean): GTODecision {
  return {
    scenarioId,
    userAction: { action: isOptimal ? ActionType.Fold : ActionType.Call },
    gtoStrategy: { fold: 1, call: 0, raise: 0 },
    evLoss: isOptimal ? 0 : 3,
    isOptimal,
    timeTaken: 100,
  };
}

// P1-01 修复回归：nextScenario 触发 rescue 时，必须将 currentIndex 指向新增的 rescue 场景，
// 否则 submitDecision 取到旧场景、进度错乱、下一次 nextScenario 跳过救援场景。
describe('gto-simulator nextScenario rescue（P1-01 currentIndex）', () => {
  beforeEach(() => {
    useGTOSimulatorStore.getState().resetSession();
  });

  it('末题非最优 → rescue 追加场景后 currentIndex 指向新场景下标', () => {
    const store = useGTOSimulatorStore.getState();
    const scenarios = [makeFlopScenario('s1')];
    store.startSession(scenarios);

    // 注入一条非最优决策（模拟用户答错）
    useGTOSimulatorStore.setState({
      session: {
        ...useGTOSimulatorStore.getState().session!,
        decisions: [makeDecision('s1', false)],
      },
    });

    // nextScenario 触发 rescue（无更多场景 + 末题非最优 + 未用过 rescue）
    store.nextScenario();

    const after = useGTOSimulatorStore.getState();
    expect(after.rescueUsed).toBe(true);
    expect(after.session!.scenarios).toHaveLength(2);
    // P1 修复核心：currentIndex 指向新增 rescue 场景（下标 1 = 追加前长度）
    expect(after.session!.currentIndex).toBe(1);
    expect(after.session!.isComplete).toBe(false);
  });

  it('末题最优 → 不触发 rescue 直接完成', () => {
    const store = useGTOSimulatorStore.getState();
    const scenarios = [makeFlopScenario('s2')];
    store.startSession(scenarios);

    useGTOSimulatorStore.setState({
      session: {
        ...useGTOSimulatorStore.getState().session!,
        decisions: [makeDecision('s2', true)],
      },
    });

    store.nextScenario();

    const after = useGTOSimulatorStore.getState();
    expect(after.rescueUsed).toBe(false);
    expect(after.session!.isComplete).toBe(true);
    expect(after.lastResult).not.toBeNull();
  });
});
