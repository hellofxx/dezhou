/**
 * useScenarioEngine 测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - generateScenarios：按传入 / store 配置批量生成，末题替换为「最简场景」（getEasyGTOScenario）
 *  - getCurrentScenario / getProgress：会话完成态与空会话的边界返回
 *  - store 代理方法（submitDecision / nextScenario）与 session 暴露
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import { useGTOSimulatorStore } from '../store';
import { useScenarioEngine } from './useScenarioEngine';

const store = () => useGTOSimulatorStore.getState();

function resetStore(): void {
  store().resetSession();
  useGTOSimulatorStore.setState({
    config: {
      gameType: 'cash',
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard',
      difficulty: 'intermediate',
      scenarioCount: 3,
    },
    exploitMode: false,
    selectedOpponent: null,
  });
}

afterEach(() => {
  cleanup();
});

describe('useScenarioEngine 场景生成', () => {
  beforeEach(resetStore);

  it('按 store 配置生成，并把末题替换为最简场景（BTN 持 AA）', () => {
    const { result } = renderHook(() => useScenarioEngine());

    act(() => result.current.generateScenarios());

    const session = store().session!;
    expect(session.scenarios).toHaveLength(3);
    expect(session.currentIndex).toBe(0);
    expect(session.decisions).toEqual([]);
    expect(session.isComplete).toBe(false);

    const last = session.scenarios[2]!;
    expect(last.id.startsWith('scenario-easy-')).toBe(true);
    expect(last.position).toBe(Position.BTN);
    expect(last.heroHand.map((card) => card.rank)).toEqual([14, 14]);
    // 末题不参与随机生成：其余题保持生成的场景
    expect(session.scenarios.slice(0, 2).some((s) => s.id.startsWith('scenario-easy-'))).toBe(false);
  });

  it('传入局部配置时仅影响本次生成，不回写 store 配置', () => {
    const { result } = renderHook(() => useScenarioEngine());

    act(() => result.current.generateScenarios({ scenarioCount: 2 }));

    expect(store().session!.scenarios).toHaveLength(2);
    expect(store().config.scenarioCount).toBe(3);
    expect(result.current.config.scenarioCount).toBe(3);
  });

  it('scenarioCount 为 0 时不产生场景且不替换末题', () => {
    const { result } = renderHook(() => useScenarioEngine());

    act(() => result.current.generateScenarios({ scenarioCount: 0 }));

    expect(store().session!.scenarios).toEqual([]);
  });
});

describe('useScenarioEngine 会话读取与代理', () => {
  beforeEach(resetStore);

  it('无会话时 getCurrentScenario 为 null、getProgress 为零值', () => {
    const { result } = renderHook(() => useScenarioEngine());

    expect(result.current.session).toBeNull();
    expect(result.current.getCurrentScenario()).toBeNull();
    expect(result.current.getProgress()).toEqual({ current: 0, total: 0, percentage: 0 });
  });

  it('getProgress 随 currentIndex 推进（1/2 → 50%，2/2 → 100%）', () => {
    const { result } = renderHook(() => useScenarioEngine());
    act(() => result.current.generateScenarios({ scenarioCount: 2 }));

    expect(result.current.getProgress()).toEqual({ current: 1, total: 2, percentage: 50 });

    act(() => result.current.nextScenario());

    expect(result.current.session!.currentIndex).toBe(1);
    expect(result.current.getProgress()).toEqual({ current: 2, total: 2, percentage: 100 });
  });

  it('getCurrentScenario 跟随 currentIndex；会话完成后返回 null', () => {
    const { result } = renderHook(() => useScenarioEngine());
    act(() => result.current.generateScenarios({ scenarioCount: 2 }));

    const firstId = result.current.getCurrentScenario()!.id;
    expect(firstId).toBe(store().session!.scenarios[0]!.id);

    act(() => result.current.nextScenario());
    expect(result.current.getCurrentScenario()!.id).toBe(store().session!.scenarios[1]!.id);

    act(() => {
      useGTOSimulatorStore.setState({
        session: { ...store().session!, isComplete: true },
      });
    });
    expect(result.current.getCurrentScenario()).toBeNull();
  });

  it('submitDecision 代理到 store：写入决策并置反馈', () => {
    const { result } = renderHook(() => useScenarioEngine());
    act(() => result.current.generateScenarios({ scenarioCount: 1 }));

    act(() => result.current.submitDecision({ action: ActionType.Fold }));

    expect(store().session!.decisions).toHaveLength(1);
    expect(store().showFeedback).toBe(true);
    expect(store().feedback).not.toBeNull();
  });
});
