/**
 * RangeTrainerHome 组件回归测试（jsdom）：
 * - RNG-002：点击「已选中」的位置按钮后预设不被永久清空
 *   （修复前自动选预设 effect 依赖缺 selectedPreset，重选同位置时 effect 不重跑）
 * - RNG-003：短牌变体下 Home 页范围占比按 630 组合计算
 *   （修复前 RangeInfo 未收到 variant，按标准 1326 计算导致占比偏低约一半）
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz 测试模式）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { Position } from '@/shared/types/position';
import RangeTrainerHome from './RangeTrainerHome';
import { useRangeTrainerStore, INITIAL_QUIZ_STATE } from '../store';
import { PRESET_RANGES } from '../constants';
import { countRangeCombos } from '../utils/rangeCombos';

function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const btn = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.trim() === text,
  );
  if (!btn) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((b) => JSON.stringify(b.textContent?.trim()))
      .join(', ');
    throw new Error(`未找到按钮：${text}；现有按钮：[${all}]`);
  }
  return btn;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** 重置 range-trainer store 至初始状态（模块单例，避免用例间污染） */
function resetRangeStore() {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount: 6,
    presets: PRESET_RANGES,
    learnState: {
      selectedPreset: null,
      selectedPosition: Position.UTG,
      selectedActionType: 'open',
      highlightedHand: null,
    },
    quizState: { ...INITIAL_QUIZ_STATE },
  });
}

describe('RangeTrainerHome 回归（RNG-002 / RNG-003）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    resetRangeStore();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    resetRangeStore();
  });

  it('RNG-002：点击已选中的位置按钮，预设自动恢复而非永久清空', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <RangeTrainerHome />
        </MemoryRouter>,
      );
    });

    // 初始 effect 自动选中 UTG open 预设
    expect(useRangeTrainerStore.getState().learnState.selectedPreset?.id).toBe('utg-open');

    // 点击「已选中」的 UTG 按钮：setSelectedPosition 将 selectedPreset 置 null，
    // 但 position 值不变 → 修复前 effect（依赖缺 selectedPreset）不重跑，预设永久丢失
    click(findButtonByText(container, 'UTG'));

    // 修复后：effect 依赖含 selectedPreset，重跑并恢复匹配预设
    expect(useRangeTrainerStore.getState().learnState.selectedPreset?.id).toBe('utg-open');
  });

  it('RNG-003：短牌变体下 Home 页范围占比按 630 组合计算', () => {
    act(() => {
      root.render(
        <MemoryRouter>
          <RangeTrainerHome />
        </MemoryRouter>,
      );
    });

    // 切换短牌变体（store action；setGameVariant 会重置 presets 并清空 selectedPreset）
    act(() => {
      useRangeTrainerStore.getState().setGameVariant('short-deck');
    });
    // 短牌无 UTG 预置，切到 CO（位置切换触发预设自动匹配 sd-co-open）
    act(() => {
      useRangeTrainerStore.getState().setSelectedPosition(Position.CO);
    });

    const preset = useRangeTrainerStore.getState().learnState.selectedPreset;
    expect(preset?.id).toBe('sd-co-open');

    // 期望占比 = sd-co-open 组合数 / 短牌 630 总组合（分母是本 bug 核心）
    // 修复前 RangeInfo 收不到 variant，按标准 1326 计算 → 占比偏低约一半
    const expectedPercent = ((countRangeCombos(preset!.hands) / 630) * 100).toFixed(1);
    expect(container.textContent).toContain(`${expectedPercent}%`);
  });
});
