import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '@/i18n/config';
import CourseView from './CourseView';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import { DEFAULT_LAST_REVIEWED } from '../data/contentOps';

/**
 * 课程页阅读工具契约（jsdom + 真实 store）：
 * - 头部书签按钮：切换写入 store.bookmarkedLessons（不改变课时完成/测验逻辑）
 * - 阅读阶段底部渲染笔记面板；保存走 store.lessonNotes
 * - 进入课后测验后笔记面板不再渲染（阅读辅助只属于 reading 阶段）
 *
 * 门禁/导航/完成态分支由 CourseView.test.tsx 与 CourseView.behavior.test.tsx 覆盖，此处不重复。
 */

const PATH = '/academy/lesson/:lessonId';
const LESSON_ID = 'l1-bankroll';
const ADD = i18n.t('academy.bookmarks.add', { defaultValue: '收藏本课' });
const REMOVE = i18n.t('academy.bookmarks.remove', { defaultValue: '取消收藏' });
const NOTES_TITLE = i18n.t('academy.notes.title', { defaultValue: '课时笔记' });
const SAVE = i18n.t('academy.notes.save', { defaultValue: '保存' });
const QUIZ_TITLE = i18n.t('academy.courseView.quizTitle', { defaultValue: '课后测验' });

function renderAt(lessonId: string) {
  return render(
    <MemoryRouter initialEntries={[`/academy/lesson/${lessonId}`]}>
      <Routes>
        <Route path={PATH} element={<CourseView />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeAll(async () => {
  await loadAcademyLessonsForLevel(1);
});

afterEach(() => {
  cleanup();
  useAcademyStore.getState().resetProgress();
  useDebugModeStore.getState().deactivate();
});

afterAll(() => {
  useAcademyStore.getState().resetProgress();
  useDebugModeStore.getState().deactivate();
});

describe('CourseView：阅读工具（书签 / 笔记）', () => {
  it('头部渲染书签切换并写入 store', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt(LESSON_ID);

    const toggle = await screen.findByRole('button', { name: ADD });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');

    fireEvent.click(toggle);

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([LESSON_ID]);
    expect(screen.getByRole('button', { name: REMOVE })).toBeTruthy();
    // 收藏不触发课时完成
    expect(useAcademyStore.getState().progress.completedLessons).not.toContain(LESSON_ID);
  });

  it('再次点击取消收藏', async () => {
    useAcademyStore.getState().completeBasics();
    useAcademyStore.getState().toggleLessonBookmark(LESSON_ID);
    renderAt(LESSON_ID);

    fireEvent.click(await screen.findByRole('button', { name: REMOVE }));

    expect(useAcademyStore.getState().bookmarkedLessons).toEqual([]);
  });

  it('阅读阶段渲染笔记面板并保存到 store', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt(LESSON_ID);

    const panel = await screen.findByRole('region', { name: NOTES_TITLE });
    expect(panel).toBeTruthy();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '资金管理先定止损线' } });
    fireEvent.click(screen.getByRole('button', { name: SAVE }));

    expect(useAcademyStore.getState().lessonNotes[LESSON_ID]?.text).toBe('资金管理先定止损线');
  });

  it('进入课后测验后笔记面板退出渲染', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt(LESSON_ID);

    await screen.findByRole('region', { name: NOTES_TITLE });
    fireEvent.click(screen.getByText('完成学习'));

    await waitFor(() => expect(screen.getByText(QUIZ_TITLE)).toBeTruthy());
    expect(screen.queryByRole('region', { name: NOTES_TITLE })).toBeNull();
    // 书签按钮在测验阶段仍可用（纯阅读辅助，不随阶段卸载）
    expect(screen.getByRole('button', { name: ADD })).toBeTruthy();
  });
});

describe('CourseView：内容校对与纠错入口（toolbarSlot）', () => {
  it('头部工具栏挂载最近校对日期与内容纠错触发按钮', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt('l1-bankroll');

    expect(await screen.findByTestId('lesson-review-meta')).toBeTruthy();
    expect(
      screen.getByText(i18n.t('academy.contentMeta.lastReviewed', { date: DEFAULT_LAST_REVIEWED })),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: i18n.t('academy.report.title') })).toBeTruthy();
  });
});
