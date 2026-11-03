/**
 * ScenarioSetup 场景设置表单测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 分区标签与开始按钮回调
 *  - Exploit 模式：提示文案、对手画像列表（排除 unknown）、选中后展示 VPIP/PFR/3-bet
 *  - 变体 / 玩家人数变更时的位置回落与人数选项收敛
 *  - 难度 / 场景数量 / 有效筹码 / 游戏类型写入 store config
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Position } from '@/shared/types/position';
import { useGTOSimulatorStore } from '../store';
import { ScenarioSetup } from './ScenarioSetup';

const store = () => useGTOSimulatorStore.getState();

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
    exploitMode: false,
    selectedOpponent: null,
  });
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find((button) =>
    button.textContent?.includes(text),
  );
}

function clickText(container: HTMLElement, text: string): void {
  const button = findButton(container, text);
  if (!button) throw new Error(`未找到按钮：${text}`);
  fireEvent.click(button);
}

beforeEach(resetStore);
afterEach(() => cleanup());

describe('ScenarioSetup 基础渲染', () => {
  it('渲染全部分区标签与开始按钮', () => {
    render(<ScenarioSetup onStart={() => {}} />);

    for (const label of [
      '训练模式',
      '游戏变体',
      '游戏类型',
      '有效筹码',
      '位置',
      '玩家人数',
      '难度',
      '场景数量',
      '开始 GTO 训练',
    ]) {
      expect(screen.getAllByText(new RegExp(label)).length).toBeGreaterThan(0);
    }
  });

  it('点击开始按钮触发 onStart', () => {
    const onStart = vi.fn();
    const { container } = render(<ScenarioSetup onStart={onStart} />);

    clickText(container, '开始 GTO 训练');

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe('ScenarioSetup Exploit 模式与对手画像', () => {
  it('切到 Exploit 模式后展示提示文案与 5 个对手画像（不含 unknown）', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);

    clickText(container, 'Exploit 模式');

    expect(store().exploitMode).toBe(true);
    expect(screen.getByText(/剥削模式：根据对手类型调整最优策略/)).toBeTruthy();
    expect(findButton(container, 'TAG')).toBeTruthy();
    expect(findButton(container, 'LAG')).toBeTruthy();
    expect(findButton(container, 'NIT')).toBeTruthy();
    expect(findButton(container, 'MAN')).toBeTruthy();
    expect(findButton(container, 'CS')).toBeTruthy();
    expect(findButton(container, 'Unknown')).toBeUndefined();
  });

  it('选中 Nit 后写入 store 并展示画像名称与关键数据', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);
    clickText(container, 'Exploit 模式');

    clickText(container, 'NIT');

    expect(store().selectedOpponent).toBe('nit');
    expect(screen.getByText(/Nit \(超紧\)/)).toBeTruthy();
    expect(screen.getByText('VPIP: 10%')).toBeTruthy();
    expect(screen.getByText('PFR: 8%')).toBeTruthy();
    expect(screen.getByText('3-bet: 3%')).toBeTruthy();
  });

  it('切回 GTO 模式隐藏对手区块（不清除已选对手）', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);
    clickText(container, 'Exploit 模式');
    clickText(container, 'NIT');

    clickText(container, 'GTO 模式');

    expect(store().exploitMode).toBe(false);
    expect(findButton(container, 'NIT')).toBeUndefined();
    expect(store().selectedOpponent).toBe('nit');
  });
});

describe('ScenarioSetup 变体与人数', () => {
  it('切到短牌后限制人数上限并保留合法位置，同时展示短牌提示', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);

    clickText(container, '短牌德州 (6+)');

    expect(store().config.gameVariant).toBe('short-deck');
    expect(store().config.playerCount).toBe(6);
    expect(store().config.position).toBe(Position.BTN);
    expect(screen.getByText(/短牌模式：36 张牌组/)).toBeTruthy();
    // 短牌 maxPlayers=6 → 不再提供 9-max
    expect(findButton(container, '9-max')).toBeUndefined();
  });

  it('人数切换到 3-max 时，原位置 UTG 不存在则回落到首个位置 BTN', () => {
    useGTOSimulatorStore.setState({
      config: { ...store().config, position: Position.UTG },
    });
    const { container } = render(<ScenarioSetup onStart={() => {}} />);

    clickText(container, '3-max');

    expect(store().config.playerCount).toBe(3);
    expect(store().config.position).toBe(Position.BTN);
    expect(findButton(container, 'UTG')).toBeUndefined();
  });

  it('位置按钮写入 config.position', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);

    clickText(container, 'CO');

    expect(store().config.position).toBe(Position.CO);
  });
});

describe('ScenarioSetup 其余选项', () => {
  it('难度 / 场景数量 / 游戏类型 / 有效筹码均写入 config', () => {
    const { container } = render(<ScenarioSetup onStart={() => {}} />);

    clickText(container, '高级');
    clickText(container, '30');
    clickText(container, '锦标赛');
    const slider = container.querySelector<HTMLInputElement>('input[type="range"]')!;
    fireEvent.change(slider, { target: { value: '150' } });

    expect(store().config.difficulty).toBe('advanced');
    expect(store().config.scenarioCount).toBe(30);
    expect(store().config.gameType).toBe('tournament');
    expect(store().config.effectiveStack).toBe(150);
    expect(screen.getByText('150 BB')).toBeTruthy();
  });
});
