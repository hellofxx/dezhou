/**
 * EmptyState 契约：
 * - 标题为 h3；compact 只收紧留白与图标气泡尺寸
 * - action 可选；有 action 时按钮可访问名 = label 且点击只触发一次
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
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

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const rootEl = () => container.firstElementChild as HTMLElement;

  it('默认留白与图标气泡：py-16 / w-16，标题为 h3', () => {
    render(<EmptyState icon={<span data-icon="empty" />} title="暂无牌局" description="导入后开始复盘" />);

    expect(rootEl().className).toContain('py-16');
    expect(container.querySelector('.w-16')).not.toBeNull();
    const title = container.querySelector('h3');
    expect(title?.textContent).toBe('暂无牌局');
    expect(container.querySelector('p')?.textContent).toBe('导入后开始复盘');
  });

  it('compact 变体收紧留白与图标气泡', () => {
    render(
      <EmptyState compact icon={<span data-icon="empty" />} title="暂无数据" description="稍后再来" />,
    );

    expect(rootEl().className).toContain('py-6');
    expect(rootEl().className).not.toContain('py-16');
    expect(container.querySelector('.w-10')).not.toBeNull();
  });

  it('无 action 时不渲染按钮', () => {
    render(<EmptyState icon={<span data-icon="empty" />} title="空" description="无操作" />);
    expect(container.querySelector('button')).toBeNull();
  });

  it('action 按钮可访问名 = label，点击回调一次', () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        icon={<span data-icon="empty" />}
        title="空"
        description="无操作"
        action={{ label: '导入牌局', onClick }}
      />,
    );

    const button = container.querySelector<HTMLButtonElement>('button');
    expect(button).not.toBeNull();
    expect(button!.getAttribute('aria-label')).toBe('导入牌局');
    expect(button!.textContent).toBe('导入牌局');

    act(() => {
      button!.click();
    });
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});