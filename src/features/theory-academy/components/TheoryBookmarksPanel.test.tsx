import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from '@/i18n/config';
import { TheoryBookmarksPanel } from './TheoryBookmarksPanel';

/**
 * 收藏面板契约（jsdom）。
 * 覆盖：panel 变体的链接与取消按钮、strip 变体的只读书签条、空态文案、
 * 失效章节 id（不在 manifest 内）被静默过滤。
 * 收藏写路径在 store.toggleBookmark（由 store 测试覆盖），本组件只回调。
 */

afterEach(() => cleanup());

const ids = ['t1-combinatorics', 't8-tilt'];

function mount(bookmarks: string[], variant: 'strip' | 'panel' = 'panel', onToggle?: (id: string) => void) {
  return render(
    <MemoryRouter initialEntries={['/theory']}>
      <TheoryBookmarksPanel bookmarks={bookmarks} variant={variant} {...(onToggle ? { onToggle } : {})} />
    </MemoryRouter>,
  );
}

describe('TheoryBookmarksPanel（panel）', () => {
  it('渲染收藏章节链接并回调取消收藏', () => {
    const onToggle = vi.fn();
    mount(ids, 'panel', onToggle);
    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/theory/chapter/t1-combinatorics',
      '/theory/chapter/t8-tilt',
    ]);
    const removeButtons = screen.getAllByRole('button', { name: new RegExp(i18n.t('theory.bookmarks.remove')) });
    expect(removeButtons).toHaveLength(2);
    fireEvent.click(removeButtons[0]!);
    expect(onToggle).toHaveBeenCalledWith('t1-combinatorics');
  });

  it('无收藏时展示空态', () => {
    mount([], 'panel');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });

  it('失效章节 id 被过滤（不渲染断链）', () => {
    mount(['nope-missing'], 'panel');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
  });
});

describe('TheoryBookmarksPanel（strip）', () => {
  it('书签条只读：无取消按钮，链接可跳转', () => {
    mount(ids, 'strip');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('书签条空态复用同一文案', () => {
    mount([], 'strip');
    expect(screen.getByText(i18n.t('theory.bookmarks.empty'))).toBeTruthy();
  });
});
