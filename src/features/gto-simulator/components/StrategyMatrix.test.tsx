/**
 * StrategyMatrix 测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 13×13 = 169 手全量渲染与图例文案（动作词取 actionTerms 英文单源）
 *  - 频率 title 提示、无数据兜底 title
 *  - hover / click 回调与高亮 class
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { HandNotation } from '@/shared/types/poker';
import type { HandStrategy } from '../types';
import { StrategyMatrix } from './StrategyMatrix';

afterEach(() => cleanup());

function strategies(entries: Partial<Record<HandNotation, HandStrategy>>) {
  return entries as Record<HandNotation, HandStrategy>;
}

const AA_PURE_RAISE = strategies({ AA: { fold: 0, call: 0, raise: 1, raiseAmount: 2.5 } });

function cells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('[title]'));
}

function cellByHand(container: HTMLElement, hand: HandNotation): HTMLElement {
  const cell = cells(container).find((node) => node.textContent === hand);
  if (!cell) throw new Error(`未找到手牌格子：${hand}`);
  return cell;
}

describe('StrategyMatrix 渲染', () => {
  it('渲染 169 个手牌格子且图例包含三种动作', () => {
    const { container } = render(<StrategyMatrix strategies={AA_PURE_RAISE} />);

    expect(cells(container)).toHaveLength(169);
    // 行 / 列各 13 个 rank 标题 → 至少出现 26 次 'A'
    expect(container.textContent!.split('A').length - 1).toBeGreaterThanOrEqual(26);
    expect(screen.getByText('Raise')).toBeTruthy();
    expect(screen.getByText('Call')).toBeTruthy();
    expect(screen.getByText('Fold')).toBeTruthy();
  });

  it('有策略的格子 title 展示 R/C/F 频率，无策略的格子只展示手牌名', () => {
    const { container } = render(<StrategyMatrix strategies={AA_PURE_RAISE} />);

    expect(cellByHand(container, 'AA').getAttribute('title')).toBe('AA: R100% C0% F0%');
    expect(cellByHand(container, '72o').getAttribute('title')).toBe('72o');
  });

  it('strategies 为 null 时全部格子走兜底样式且 title 只有手牌名', () => {
    const { container } = render(<StrategyMatrix strategies={null} />);

    expect(cells(container)).toHaveLength(169);
    expect(cellByHand(container, 'AA').getAttribute('title')).toBe('AA');
    expect(cellByHand(container, 'AA').className).toContain('bg-[var(--walnut-raised)]/40');
  });
});

describe('StrategyMatrix 交互', () => {
  it('hover 进入 / 离开分别回调手牌与 null', () => {
    const onCellHover = vi.fn();
    const { container } = render(
      <StrategyMatrix strategies={AA_PURE_RAISE} onCellHover={onCellHover} />,
    );
    const aa = cellByHand(container, 'AA');

    fireEvent.mouseEnter(aa);
    expect(onCellHover).toHaveBeenLastCalledWith('AA');

    fireEvent.mouseLeave(aa);
    expect(onCellHover).toHaveBeenLastCalledWith(null);
  });

  it('点击格子回调手牌名；无回调时不抛错', () => {
    const onCellClick = vi.fn();
    const { container, unmount } = render(
      <StrategyMatrix strategies={AA_PURE_RAISE} onCellClick={onCellClick} />,
    );

    fireEvent.click(cellByHand(container, 'AA'));
    expect(onCellClick).toHaveBeenCalledWith('AA');

    unmount();
    const bare = render(<StrategyMatrix strategies={AA_PURE_RAISE} />);
    expect(() => fireEvent.click(cellByHand(bare.container, 'KK'))).not.toThrow();
  });

  it('highlightedHand 命中格子加 ring 高亮，其余格子不加', () => {
    const { container } = render(
      <StrategyMatrix strategies={AA_PURE_RAISE} highlightedHand="AA" />,
    );

    expect(cellByHand(container, 'AA').className).toContain('ring-2');
    expect(cellByHand(container, 'KK').className).not.toContain('ring-2');
  });

  it('按主导动作着色：raise / call / fold 各自色系', () => {
    const { container } = render(
      <StrategyMatrix
        strategies={strategies({
          AA: { fold: 0, call: 0, raise: 1 },
          KK: { fold: 0, call: 1, raise: 0 },
          '72o': { fold: 1, call: 0, raise: 0 },
        })}
      />,
    );

    expect(cellByHand(container, 'AA').className).toContain('bg-[var(--brass)]/95');
    expect(cellByHand(container, 'KK').className).toContain('bg-[var(--sage)]/90');
    expect(cellByHand(container, '72o').className).toContain('bg-[var(--clay)]/45');
  });

  it('接受 className 透传到根容器', () => {
    const { container } = render(
      <StrategyMatrix strategies={null} className="matrix-custom" />,
    );

    expect(container.querySelector('.matrix-custom')).not.toBeNull();
  });
});
