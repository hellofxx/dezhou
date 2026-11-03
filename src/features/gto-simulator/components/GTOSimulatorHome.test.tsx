/**
 * GTOSimulatorHome（模块首页）测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 默认场景训练 tab 渲染 ScenarioSetup；切到 Spot 练习 tab 切换子组件并可返回
 *  - 上次训练结果摘要（正确率 / 决策数 / EV 损失率）与「查看完整结果」跳转
 *  - 开始训练：生成会话并跳转 session 路由
 */

import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Position } from '@/shared/types/position';
import { useGTOSimulatorStore } from '../store';
import type { GTOResult } from '../types';
import GTOSimulatorHome from './GTOSimulatorHome';

afterEach(() => cleanup());

const store = () => useGTOSimulatorStore.getState();

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/gto-simulator']}>
      <GTOSimulatorHome />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const RESULT: GTOResult = {
  sessionId: 'gto-123',
  scenarios: 20,
  optimalDecisions: 15,
  averageEVLoss: 0.62,
  evLossBB100: 12.34,
  worstSpots: [],
  accuracy: 0.75,
  totalTime: 120000,
};

function findButton(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text),
  );
}

beforeEach(() => {
  store().resetSession();
  useGTOSimulatorStore.setState({
    config: {
      gameType: 'cash',
      effectiveStack: 100,
      position: Position.BTN,
      playerCount: 6,
      gameVariant: 'standard',
      difficulty: 'intermediate',
      scenarioCount: 2,
    },
    exploitMode: false,
    selectedOpponent: null,
  });
});

describe('GTOSimulatorHome 标签页', () => {
  it('默认展示场景训练设置与两个标签页', () => {
    renderHome();

    expect(screen.getByText('GTO 决策模拟器')).toBeTruthy();
    expect(screen.getByText('场景训练')).toBeTruthy();
    expect(screen.getByText('Spot 练习')).toBeTruthy();
    expect(screen.getByText('开始 GTO 训练')).toBeTruthy();
    expect(screen.queryByText('选择训练场景')).toBeNull();
  });

  it('切到 Spot 练习展示 SpotTrainer，点返回回到场景设置', () => {
    const { container } = renderHome();

    fireEvent.click(findButton(container, 'Spot 练习')!);
    expect(screen.getByText('选择训练场景')).toBeTruthy();
    expect(screen.queryByText('开始 GTO 训练')).toBeNull();

    fireEvent.click(findButton(container, '返回')!);
    expect(screen.getByText('开始 GTO 训练')).toBeTruthy();
    expect(screen.queryByText('选择训练场景')).toBeNull();
  });
});

describe('GTOSimulatorHome 上次训练摘要', () => {
  it('有 lastResult 时展示正确率、决策数与 EV 损失率', () => {
    useGTOSimulatorStore.setState({ lastResult: RESULT });
    renderHome();

    expect(screen.getByText('上次训练')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('最优决策率')).toBeTruthy();
    expect(screen.getByText('20 个决策 · EV 损失率 12.34 BB/100')).toBeTruthy();
  });

  it('点击「查看完整结果」跳转到结果页', () => {
    useGTOSimulatorStore.setState({ lastResult: RESULT });
    const { container } = renderHome();

    fireEvent.click(findButton(container, '查看完整结果')!);

    expect(screen.getByTestId('location').textContent).toBe('/gto-simulator/result/gto-123');
  });

  it('无 lastResult 或切到 Spot tab 时不展示摘要', () => {
    renderHome();
    expect(screen.queryByText('上次训练')).toBeNull();
    cleanup();

    useGTOSimulatorStore.setState({ lastResult: RESULT });
    const { container } = renderHome();
    fireEvent.click(findButton(container, 'Spot 练习')!);
    expect(screen.queryByText('上次训练')).toBeNull();
  });
});

describe('GTOSimulatorHome 开始训练', () => {
  it('点击开始训练生成会话并跳转 session 路由', () => {
    const { container } = renderHome();

    fireEvent.click(findButton(container, '开始 GTO 训练')!);

    expect(store().session).not.toBeNull();
    expect(store().session!.scenarios).toHaveLength(2);
    expect(screen.getByTestId('location').textContent).toBe('/gto-simulator/session/active');
  });
});
