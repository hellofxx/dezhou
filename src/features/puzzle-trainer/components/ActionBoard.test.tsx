/**
 * ActionBoard 冒烟测试：组件渲染 + 行动 tier 分类。
 *
 * P2026-08: 验证 3 档 tier（passive/standard/aggressive）按 category 正确分发，
 * 以及 selectedOptionId 高亮、答题后 isAnswered 锁定、正确选项揭示等核心交互。
 *
 * S2 视觉一致性：tier 配色不变（防颜色暗示答案），同档位改由 Lucide 动作图标区分具体动作，
 * 并断言图标语义映射、14px 尺寸与 aria-hidden 装饰性、无法解析类别时不渲染图标。
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

  it('同档位内按动作类别渲染区分图标（Fold=X / Check=ShieldCheck / Call=HandCoins / Limp=Footprints / Bet·Raise=ArrowUp / 全下=Flame）', () => {
    const options: PuzzleOption[] = [
      { id: 'fold', text: 'Fold', isCorrect: false, explanation: '' },
      { id: 'check', text: 'Check', isCorrect: true, explanation: '' },
      { id: 'call', text: 'Call', isCorrect: false, explanation: '' },
      { id: 'limp', text: 'Limp', isCorrect: false, explanation: '' },
      { id: 'bet', text: 'Bet 4BB', isCorrect: false, explanation: '' },
      { id: 'raise', text: 'Raise 9BB', isCorrect: false, explanation: '' },
      { id: 'allin', text: '全下 20BB', isCorrect: false, explanation: '' },
    ];
    act(() => {
      root.render(
        <ActionBoard
          options={options}
          selectedOptionId={null}
          isAnswered={false}
          onSelect={() => {}}
        />
      );
    });

    const iconOf = (id: string) =>
      container.querySelector<SVGElement>(`[data-testid=action-tile-${id}] [data-action-icon] svg`);

    const EXPECTED: Array<[id: string, key: string, lucideClass: string]> = [
      ['fold', 'fold', 'lucide-x'],
      ['check', 'check', 'lucide-shield-check'],
      ['call', 'call', 'lucide-hand-coins'],
      ['limp', 'limp', 'lucide-footprints'],
      ['bet', 'bet', 'lucide-arrow-up'],
      ['raise', 'raise', 'lucide-arrow-up'],
      ['allin', 'allin', 'lucide-flame'],
    ];

    for (const [id, key, lucideClass] of EXPECTED) {
      const icon = iconOf(id);
      expect(icon, `${id} 未渲染动作图标`).not.toBeNull();
      expect(icon?.closest('[data-action-icon]')?.getAttribute('data-action-icon')).toBe(key);
      expect(icon?.getAttribute('class')).toContain(lucideClass);
      // 图标为纯装饰：aria-hidden + 14px 尺寸类（与原 emoji 视觉相当）
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
      expect(icon?.getAttribute('class')).toContain('w-3.5');
    }

    // Fold / Check 同属 passive 档（颜色相同、不暗示答案），靠图标区分具体动作
    expect(
      container.querySelector('[data-testid=action-tile-fold]')?.getAttribute('data-tier')
    ).toBe('passive');
    expect(
      container.querySelector('[data-testid=action-tile-check]')?.getAttribute('data-tier')
    ).toBe('passive');
  });

  it('无法解析出动作类别时不渲染图标（不猜测动作）', () => {
    const UNKNOWN: PuzzleOption = { id: 'u', text: '想一想再决定', isCorrect: true, explanation: '' };
    act(() => {
      root.render(
        <ActionBoard
          options={[UNKNOWN]}
          selectedOptionId={null}
          isAnswered={false}
          onSelect={() => {}}
        />
      );
    });

    const tile = container.querySelector('[data-testid=action-tile-u]');
    expect(tile?.querySelector('[data-action-icon]')).toBeNull();
    expect(tile?.querySelector('svg')).toBeNull();
    expect(tile?.textContent).toContain('想一想再决定');
    expect(tile?.getAttribute('data-tier')).toBe('standard');
  });
});

