/**
 * GTO store 策略查找与结果聚合测试（L1 · Node）
 *
 * 覆盖契约：
 *  - 无决策节点时的策略来源：翻前走 preflop-ranges 权威表 / 翻后按公共牌纹理估算 / 缺牌面兜底
 *  - computeResult（经 endSession / nextScenario 暴露）：accuracy、平均 EV、BB/100、worstSpots、除零防御
 *  - 计时口径：timeTaken（单题）与 totalTime（会话）
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { Board, Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import type { Decision } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, DecisionNode, GTODecision } from './types';
import { useGTOSimulatorStore } from './store';
import { getPreflopHandStrategy } from './utils/spotKey';
import { estimatePostflopStrategy, boardToFlat } from './utils/postflopStrategy';
import { classifyBoardTexture } from './utils/boardGenerator';

const FOLD: Decision = { action: ActionType.Fold };

const HERO_AA: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.Ace },
];

const PREFLOP_FOLDS = [
  { position: Position.UTG, action: ActionType.Fold },
  { position: Position.HJ, action: ActionType.Fold },
  { position: Position.CO, action: ActionType.Fold },
];

const DRY_FLOP: Board = {
  flop: [
    { suit: Suit.Spades, rank: Rank.King },
    { suit: Suit.Hearts, rank: Rank.Seven },
    { suit: Suit.Clubs, rank: Rank.Three },
  ],
  turn: null,
  river: null,
};

function makePreflopScenario(id: string, nodes?: DecisionNode[]): Scenario {
  return {
    id,
    name: `scenario-${id}`,
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position: Position.BTN,
    playerCount: 6,
    street: 'preflop',
    potSize: 1.5,
    previousActions: PREFLOP_FOLDS,
    heroHand: HERO_AA,
    difficulty: 'intermediate',
    decisionNodes: nodes,
  };
}

function makeNode(id: string): DecisionNode {
  return {
    id,
    street: 'preflop',
    description: `node-${id}`,
    potSize: 1.5,
    heroHand: HERO_AA,
    gtoStrategy: { fold: 1, call: 0, raise: 0 },
    previousActions: PREFLOP_FOLDS,
  };
}

function makeDecision(scenarioId: string, evLoss: number, isOptimal = evLoss === 0): GTODecision {
  return {
    scenarioId,
    userAction: FOLD,
    gtoStrategy: { fold: 1, call: 0, raise: 0 },
    evLoss,
    isOptimal,
    timeTaken: 100,
  };
}

const store = () => useGTOSimulatorStore.getState();

describe('gto-simulator store 策略查找分支', () => {
  beforeEach(() => {
    store().resetSession();
    useGTOSimulatorStore.setState({ exploitMode: false, selectedOpponent: null });
  });

  it('无决策节点时翻前走 preflop-ranges 权威表', () => {
    const scenario = makePreflopScenario('table');
    store().startSession([scenario]);

    store().submitDecision({ action: ActionType.Raise, amount: 2.5 });

    const fb = store().feedback!;
    expect(fb.gtoStrategy).toEqual(
      getPreflopHandStrategy(scenario.position, scenario.previousActions, scenario.heroHand),
    );
    expect(fb.gtoStrategy!.raise).toBeGreaterThan(0);
  });

  it('无决策节点时翻后按公共牌纹理估算策略', () => {
    const scenario: Scenario = {
      ...makePreflopScenario('postflop'),
      street: 'flop',
      board: DRY_FLOP,
      boardTexture: undefined,
      potSize: 6,
    };
    store().startSession([scenario]);

    store().submitDecision({ action: ActionType.Call, amount: 2 });

    const expected = estimatePostflopStrategy(
      scenario.heroHand,
      DRY_FLOP,
      classifyBoardTexture(boardToFlat(DRY_FLOP)),
      'flop',
    );
    expect(store().feedback!.gtoStrategy).toEqual(expected);
    expect(store().session!.decisions[0]!.gtoStrategy).toEqual(expected);
  });

  it('翻后场景缺少公共牌时回退默认策略而不抛错', () => {
    const scenario: Scenario = {
      ...makePreflopScenario('noboard'),
      street: 'flop',
      board: undefined,
    };
    store().startSession([scenario]);

    store().submitDecision(FOLD);

    expect(store().feedback!.gtoStrategy).toEqual({
      fold: 0.4,
      call: 0.3,
      raise: 0.3,
      raiseAmount: 2.5,
    });
  });
});

describe('gto-simulator store 结果聚合', () => {
  beforeEach(() => {
    store().resetSession();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('accuracy / 平均 EV / BB100 按决策数计算', () => {
    store().startSession([makePreflopScenario('s1'), makePreflopScenario('s2')]);
    useGTOSimulatorStore.setState({
      session: {
        ...store().session!,
        decisions: [makeDecision('s1', 0, true), makeDecision('s2', 2, false)],
      },
    });

    store().endSession();

    const result = store().lastResult!;
    expect(result.sessionId.startsWith('gto-')).toBe(true);
    expect(result.optimalDecisions).toBe(1);
    expect(result.averageEVLoss).toBe(1);
    expect(result.evLossBB100).toBe(100);
    expect(result.accuracy).toBe(0.5);
  });

  it('worstSpots 按 EV 损失降序取前 5，并过滤找不到场景的决策', () => {
    store().startSession([makePreflopScenario('s1'), makePreflopScenario('s2')]);
    useGTOSimulatorStore.setState({
      session: {
        ...store().session!,
        decisions: [
          makeDecision('missing', 9, false),
          makeDecision('s1', 3, false),
          makeDecision('s2', 1, false),
        ],
      },
    });

    store().endSession();

    const worst = store().lastResult!.worstSpots;
    expect(worst.map((spot) => spot.scenario.id)).toEqual(['s1', 's2']);
    expect(worst.map((spot) => spot.evLoss)).toEqual([3, 1]);
  });

  it('无决策时结算不产生 NaN（除零防御）', () => {
    store().startSession([makePreflopScenario('empty')]);

    store().endSession();

    const result = store().lastResult!;
    expect(result.scenarios).toBe(0);
    expect(result.averageEVLoss).toBe(0);
    expect(result.evLossBB100).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(Number.isNaN(result.averageEVLoss)).toBe(false);
  });

  it('timeTaken 取每题耗时，totalTime 取会话总耗时', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    store().startSession([makePreflopScenario('timed', [makeNode('n0')])]);

    vi.advanceTimersByTime(1500);
    store().submitDecision(FOLD);
    expect(store().session!.decisions[0]!.timeTaken).toBe(1500);

    vi.advanceTimersByTime(2500);
    store().endSession();
    expect(store().lastResult!.totalTime).toBe(4000);
  });
});
