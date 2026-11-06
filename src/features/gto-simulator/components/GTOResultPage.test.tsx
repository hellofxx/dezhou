/**
 * GTOResultPage（训练结果页）测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 无结果时的空态与返回首页跳转
 *  - 结果摘要：正确率 / 四项统计 / EV 损失率（BB/100）
 *  - worstSpots 列表（含 EV 损失数值）
 *  - 策略矩阵标题：会话 preflop spotKey 优先，无 spot 数据时展示占位提示
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import type { Card } from '@/shared/types/poker';
import { Suit, Rank } from '@/shared/types/poker';
import { ActionType } from '@/shared/types/action';
import { Position } from '@/shared/types/position';
import { useGTOSimulatorStore } from '../store';
import type { GTOResult, Scenario, GTOSession } from '../types';
import GTOResultPage from './GTOResultPage';

afterEach(() => cleanup());

const store = () => useGTOSimulatorStore.getState();

const HERO_HAND: [Card, Card] = [
  { suit: Suit.Hearts, rank: Rank.Ace },
  { suit: Suit.Diamonds, rank: Rank.Ace },
];

function makeScenario(id: string, position: Position): Scenario {
  return {
    id,
    name: `spot-${id}`,
    description: 'test',
    gameType: 'cash',
    stakes: { smallBlind: 0.5, bigBlind: 1 },
    effectiveStack: 100,
    position,
    playerCount: 6,
    street: 'preflop',
    potSize: 1.5,
    previousActions: [
      { position: Position.UTG, action: ActionType.Fold },
      { position: Position.HJ, action: ActionType.Fold },
    ],
    heroHand: HERO_HAND,
    difficulty: 'intermediate',
  };
}

const RESULT: GTOResult = {
  sessionId: 'gto-42',
  scenarios: 20,
  optimalDecisions: 15,
  averageEVLoss: 0.62,
  evLossBB100: 12.345,
  worstSpots: [],
  accuracy: 0.75,
  totalTime: 60000,
};

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderResult() {
  return render(
    <MemoryRouter initialEntries={['/gto-simulator/result/gto-42']}>
      <GTOResultPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** 按标签定位统计卡数值（结果摘要卡：值在前、标签在后） */
function statValue(label: string): string | undefined {
  return screen.getByText(label).parentElement?.querySelector('.font-numeric')?.textContent ?? undefined;
}

function resetStore(): void {
  useGTOSimulatorStore.setState({
    config: {
      gameType: 'cash',
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard',
      difficulty: 'intermediate',
      scenarioCount: 20,
    },
    session: null,
    lastResult: null,
  });
}

beforeEach(resetStore);

describe('GTOResultPage 空态', () => {
  it('无 lastResult 时展示无数据提示，返回按钮跳首页', () => {
    renderResult();

    expect(screen.getByText('没有结果数据')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '返回主页' }));
    expect(screen.getByTestId('location').textContent).toBe('/gto-simulator');
  });
});

describe('GTOResultPage 结果摘要', () => {
  it('展示正确率、统计数值、EV 损失率与矩阵标题', () => {
    useGTOSimulatorStore.setState({ lastResult: RESULT });
    const { container } = renderResult();

    expect(screen.getByText('训练完成！')).toBeTruthy();
    expect(screen.getByText('20 个决策 · BTN · 100BB')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    // 四项统计：总决策数 / 最优 / 非最优 / 平均用时（60s / 20 题 = 3s）
    expect(statValue('总决策数')).toBe('20');
    expect(statValue('最优决策')).toBe('15');
    expect(statValue('非最优')).toBe('5');
    expect(statValue('平均用时')).toBe('3s');
    // EV 损失率保留一位小数
    expect(screen.getByText('12.3 BB/100')).toBeTruthy();
    // 无 worstSpots 时不渲染改进建议卡
    expect(screen.queryByText('最需要改进的 Spots')).toBeNull();
    // 矩阵跟随会话 spot（无会话时回落 config 位置）
    expect(screen.getByText('BTN GTO 策略矩阵 (btn_open)')).toBeTruthy();
    expect(container.querySelectorAll('[title]')).toHaveLength(169);
  });

  it('「再练一次」跳回模块首页', () => {
    useGTOSimulatorStore.setState({ lastResult: RESULT });
    renderResult();

    fireEvent.click(screen.getByRole('button', { name: '再练一次' }));

    expect(screen.getByTestId('location').textContent).toBe('/gto-simulator');
  });

  it('worstSpots 展示场景名与 EV 损失', () => {
    const spot = makeScenario('worst', Position.CO);
    useGTOSimulatorStore.setState({
      lastResult: { ...RESULT, worstSpots: [{ scenario: spot, evLoss: 3 }] },
    });
    renderResult();

    expect(screen.getByText('最需要改进的 Spots')).toBeTruthy();
    expect(screen.getByText('spot-worst')).toBeTruthy();
    expect(screen.getByText('-3.00 BB')).toBeTruthy();
  });

  it('矩阵标题取会话中出现最多的 preflop spotKey', () => {
    const session: GTOSession = {
      scenarios: [makeScenario('a', Position.CO), makeScenario('b', Position.CO)],
      currentIndex: 1,
      decisions: [],
      isComplete: true,
      startTime: 0,
    };
    useGTOSimulatorStore.setState({ lastResult: RESULT, session });
    renderResult();

    // 标题位置取 config.position，spot 取会话实际 spot
    expect(screen.getByText('BTN GTO 策略矩阵 (co_open)')).toBeTruthy();
  });

  it('spotKey 无对应数据时展示占位提示而不渲染矩阵', () => {
    useGTOSimulatorStore.setState({
      lastResult: RESULT,
      config: { ...store().config, position: Position.BB },
    });
    const { container } = renderResult();

    // bb_open 不在 preflop 表中 → resolveSpotKey 返回 null
    expect(screen.getByText('BB GTO 策略矩阵')).toBeTruthy();
    expect(screen.getByText('该 spot 无 GTO 数据')).toBeTruthy();
    expect(container.querySelectorAll('[title]')).toHaveLength(0);
  });
});

describe('GTOResultPage 标题层级', () => {
  it('整页恰好一个 h1（纸条标题区），矩阵小节降为 h2', () => {
    useGTOSimulatorStore.setState({ lastResult: RESULT });
    const { container } = renderResult();

    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')?.textContent).toBe('训练完成！');
    expect(container.querySelectorAll('h2')).toHaveLength(1);
    expect(container.querySelector('h2')?.textContent).toContain('GTO 策略矩阵');
  });
});
