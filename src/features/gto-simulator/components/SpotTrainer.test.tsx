/**
 * SpotTrainer（Spot 反复练习）测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 位置选择排除 BB（bb_open 无 GTO 表）；返回按钮回调
 *  - 点击矩阵格子展示手牌频率详情（纯 raise / 混合策略文案、加注尺寸）
 *  - 再次点击同一手牌取消选中；切换位置清空选中
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { HandNotation } from '@/shared/types/poker';
import { SpotTrainer } from './SpotTrainer';

afterEach(() => cleanup());

function findButton(container: HTMLElement, text: string): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === text,
  );
}

function cell(container: HTMLElement, hand: HandNotation): HTMLElement {
  const node = Array.from(container.querySelectorAll<HTMLElement>('[title]')).find(
    (element) => element.textContent === hand,
  );
  if (!node) throw new Error(`未找到矩阵格子：${hand}`);
  return node;
}

describe('SpotTrainer 位置选择', () => {
  it('渲染标题与返回按钮，BB 从位置列表中剔除', () => {
    const onClose = vi.fn();
    const { container } = render(<SpotTrainer onClose={onClose} />);

    expect(screen.getByText('Spot 练习')).toBeTruthy();
    const positionButtons = Array.from(container.querySelectorAll('button'))
      .map((button) => button.textContent)
      .filter((text) => text !== 'Spot 练习' && text !== '返回');

    expect(positionButtons).toContain('BTN');
    expect(positionButtons).toContain('UTG');
    expect(positionButtons).not.toContain('BB');

    fireEvent.click(findButton(container, '返回')!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('默认 BTN：矩阵渲染 169 手', () => {
    const { container } = render(<SpotTrainer onClose={() => {}} />);

    expect(container.querySelectorAll('[title]')).toHaveLength(169);
  });
});

describe('SpotTrainer 手牌详情', () => {
  it('点击 AA 展示纯 raise 频率与建议加注尺寸', () => {
    const { container } = render(<SpotTrainer onClose={() => {}} />);

    fireEvent.click(cell(container, 'AA'));

    // 矩阵格子 + 详情面板各出现一次
    expect(screen.getAllByText('AA').length).toBeGreaterThan(1);
    expect(screen.getByText('BTN Open')).toBeTruthy();
    expect(screen.getByText('R 100%')).toBeTruthy();
    // 标签与数值分处文本节点 / 嵌套 span，按容器文本断言
    expect(container.textContent).toContain('加注大小:');
    expect(container.textContent).toContain('2.5 BB');
    expect(screen.getByText('纯 Raise - 这是一个必须加注的手牌')).toBeTruthy();
  });

  it('点击混合策略手牌 K5s 展示 raise/fold 比例与混合文案', () => {
    const { container } = render(<SpotTrainer onClose={() => {}} />);

    fireEvent.click(cell(container, 'K5s'));

    expect(screen.getByText('R 75%')).toBeTruthy();
    expect(screen.getByText('F 25%')).toBeTruthy();
    expect(screen.getByText('混合策略 - GTO 建议随机化')).toBeTruthy();
  });

  it('再次点击同一手牌取消选中，切换位置也清空选中', () => {
    const { container } = render(<SpotTrainer onClose={() => {}} />);

    fireEvent.click(cell(container, 'AA'));
    expect(screen.getByText('BTN Open')).toBeTruthy();

    fireEvent.click(cell(container, 'AA'));
    expect(screen.queryByText('BTN Open')).toBeNull();

    fireEvent.click(cell(container, 'AA'));
    expect(screen.getByText('BTN Open')).toBeTruthy();

    fireEvent.click(findButton(container, 'CO')!);
    expect(screen.queryByText('BTN Open')).toBeNull();
    expect(container.querySelectorAll('[title]')).toHaveLength(169);
  });
});
