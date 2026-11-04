import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from '@/i18n/config';
import { useAcademyStore } from '../store';
import { LessonBookmarkButton } from './LessonBookmarkButton';

/**
 * 课时书签按钮契约（jsdom + 真实 store）：
 * - 未收藏时 aria-pressed=false、可访问名为「收藏本课」；点击写入 store.bookmarkedLessons
 * - 已收藏时 aria-pressed=true、可访问名为「取消收藏」；点击移除
 * - 状态来自 store：重新挂载的实例仍反映已收藏（持久化读路径）
 * - 同名移除按钮的 aria-label 与面板共用文案（academy.bookmarks.*）
 */

const LESSON_ID = 'l1-basics';
const ADD = i18n.t('academy.bookmarks.add', { defaultValue: '收藏本课' });
const REMOVE = i18n.t('academy.bookmarks.remove', { defaultValue: '取消收藏' });

beforeEach(() => {
  useAcademyStore.getState().resetProgress();
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
});

describe('LessonBookmarkButton', () => {
  it('未收藏时点击收藏并写入 store', () => {
    render(<LessonBookmarkButton lessonId={LESSON_ID} />);

    const button = screen.getByRole('button', { name: ADD });
    expect(button.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(button);

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([LESSON_ID]);
    expect(
      screen.getByRole('button', { name: REMOVE }).getAttribute('aria-pressed'),
    ).toBe('true');
  });

  it('已收藏时点击取消收藏', () => {
    useAcademyStore.getState().toggleLessonBookmark(LESSON_ID);
    render(<LessonBookmarkButton lessonId={LESSON_ID} />);

    fireEvent.click(screen.getByRole('button', { name: REMOVE }));

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([]);
    expect(
      screen.getAllByRole('button').every((el) => el.getAttribute('aria-pressed') === 'false'),
    ).toBe(true);
  });

  it('跨挂载保持状态（store 为唯一事实源）', () => {
    const first = render(<LessonBookmarkButton lessonId={LESSON_ID} />);
    fireEvent.click(screen.getByRole('button', { name: ADD }));
    first.unmount();

    render(<LessonBookmarkButton lessonId={LESSON_ID} />);
    expect(screen.getByRole('button', { name: REMOVE })).toBeTruthy();
  });

  it('不同课时的收藏互不影响', () => {
    render(
      <>
        <LessonBookmarkButton lessonId={LESSON_ID} />
        <LessonBookmarkButton lessonId="l1-bankroll" />
      </>,
    );

    fireEvent.click(screen.getAllByRole('button', { name: ADD })[0]!);

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([LESSON_ID]);
    expect(screen.getAllByRole('button', { name: ADD })).toHaveLength(1);
    expect(screen.getByRole('button', { name: REMOVE })).toBeTruthy();
  });
});
