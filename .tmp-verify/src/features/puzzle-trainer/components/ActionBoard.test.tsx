/**
 * ActionBoard 冒烟测试：组件渲染 + 行动 tier 分类。
 *
 * P2026-08: 验证 3 档 tier（passive/standard/aggressive）按 category 正确分发，
 * 以及 selectedOptionId 高亮、答题后 isAnswered 锁定、正确选项揭示等核心交互。
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ActionBoard from './ActionBoard';
import type { PuzzleOption } from '../types';

const PASSIVE: PuzzleOption = { id: 'a', text: 'Check', isCorrect: true, explanation: '' };
const STANDARD: PuzzleOption = { id: 'b', text: 'Bet 4BB', isCorrect: false, explanation: '' };
const AGGRESSIVE: PuzzleOption = { id: 'c', text: '全下 22.5BB', isCorrect: false, explanation: '' };

describe('ActionBoard 行动桌组件', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('渲染 3 个选项，并为每个选项按 category 写入 data-tier', () => {
    const onSelect = vi.fn();
    act(() => {
      root.render(
        <ActionBoard
          options={[PASSIVE, STANDARD, AGGRESSIVE]}
          selectedOptionId={null}
          isAnswered={false}
          onSelect={onSelect}
        />
      );
    });

    const tiles = container.querySelectorAll('[data-testid^=action-tile-]');
    expect(tiles).toHaveLength(3);
    expect(tiles[0]?.getAttribute('data-tier')).toBe('passive');
    expect(tiles[1]?.getAttribute('data-tier')).toBe('standard');
    expect(tiles[2]?.getAttribute('data-tier')).toBe('aggressive');
    expect(container.textContent).toContain('Check');
    expect(container.textContent).toContain('Bet 4BB');
    expect(container.textContent).toContain('全下 22.5BB');
  });

  it('未答状态下点击选项触发 onSelect 回调', () => {
    const onSelect = vi.fn();
    act(() => {
      root.render(
        <ActionBoard
          options={[PASSIVE, STANDARD, AGGRESSIVE]}
          selectedOptionId={null}
          isAnswered={false}
          onSelect={onSelect}
        />
      );
    });

    const target = container.querySelector('[data-testid=action-tile-b]') as HTMLButtonElement | null;
    act(() => {
      target?.click();
    });
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('已答状态下所有按钮 disabled，点击不再触发回调', () => {
    const onSelect = vi.fn();
    act(() => {
      root.render(
        <ActionBoard
          options={[PASSIVE, STANDARD, AGGRESSIVE]}
          selectedOptionId="b"
          isAnswered
          onSelect={onSelect}
        />
      );
    });

    const tiles = container.querySelectorAll('button');
    tiles.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });

    act(() => {
      const c = container.querySelector('[data-testid=action-tile-c]') as HTMLButtonElement | null;
      c?.click();
    });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('已答且选中项正确：仅该选项获得 --correct 类', () => {
    act(() => {
      root.render(
        <ActionBoard
          options={[PASSIVE, STANDARD, AGGRESSIVE]}
          selectedOptionId="a"
          isAnswered
          onSelect={() => {}}
        />
      );
    });

    const a = container.querySelector('[data-testid=action-tile-a]') as HTMLElement | null;
    const b = container.querySelector('[data-testid=action-tile-b]') as HTMLElement | null;
    const c = container.querySelector('[data-testid=action-tile-c]') as HTMLElement | null;

    expect(a?.className).toContain('action-tile--correct');
    expect(b?.className).not.toContain('action-tile--correct');
    expect(c?.className).not.toContain('action-tile--correct');
  });

  it('已答但选中项错误：仅该选项获得 --wrong 类，正确选项获得 --correct-reveal', () => {
    act(() => {
      root.render(
        <ActionBoard
          options={[PASSIVE, STANDARD, AGGRESSIVE]}
          selectedOptionId="b"
          isAnswered
          onSelect={() => {}}
        />
      );
    });

    const a = container.querySelector('[data-testid=action-tile-a]') as HTMLElement | null;
    const b = container.querySelector('[data-testid=action-tile-b]') as HTMLElement | null;
    const c = container.querySelector('[data-testid=action-tile-c]') as HTMLElement | null;

    expect(a?.className).toContain('action-tile--correct-reveal');
    expect(b?.className).toContain('action-tile--wrong');
    expect(c?.className).toContain('action-tile--dim');
  });

  it('2 选项时 grid 容器列布局应用 cols-2 modifier（响应式分列）', () => {
    const FOLD: PuzzleOption = { id: 'f', text: 'Fold', isCorrect: false, explanation: '' };
    const CALL: PuzzleOption = { id: 'cl', text: 'Call', isCorrect: true, explanation: '' };
    act(() => {
      root.render(
        <ActionBoard
          options={[FOLD, CALL]}
          selectedOptionId={null}
          isAnswered={false}
          onSelect={() => {}}
        />
      );
    });

    const board = container.querySelector('.action-board');
    expect(board?.className).toContain('action-board--cols-2');
  });
});
