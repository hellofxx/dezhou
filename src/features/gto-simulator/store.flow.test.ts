/**
 * GTO store 多步流转 / 结束与重置测试（L1 · Node）
 *
 * 覆盖契约：
 *  - 多步场景 currentNodeIndex 决定策略与流转（continueNext 前进 / 末节点转场景）
 *  - nextScenario 推进索引并清空节点级状态
 *  - endSession 立即结算；resetSession 清空会话、结果与救援标志
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import type { Decision } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, DecisionNode, HandStrategy, GTODecision } from './types';
import { useGTOSimulatorStore } from './store';

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

function makeNode(id: string, gtoStrategy: HandStrategy): DecisionNode {
  return {
    id,
    street: 'preflop',
    description: `node-${id}`,
    potSize: 1.5,
    heroHand: HERO_AA,
    gtoStrategy,
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

const FOLD_OPTIMAL = { fold: 1, call: 0, raise: 0 } as HandStrategy;
const RAISE_OPTIMAL = { fold: 0, call: 0, raise: 1, raiseAmount: 3 } as HandStrategy;

const store = () => useGTOSimulatorStore.getState();

describe('gto-simulator store 多步与场景流转', () => {
  beforeEach(() => {
    store().resetSession();
    useGTOSimulatorStore.setState({ exploitMode: false, selectedOpponent: null });
  });

  it('多步场景：currentNodeIndex 决定使用哪个节点的策略', () => {
    store().startSession([
      makePreflopScenario('multi', [makeNode('n0', FOLD_OPTIMAL), makeNode('n1', RAISE_OPTIMAL)]),
    ]);

    // 首个节点：fold 为最优
    store().submitDecision(FOLD);
    expect(store().feedback!.isOptimal).toBe(true);

    store().continueNext();
    expect(store().currentNodeIndex).toBe(1);
    expect(store().feedback).toBeNull();
    expect(store().showFeedback).toBe(false);
    expect(store().currentDecision).toBeNull();

    // 末节点：fold 相对 raise 策略为次优
    store().submitDecision(FOLD);
    expect(store().feedback!.isOptimal).toBe(false);
  });

  it('continueNext 在末节点切到下一场景并重置节点索引', () => {
    store().startSession([
      makePreflopScenario('first', [makeNode('n0', FOLD_OPTIMAL)]),
      makePreflopScenario('second', [makeNode('n0', FOLD_OPTIMAL)]),
    ]);

    store().submitDecision(FOLD);
    store().continueNext();

    const s = store();
    expect(s.session!.currentIndex).toBe(1);
    expect(s.session!.decisions).toHaveLength(1);
    expect(s.currentNodeIndex).toBe(0);
    expect(s.stepFeedbacks).toEqual([]);
    expect(s.feedback).toBeNull();
  });

  it('多步会话 continueNext 到末节点后转 nextScenario 并完成会话', () => {
    store().startSession([
      makePreflopScenario('only', [makeNode('n0', FOLD_OPTIMAL), makeNode('n1', FOLD_OPTIMAL)]),
    ]);

    store().submitDecision(FOLD);
    store().continueNext(); // → 节点 1
    store().submitDecision(FOLD);
    store().continueNext(); // → 末节点且末场景：转 nextScenario

    const s = store();
    expect(s.session!.decisions).toHaveLength(2);
    // 两次均最优 → 不触发 rescue，直接完成
    expect(s.session!.isComplete).toBe(true);
    expect(s.lastResult).not.toBeNull();
  });

  it('nextScenario 推进索引并清空节点级状态', () => {
    store().startSession([
      makePreflopScenario('a', [makeNode('n0', FOLD_OPTIMAL)]),
      makePreflopScenario('b', [makeNode('n0', FOLD_OPTIMAL)]),
    ]);

    store().nextScenario();

    const s = store();
    expect(s.session!.currentIndex).toBe(1);
    expect(s.session!.isComplete).toBe(false);
    expect(s.currentNodeIndex).toBe(0);
    expect(s.showFeedback).toBe(false);
  });
});

describe('gto-simulator store 结束与重置', () => {
  beforeEach(() => {
    store().resetSession();
  });

  it('endSession 立即结算会话并保留场景列表', () => {
    store().startSession([makePreflopScenario('x'), makePreflopScenario('y')]);
    useGTOSimulatorStore.setState({
      session: {
        ...store().session!,
        decisions: [makeDecision('x', 0, true), makeDecision('y', 2, false)],
      },
    });

    store().endSession();

    const s = store();
    expect(s.session!.isComplete).toBe(true);
    expect(s.session!.scenarios).toHaveLength(2);
    expect(s.lastResult!.scenarios).toBe(2);
    expect(s.lastResult!.accuracy).toBe(0.5);
  });

  it('resetSession 清空会话、结果与救援标志', () => {
    store().startSession([makePreflopScenario('z')]);
    useGTOSimulatorStore.setState({ rescueUsed: true });
    store().endSession();

    store().resetSession();

    const s = store();
    expect(s.session).toBeNull();
    expect(s.lastResult).toBeNull();
    expect(s.rescueUsed).toBe(false);
    expect(s.feedback).toBeNull();
    expect(s.showFeedback).toBe(false);
    expect(s.stepFeedbacks).toEqual([]);
    expect(s.currentNodeIndex).toBe(0);
  });
});
