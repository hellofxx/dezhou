import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import { TheoryBookmarksPanel } from './TheoryBookmarksPanel';

/**
 * 收藏面板契约（jsdom）。
 * 覆盖：panel 变体的条目跳转与取消按钮、strip 变体的只读书签条、空态文案、
 * 失效章节 id（不在 manifest 内）被静默过滤。
 * 条目由共享 AcademyBookmarksPanel 渲染为 button + onNavigate（共享层不引 router），
 * 跳转目标用路由探针断言；收藏写路径在 store.toggleBookmark（由 store 测试覆盖），
 * 本组件只回调。
 */

afterEach(() => cleanup());

const ids = ['t1-combinatorics', 't8-tilt'];
const T1_TITLE = i18n.t('theory.chapterTitle.t1-combinatorics');

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function mount(bookmarks: string[], variant: 'strip' | 'panel' = 'panel', onToggle?: (id: string) => void) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryBookmarksPanel bookmarks={bookmarks} variant={variant} {...(onToggle ? { onToggle } : {})} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TheoryBookmarksPanel（panel）', () => {
  it('渲染收藏章节入口并跳转到该章节路由', () => {
    mount(ids, 'panel');
    // 条目按钮可访问名恰好是章节标题（移除按钮为「取消收藏 · 标题」）
    fireEvent.click(screen.getByRole('button', { name: T1_TITLE }));
    expect(screen.getByTestId('location').textContent).toBe('/theory/chapter/t1-combinatorics');
  });

  it('渲染取消收藏按钮并回调章节 id', () => {
    const onToggle = vi.fn();
    mount(ids, 'panel', onToggle);
    const removeButtons = screen.getAllByRole('button', { name: new RegExp(i18n.t('theory.bookmarks.remove')) });
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]!);
    expect(onToggle).toHaveBeenCalledWith('t1-combinatorics');
  });

  it('无收藏时展示空态', () => {
    mount([], 'panel');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('失效章节 id 被过滤（不渲染断链）', () => {
    mount(['nope-missing'], 'panel');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
  });
});

describe('TheoryBookmarksPanel（strip）', () => {
  it('书签条只读：无取消按钮，条目可跳转', () => {
    mount(ids, 'strip');
    expect(screen.getAllByRole('button')).toHaveLength(2);
    fireEvent.click(screen.getByRole('button', { name: T1_TITLE }));
    expect(screen.getByTestId('location').textContent).toBe('/theory/chapter/t1-combinatorics');
  });

  it('书签条空态复用同一文案', () => {
    mount([], 'strip');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
  });
});
