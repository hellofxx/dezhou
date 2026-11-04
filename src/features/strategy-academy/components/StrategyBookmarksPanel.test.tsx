import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import { useAcademyStore } from '../store';
import { findLessonSummaryById } from '../utils/academyMeta';
import { StrategyBookmarksPanel } from './StrategyBookmarksPanel';

/**
 * 收藏课时面板契约（jsdom + 真实 store）：
 * - panel 变体：按 store 顺序渲染条目（标题走课时 i18n key）、点击跳 /academy/lesson/:id、移除按钮回写 store
 * - strip 变体：只读书签条（无移除按钮）
 * - 空态：展示 academy.bookmarks.empty
 * - 失效课时 id（不在 manifest）静默过滤，不产生断链
 */

const TITLE = i18n.t('academy.bookmarks.title', { defaultValue: '收藏课时' });
const EMPTY = i18n.t('academy.bookmarks.empty', {
  defaultValue: '还没有收藏。把想反复读的课时存下来，随时回到这里',
});
const REMOVE = i18n.t('academy.bookmarks.remove', { defaultValue: '取消收藏' });

function lessonTitle(lessonId: string): string {
  const summary = findLessonSummaryById(lessonId);
  if (!summary) throw new Error(`missing lesson summary: ${lessonId}`);
  return i18n.t(`academy.lessonTitle.${lessonId}`, { defaultValue: summary.title });
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

function mount(variant: 'strip' | 'panel' = 'panel') {
  return render(
    <MemoryRouter initialEntries={['/academy']}>
      <StrategyBookmarksPanel variant={variant} />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAcademyStore.getState().resetProgress();
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('StrategyBookmarksPanel（panel）', () => {
  it('渲染 store 内的收藏条目并跳转到课时路由', () => {
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    useAcademyStore.getState().toggleLessonBookmark('l1-bankroll');
    mount();

    expect(screen.getByRole('region', { name: TITLE })).toBeTruthy();
    expect(screen.getByRole('button', { name: lessonTitle('l1-basics') })).toBeTruthy();
    expect(screen.getByRole('button', { name: lessonTitle('l1-bankroll') })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: lessonTitle('l1-bankroll') }));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-bankroll');
  });

  it('移除按钮把课时从 store 摘掉', () => {
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    mount();

    fireEvent.click(screen.getByRole('button', { name: `${REMOVE} · ${lessonTitle('l1-basics')}` }));

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([]);
    expect(screen.getByText(EMPTY)).toBeTruthy();
  });

  it('无收藏时展示空态且无条目', () => {
    mount();

    expect(screen.getByText(EMPTY)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('失效课时 id 被过滤（不渲染断链）', () => {
    useAcademyStore.getState().toggleLessonBookmark('gone-lesson');
    mount();

    expect(screen.getByText(EMPTY)).toBeTruthy();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});

describe('StrategyBookmarksPanel（strip）', () => {
  it('书签条只读：条目可跳转但没有移除按钮', () => {
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    mount('strip');

    expect(screen.getAllByRole('button')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: lessonTitle('l1-basics') }));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-basics');
  });

  it('空态与 panel 共用同一文案', () => {
    mount('strip');
    expect(screen.getByText(EMPTY)).toBeTruthy();
  });
});
