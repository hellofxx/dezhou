/**
 * RangeLearnPage（学习模式页）组件测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 进入页面自动匹配当前（位置, 动作类型）对应的预设，并在范围信息卡展示手牌数与占比
 *  - 位置按钮切换 → store 更新 + 预设随之重新匹配
 *  - 动作类型按钮切换 → store 更新 + 预设重新匹配（CO 3-bet 预设）
 *  - 切到无对应预设的组合时不崩溃（范围为空白，等待用户改回）
 *  - 网格悬停写 highlightedHand 并在范围信息卡展示手牌详情
 *  - 顶部返回按钮跳转 /range-trainer
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { Position } from '@/shared/types/position';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating, PokerVariant } from '@/shared/types/elo';
import { useProgressStore } from '@/features/progress/store';
import { useRangeTrainerStore } from '../store';
import { PRESET_RANGES, ADVANCED_PRESET_RANGES } from '../constants';
import { countRangeCombos } from '../utils/rangeCombos';
import RangeLearnPage from './RangeLearnPage';

const rangeStore = () => useRangeTrainerStore.getState();

const elo = (variant: PokerVariant): EloRating => ({ ...DEFAULT_ELO, variant, preflop: 2000, overall: 2000 });

function resetStores(): void {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount: 6,
    presets: [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES],
    learnState: {
      selectedPreset: null,
      selectedPosition: Position.UTG,
      selectedActionType: 'open',
      highlightedHand: null,
    },
  });
  // 全位置解锁，避免位置按钮被渐进解锁门禁禁用
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: elo('standard'),
      'short-deck': elo('short-deck'),
      'heads-up': elo('heads-up'),
    },
  });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/range-trainer/learn']}>
      <RangeLearnPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

/** 文案完全相等匹配（位置 / 动作按钮文本较短，避免 includes 误命中） */
function findButtonExact(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find(
    (btn) => btn.textContent?.trim() === text,
  );
  if (!button) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((btn) => JSON.stringify(btn.textContent?.trim()))
      .join(', ');
    throw new Error(`未找到按钮：${text}；现有按钮：[${all}]`);
  }
  return button;
}

beforeEach(resetStores);
afterEach(() => {
  cleanup();
  resetStores();
});

describe('RangeLearnPage 预设自动匹配', () => {
  it('首次进入按 UTG + open 自动选中 utg-open 预设并展示范围统计', () => {
    const { container } = renderPage();

    expect(rangeStore().learnState.selectedPreset?.id).toBe('utg-open');
    expect(screen.getByText('学习模式')).toBeTruthy();
    expect(screen.getByText('范围选择')).toBeTruthy();
    expect(screen.getByText('13×13 范围矩阵')).toBeTruthy();
    expect(screen.getByText('手牌数')).toBeTruthy();
    // 范围占比与组合数加权计算一致（1326 为 6-max 标准总组合）
    const preset = rangeStore().learnState.selectedPreset!;
    const percent = ((countRangeCombos(preset.hands) / 1326) * 100).toFixed(1);
    expect(container.textContent).toContain(`${percent}%`);
  });
});

describe('RangeLearnPage 位置与动作类型切换', () => {
  it('点击位置按钮 CO 后 store 更新且预设重匹配为 co-open', () => {
    const { container } = renderPage();

    fireEvent.click(findButtonExact(container, 'CO'));

    expect(rangeStore().learnState.selectedPosition).toBe(Position.CO);
    expect(rangeStore().learnState.selectedPreset?.id).toBe('co-open');
  });

  it('点击动作类型 3-bet 后预设重匹配为 co-3bet-vs-hj', () => {
    const { container } = renderPage();
    fireEvent.click(findButtonExact(container, 'CO'));

    fireEvent.click(findButtonExact(container, '3-bet'));

    expect(rangeStore().learnState.selectedActionType).toBe('3bet');
    expect(rangeStore().learnState.selectedPreset?.id).toBe('co-3bet-vs-hj');
  });

  it('切到无对应预设的组合时预设为空但页面正常渲染', () => {
    const { container } = renderPage();
    fireEvent.click(findButtonExact(container, 'CO'));
    fireEvent.click(findButtonExact(container, '3-bet'));

    // HJ 无 3-bet 预置
    fireEvent.click(findButtonExact(container, 'HJ'));

    expect(rangeStore().learnState.selectedPosition).toBe(Position.HJ);
    expect(rangeStore().learnState.selectedPreset).toBeNull();
    // 无预设时当前范围区块不渲染，网格仍在
    expect(screen.queryByText('当前范围')).toBeNull();
    expect(screen.getByText('13×13 范围矩阵')).toBeTruthy();
  });
});

describe('RangeLearnPage 网格悬停与返回', () => {
  it('悬停网格格子写入 highlightedHand 并展示手牌详情', () => {
    const { container } = renderPage();

    const cell = container.querySelector<HTMLElement>('[title="AA"]');
    expect(cell).not.toBeNull();

    act(() => {
      fireEvent.mouseOver(cell!);
    });
    expect(rangeStore().learnState.highlightedHand).toBe('AA');
    expect(screen.getByText('手牌详情')).toBeTruthy();
    expect(screen.getByText('在范围内')).toBeTruthy();

    act(() => {
      fireEvent.mouseOut(cell!, { relatedTarget: document.body });
    });
    expect(rangeStore().learnState.highlightedHand).toBeNull();
    expect(screen.queryByText('手牌详情')).toBeNull();
  });

  it('点击返回按钮跳转 /range-trainer', () => {
    const { container } = renderPage();

    fireEvent.click(findButtonExact(container, '返回'));

    expect(screen.getByTestId('location').textContent).toBe('/range-trainer');
  });
});
