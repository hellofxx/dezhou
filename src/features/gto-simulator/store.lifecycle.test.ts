/**
 * GTO store 配置 / 会话启动与答题测试（L1 · Node）
 *
 * 覆盖契约：
 *  - 配置与模式（exploit / 对手）的局部合并语义
 *  - startSession 重置全部临时状态
 *  - submitDecision 的守卫分支（无会话 / 会话已完成）与判分来源（节点策略 / exploit 调整）
 *
 * 配套：store.flow.test.ts（多步与场景流转）、store.result.test.ts（策略查找与结果聚合）、
 * store.rescue.test.ts（末题救援）、store.callAmount.test.ts（callAmount 口径）。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import type { Decision } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import type { Scenario, DecisionNode, HandStrategy } from './types';
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

/** 构造 BTN 翻前 open 场景；nodes 缺省时不生成决策节点（走数据表查找分支） */
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
    spr: 66.7,
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

const store = () => useGTOSimulatorStore.getState();

describe('gto-simulator store 配置与模式', () => {
  beforeEach(() => {
    store().resetSession();
    useGTOSimulatorStore.setState({
      exploitMode: false,
      selectedOpponent: null,
      config: {
        gameType: 'cash',
        effectiveStack: 100,
        position: Position.BTN,
        playerCount: 6,
        gameVariant: 'standard',
        difficulty: 'intermediate',
        scenarioCount: 20,
      },
    });
  });

  it('setConfig 只覆盖传入字段，其余配置保持', () => {
    store().setConfig({ difficulty: 'advanced', scenarioCount: 30 });
    expect(store().config.difficulty).toBe('advanced');
    expect(store().config.scenarioCount).toBe(30);
    expect(store().config.gameType).toBe('cash');
    expect(store().config.position).toBe(Position.BTN);
  });

  it('setExploitMode / setSelectedOpponent 写入并可复位', () => {
    store().setExploitMode(true);
    store().setSelectedOpponent('nit');
    expect(store().exploitMode).toBe(true);
    expect(store().selectedOpponent).toBe('nit');

    store().setExploitMode(false);
    store().setSelectedOpponent(null);
    expect(store().exploitMode).toBe(false);
    expect(store().selectedOpponent).toBeNull();
  });
});

describe('gto-simulator store 会话启动与答题', () => {
  beforeEach(() => {
    store().resetSession();
    useGTOSimulatorStore.setState({ exploitMode: false, selectedOpponent: null });
  });

  it('startSession 重置会话内所有临时状态', () => {
    useGTOSimulatorStore.setState({
      feedback: {
        isOptimal: true,
        evLoss: 0,
        explanation: 'x',
        userEV: 0,
        optimalEV: 0,
        heroEquity: 0.5,
        gtoStrategy: null,
      },
      showFeedback: true,
      currentDecision: FOLD,
      currentNodeIndex: 2,
      rescueUsed: true,
    });

    store().startSession([makePreflopScenario('a')]);

    const s = store();
    expect(s.session!.currentIndex).toBe(0);
    expect(s.session!.decisions).toEqual([]);
    expect(s.session!.isComplete).toBe(false);
    expect(s.feedback).toBeNull();
    expect(s.showFeedback).toBe(false);
    expect(s.currentDecision).toBeNull();
    expect(s.currentNodeIndex).toBe(0);
    expect(s.stepFeedbacks).toEqual([]);
    expect(s.rescueUsed).toBe(false);
  });

  it('无会话时 submitDecision 不产生反馈', () => {
    store().submitDecision(FOLD);
    expect(store().feedback).toBeNull();
    expect(store().showFeedback).toBe(false);
  });

  it('会话已完成时 submitDecision 不写入决策', () => {
    store().startSession([makePreflopScenario('done')]);
    useGTOSimulatorStore.setState({
      session: { ...store().session!, isComplete: true },
    });

    store().submitDecision(FOLD);

    expect(store().session!.decisions).toEqual([]);
    expect(store().feedback).toBeNull();
  });

  it('单步场景 submitDecision：写入决策、反馈与步骤反馈', () => {
    const node = makeNode('n0', { fold: 1, call: 0, raise: 0 });
    store().startSession([makePreflopScenario('single', [node])]);

    store().submitDecision(FOLD);

    const s = store();
    expect(s.showFeedback).toBe(true);
    expect(s.currentDecision).toEqual(FOLD);
    expect(s.stepFeedbacks).toHaveLength(1);
    const decision = s.session!.decisions[0]!;
    expect(decision.scenarioId).toBe('single');
    expect(decision.userAction).toEqual(FOLD);
    expect(decision.isOptimal).toBe(true);
    expect(decision.gtoStrategy).toEqual(node.gtoStrategy);
    expect(s.feedback!.gtoStrategy).toEqual(node.gtoStrategy);
  });

  it('节点 raise 策略 + 用户 fold → 判为次优且 evLoss > 0', () => {
    const node = makeNode('n0', { fold: 0, call: 0, raise: 1, raiseAmount: 2.5 });
    store().startSession([makePreflopScenario('suboptimal', [node])]);

    store().submitDecision(FOLD);

    const fb = store().feedback!;
    expect(fb.isOptimal).toBe(false);
    expect(fb.evLoss).toBeGreaterThan(0.5);
    expect(fb.userEV).toBe(0);
    expect(fb.optimalEV).toBeGreaterThan(0);
    expect(store().session!.decisions[0]!.isOptimal).toBe(false);
  });

  it('exploit 模式：按对手画像调整策略并用调整后策略判分', () => {
    const node = makeNode('n0', { fold: 0, call: 0.4, raise: 0.6, raiseAmount: 2.5 });
    store().startSession([makePreflopScenario('exploit', [node])]);
    useGTOSimulatorStore.setState({ exploitMode: true, selectedOpponent: 'nit' });

    store().submitDecision(FOLD);

    const fb = store().feedback!;
    // Nit：raise +0.15 / fold -0.10 / call 归一化
    expect(fb.exploitStrategy).toEqual({ fold: 0, call: 0.25, raise: 0.75, raiseAmount: 2.5 });
    expect(fb.gtoStrategy).toBe(fb.exploitStrategy);
    expect(store().session!.decisions[0]!.gtoStrategy).toEqual(fb.exploitStrategy);
  });

  it('setCurrentDecision / setShowFeedback 可独立控制反馈展示', () => {
    store().setCurrentDecision(FOLD);
    store().setShowFeedback(true);
    expect(store().currentDecision).toEqual(FOLD);
    expect(store().showFeedback).toBe(true);

    store().setCurrentDecision(null);
    store().setShowFeedback(false);
    expect(store().currentDecision).toBeNull();
    expect(store().showFeedback).toBe(false);
  });
});
