import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseView from './CourseView';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import {
  loadAcademyLessonsForLesson,
  loadAcademyLessonsForLevel,
} from '../data/lessons/loaders';
import { findLevelSummaryByLessonId, findLessonSummaryById } from '../utils/academyMeta';

/**
 * 课程页双层门禁与内容路由契约：
 * - URL 直达未解锁课程 → 锁定提示（Level 门禁，防绕过）
 * - 未知课程 → 「课程未找到」
 * - 已解锁 → 标题 / 课程路线图 / 课后测验入口
 * - 本土课 mental-tilt 例外可随时访问（DownswingAlert 目标课程）
 * - 调试解锁旁路 Level 门禁
 * - Drill 课程经 DrillLessonRouter 懒加载对应 Drill
 */

const PATH = '/academy/lesson/:lessonId';

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
  await Promise.all([
    loadAcademyLessonsForLevel(1),
    loadAcademyLessonsForLevel(2),
    loadAcademyLessonsForLesson('local-mental-tilt-recognition'),
  ]);
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

describe('CourseView：未知课程与门禁', () => {
  it('未知课程 id 显示课程未找到', async () => {
    renderAt('not-a-real-lesson');
    await waitFor(() => expect(screen.getByText('课程未找到')).toBeTruthy());
  });

  it('未完成前置的课程显示锁定提示（URL 直达不可绕过）', async () => {
    const lesson = findLessonSummaryById('l2-raise-sizing');
    expect(lesson).toBeDefined();
    const levelEntry = findLevelSummaryByLessonId('l2-raise-sizing');
    expect(levelEntry?.id).toBe('l2');
    expect(useAcademyStore.getState().isLevelEntryUnlocked('l2')).toBe(false);

    renderAt('l2-raise-sizing');
    await waitFor(() => expect(screen.getByText('该课程尚未解锁')).toBeTruthy());
    expect(screen.getByText('返回学院')).toBeTruthy();
  });

  it('调试解锁激活时 Level 门禁放行', async () => {
    useDebugModeStore.getState().activateWithCode('1337');
    renderAt('l2-raise-sizing');
    await waitFor(() =>
      expect(screen.queryByText('该课程尚未解锁')).toBeNull(),
    );
    await waitFor(() => expect(screen.getByText('加注大小')).toBeTruthy());
  });
});

describe('CourseView：已解锁课程渲染', () => {
  it('完成基础入门后 L1 课程渲染标题、进度与课程路线图', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt('l1-basics');

    await waitFor(() => expect(screen.getByText('德州扑克规则与牌型')).toBeTruthy());
    expect(screen.getByText('返回学院')).toBeTruthy();
    expect(screen.getByText('课程路线图')).toBeTruthy();
    // 进入课程时 startLesson 记录当前课程
    expect(useAcademyStore.getState().progress.currentLesson).toBe('l1-basics');
  });

  it('mental-tilt 本土课无前置依赖，未完成基础入门也可访问', async () => {
    const summary = findLessonSummaryById('local-mental-tilt-recognition');
    expect(summary).toBeDefined();

    renderAt('local-mental-tilt-recognition');
    await waitFor(() =>
      expect(screen.getAllByText(summary!.title).length).toBeGreaterThan(0),
    );
    expect(screen.queryByText('该课程尚未解锁')).toBeNull();
  });

  it('Drill 类型课程路由到对应 Drill 组件', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt('drill-hand-ranking');

    await waitFor(() => expect(screen.getByText('牌力排名闪电战')).toBeTruthy());
    // 懒加载完成前先渲染 Suspense fallback，完成后出现 Drill 退出按钮
    await waitFor(() => expect(screen.getByText('退出')).toBeTruthy(), { timeout: 5000 });
    expect(screen.getByText('Drill')).toBeTruthy();
  });
});
