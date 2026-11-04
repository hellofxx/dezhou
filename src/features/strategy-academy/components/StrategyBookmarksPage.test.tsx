import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '@/i18n/config';
import { useAcademyStore } from '../store';
import { findLessonSummaryById } from '../utils/academyMeta';
import StrategyBookmarksPage from './StrategyBookmarksPage';

/**
 * 收藏课时页契约（jsdom + 真实 store）：
 * - 页头：页标题 + 说明 + 「返回学院」→ /academy
 * - 有收藏：列出条目，点击跳 /academy/lesson/:id
 * - 无收藏：面板空态 + 「去挑几课」出口 → /academy
 * - 移除最后一条后立即回到空态
 */

const PAGE_TITLE = i18n.t('academy.bookmarks.pageTitle', { defaultValue: '我的收藏' });
const EMPTY = i18n.t('academy.bookmarks.empty', {
  defaultValue: '还没有收藏。把想反复读的课时存下来，随时回到这里',
});
const BROWSE = i18n.t('academy.bookmarks.browseLessons', { defaultValue: '去挑几课' });
const BACK = i18n.t('academy.courseView.backToAcademy', { defaultValue: '返回学院' });
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

function mount() {
  return render(
    <MemoryRouter initialEntries={['/academy/bookmarks']}>
      <Routes>
        <Route path="/academy/bookmarks" element={<StrategyBookmarksPage />} />
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

describe('StrategyBookmarksPage', () => {
  it('渲染页标题与返回入口', () => {
    mount();

    expect(screen.getByRole('heading', { level: 2, name: PAGE_TITLE })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: BACK }));
    expect(screen.getByTestId('location').textContent).toBe('/academy');
  });

  it('无收藏：面板空态 + 去挑几课出口回到学院', () => {
    mount();

    expect(screen.getByText(EMPTY)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: BROWSE }));
    expect(screen.getByTestId('location').textContent).toBe('/academy');
  });

  it('有收藏：列出课时并可跳转，空态出口消失', () => {
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    mount();

    expect(screen.queryByText(EMPTY)).toBeNull();
    expect(screen.queryByRole('button', { name: BROWSE })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: lessonTitle('l1-basics') }));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-basics');
  });

  it('移除最后一条收藏后回到空态', () => {
    useAcademyStore.getState().toggleLessonBookmark('l1-basics');
    mount();

    fireEvent.click(screen.getByRole('button', { name: `${REMOVE} · ${lessonTitle('l1-basics')}` }));

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([]);
    expect(screen.getByText(EMPTY)).toBeTruthy();
    expect(screen.getByRole('button', { name: BROWSE })).toBeTruthy();
  });
});
