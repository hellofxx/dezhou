/**
 * AcademyBookmarksPanel 契约（jsdom）：
 * - panel：条目渲染为可导航按钮，回调 onNavigate(route)；onRemove 渲染移除按钮（可访问名含条目名）
 * - strip：横向书签条，不渲染移除按钮（保持只读轻量），空态复用同一文案
 * - ariaLabel 可覆盖 section 可访问名；条目顺序即渲染顺序；空列表不渲染条目
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AcademyBookmarksPanel, type AcademyBookmarksPanelProps } from './AcademyBookmarksPanel';

const labels = {
  title: '收藏',
  empty: '还没有收藏',
  remove: '移除',
};

const items = [
  { id: 'a', title: '组合计数', route: '/theory/chapter/a' },
  { id: 'b', title: 'Tilt 识别', route: '/theory/chapter/b' },
];

/** 条目按钮可访问名恰好是标题（移除按钮为「移除 · 标题」，故用锚正则区分） */
const ITEM_NAMES = /^(组合计数|Tilt 识别)$/;

function mount(overrides: Partial<AcademyBookmarksPanelProps> = {}) {
  const onNavigate = vi.fn();
  const onRemove = vi.fn();
  const result = render(
    <AcademyBookmarksPanel
      items={items}
      onNavigate={onNavigate}
      onRemove={onRemove}
      labels={labels}
      {...overrides}
    />
  );
  return { ...result, onNavigate, onRemove };
}

afterEach(cleanup);

describe('AcademyBookmarksPanel（panel）', () => {
  it('按传入顺序渲染条目并显示条数', () => {
    mount();

    const buttons = screen.getAllByRole('button', { name: ITEM_NAMES });
    expect(buttons.map((button) => button.textContent)).toEqual(['组合计数', 'Tilt 识别']);
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('点击条目回调该项路由（共享层不持有 router）', () => {
    const { onNavigate } = mount();

    fireEvent.click(screen.getByRole('button', { name: 'Tilt 识别' }));
    expect(onNavigate).toHaveBeenCalledWith('/theory/chapter/b');
  });

  it('移除按钮可访问名为「移除 · 条目名」，回调条目 id', () => {
    const { onRemove } = mount();

    fireEvent.click(screen.getByRole('button', { name: '移除 · 组合计数' }));
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('未传 onRemove 时不渲染移除按钮', () => {
    mount({ onRemove: undefined });

    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: /移除/ })).toBeNull();
  });

  it('空列表展示空态且不渲染条目', () => {
    mount({ items: [] });

    expect(screen.getByText(labels.empty)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.getByText('0')).toBeTruthy();
  });

  it('行按钮与移除按钮是原生 button（type=button），移除键保留 44px 触摸目标', () => {
    mount();

    const row = screen.getByRole('button', { name: '组合计数' });
    expect(row.tagName).toBe('BUTTON');
    expect(row.getAttribute('type')).toBe('button');
    expect(row.classList.contains('min-h-11')).toBe(true);

    const remove = screen.getByRole('button', { name: '移除 · 组合计数' });
    expect(remove.tagName).toBe('BUTTON');
    expect(remove.getAttribute('type')).toBe('button');
    expect(remove.classList.contains('min-h-11')).toBe(true);
    expect(remove.classList.contains('min-w-11')).toBe(true);
  });

  it('section 可访问名缺省用 labels.title，可用 ariaLabel 覆盖', () => {
    mount();
    expect(screen.getByRole('region', { name: labels.title })).toBeTruthy();
    cleanup();

    mount({ ariaLabel: '课时书签' });
    expect(screen.getByRole('region', { name: '课时书签' })).toBeTruthy();
  });
});

describe('AcademyBookmarksPanel（strip）', () => {
  it('横向条：条目可导航，不渲染移除按钮', () => {
    const { onNavigate, onRemove } = mount({ variant: 'strip' });

    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: '组合计数' }));
    expect(onNavigate).toHaveBeenCalledWith('/theory/chapter/a');
    expect(onRemove).not.toHaveBeenCalled();
  });

  it('strip 空态复用同一文案', () => {
    mount({ variant: 'strip', items: [] });

    expect(screen.getByText(labels.empty)).toBeTruthy();
    expect(screen.getByRole('region', { name: labels.title })).toBeTruthy();
  });
});
