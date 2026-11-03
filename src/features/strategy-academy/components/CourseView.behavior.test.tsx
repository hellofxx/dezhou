import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CourseView from './CourseView';
import { useAcademyStore } from '../store';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import { LEARNING_TRACKS } from '../data/learningTracks';
import { findLessonSummaryById } from '../utils/academyMeta';
import type { LearningTrack } from '../types';

/**
 * 课程页导航与完成态契约（用户可见分支）：
 * - URL hash 直达小节：#uN 在挂载后滚动到对应单元锚点
 * - 移动端阅读进度条：滚动祖先的 scrollTop / (scrollHeight − clientHeight) → 进度条宽度
 * - 完成课后展示「推荐下一步」关联轨道，且不推荐已包含本课的轨道；「下一课」可跳转
 * - 「重学本课」回到阅读视图并清理 URL hash 残留
 */

const PATH = '/academy/lesson/:lessonId';
const scrollIntoView = vi.fn<(arg?: boolean | ScrollIntoViewOptions) => void>();
/** 理论课（无实战无例题）与其课后测验题数（取自课程数据） */
const THEORY_LESSON = 'l1-bankroll';
/** 含实战的课（3 节 + 实战 + 课后测验），其所属轨道的关联轨道里存在已包含本课的轨道 */
const PRACTICE_LESSON = 'l1-basics';
const quizCounts = new Map<string, number>();
const ADVANCE_CTA = /^(进入下一节|进入实战练习|完成学习)/;

beforeAll(async () => {
  Element.prototype.scrollIntoView = scrollIntoView;
  const lessons = await loadAcademyLessonsForLevel(1);
  for (const lesson of lessons) quizCounts.set(lesson.id, lesson.quiz.length);
  expect(quizCounts.get(THEORY_LESSON)).toBeGreaterThan(0);
  expect(quizCounts.get(PRACTICE_LESSON)).toBeGreaterThan(0);
});

afterAll(() => {
  delete (Element.prototype as { scrollIntoView?: unknown }).scrollIntoView;
});

afterEach(() => {
  cleanup();
  scrollIntoView.mockClear();
  useAcademyStore.getState().resetProgress();
  useDebugModeStore.getState().deactivate();
  window.history.replaceState(null, '', '/');
});

function renderAt(lessonId: string, hash = '', container?: HTMLElement) {
  return render(
    <MemoryRouter initialEntries={[`/academy/lesson/${lessonId}${hash}`]}>
      <Routes>
        <Route path={PATH} element={<CourseView />} />
      </Routes>
    </MemoryRouter>,
    container ? { container } : undefined,
  );
}

/** 逐题走完课后测验（每题选项按答题区样式定位，切题等 AnimatePresence 退出完成） */
async function answerQuiz(container: HTMLElement, lessonId: string) {
  const total = quizCounts.get(lessonId) ?? 0;
  expect(screen.getByText('课后测验')).toBeTruthy();

  for (let i = 1; i <= total; i += 1) {
    await waitFor(() => {
      expect(screen.queryAllByText(`第 ${i} / ${total} 题`)).toHaveLength(1);
    });
    const option = container.querySelector<HTMLButtonElement>('button.w-full.text-left');
    if (!option) throw new Error(`第 ${i} 题未渲染选项按钮`);
    fireEvent.click(option);
    fireEvent.click(screen.getByText(i < total ? '下一题' : '查看结果'));
  }

  expect(screen.getByText('课程完成！')).toBeTruthy();
}

/** 理论课：阅读完成 → 课后测验 → 完成页 */
async function finishTheoryLesson(container: HTMLElement, lessonId: string) {
  fireEvent.click(screen.getByText('完成学习'));
  await answerQuiz(container, lessonId);
}

/** 含实战课：逐节推进 → 实战作答 → 课后测验 → 完成页 */
async function finishPracticeLesson(container: HTMLElement, lessonId: string) {
  for (let i = 0; i < 10; i += 1) {
    if (screen.queryByText('返回小节') !== null) break;
    const cta = screen.queryByRole('button', { name: ADVANCE_CTA });
    if (!cta) throw new Error('未找到小节推进按钮');
    fireEvent.click(cta);
  }
  expect(screen.getByText('返回小节')).toBeTruthy();

  for (let i = 0; i < 30; i += 1) {
    if (screen.queryByText('课后测验') !== null) break;
    const option = container.querySelector<HTMLButtonElement>('button.action-mini');
    if (!option) throw new Error(`实战第 ${i + 1} 题未渲染选项`);
    fireEvent.click(option);
    const next = screen.queryByRole('button', { name: /^(下一题|查看成绩)/ });
    if (!next) throw new Error(`实战第 ${i + 1} 题缺少推进按钮`);
    fireEvent.click(next);
  }

  await answerQuiz(container, lessonId);
}

/** 关联轨道按课程数据分组：已包含本课（应被过滤）与未包含（应被推荐） */
function relatedTracksFor(lessonId: string) {
  const current = LEARNING_TRACKS.find((track) => track.lessonIds.includes(lessonId));
  const related = (current?.relatedTrackIds ?? [])
    .map((id) => LEARNING_TRACKS.find((track) => track.id === id))
    .filter((track): track is LearningTrack => track !== undefined);
  return {
    current,
    related,
    containing: related.filter((track) => track.lessonIds.includes(lessonId)),
    others: related.filter((track) => !track.lessonIds.includes(lessonId)),
  };
}

describe('CourseView：hash 直达小节', () => {
  it('URL 带 #u2 时滚动到该小节锚点', async () => {
    useAcademyStore.getState().completeBasics();
    renderAt('l1-basics', '#u2');

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
    const target = scrollIntoView.mock.contexts.at(-1) as Element | undefined;
    expect(target?.id).toBe('u2');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });
});

describe('CourseView：移动端阅读进度条', () => {
  it('滚动祖先滚动时按 scrollTop / (scrollHeight − clientHeight) 更新进度条宽度', () => {
    useAcademyStore.getState().completeBasics();
    // 阅读容器需找到 overflow-y: auto 的滚动祖先（AppLayout main 的等价物）
    const scope = document.createElement('div');
    scope.style.overflowY = 'auto';
    document.body.appendChild(scope);

    renderAt('l1-basics', '', scope);
    const bar = () => scope.querySelector<HTMLElement>('.reading-progress-bar');
    expect(bar()).not.toBeNull();
    expect(bar()!.style.width).toBe('0%');

    Object.defineProperty(scope, 'scrollHeight', { configurable: true, value: 400 });
    Object.defineProperty(scope, 'clientHeight', { configurable: true, value: 200 });
    Object.defineProperty(scope, 'scrollTop', { configurable: true, value: 50 });
    fireEvent.scroll(scope);

    // (50 / (400 − 200)) × 100 = 25%
    expect(bar()!.style.width).toBe('25%');
    scope.remove();
  });
});

describe('CourseView：完成页推荐与跳转', () => {
  it('完成课后展示关联轨道并可跳转下一课', async () => {
    useAcademyStore.getState().completeBasics();
    const { container } = renderAt(THEORY_LESSON);
    await finishTheoryLesson(container, THEORY_LESSON);

    const { current, others } = relatedTracksFor(THEORY_LESSON);
    expect(current?.id).toBe('track-beginner');
    expect(others.length).toBeGreaterThan(0);
    expect(screen.getByText('推荐下一步')).toBeTruthy();
    for (const track of others) {
      expect(screen.getByText(track.name)).toBeTruthy();
    }

    // 课后测验成绩经 completeCourse 落库（完成状态可被首页/轨道读到）
    expect(useAcademyStore.getState().progress.completedLessons).toContain(THEORY_LESSON);

    const nextTitle = findLessonSummaryById('l1-leaks')?.title;
    fireEvent.click(screen.getByText(new RegExp(`^下一课：${nextTitle ?? ''}`)));

    await waitFor(() => expect(screen.getByText(nextTitle!)).toBeTruthy());
    expect(screen.queryByText('课程完成！')).toBeNull();
  });

  it('不推荐已包含本课的关联轨道（l1-basics 与「理论到实践」）', async () => {
    useAcademyStore.getState().completeBasics();
    const { container } = renderAt(PRACTICE_LESSON);
    await finishPracticeLesson(container, PRACTICE_LESSON);

    const { current, containing, others } = relatedTracksFor(PRACTICE_LESSON);
    expect(current?.id).toBe('track-beginner');
    // 数据前提：确实存在一条关联轨道已包含本课，否则本用例退化为空断言
    expect(containing.length).toBeGreaterThan(0);
    expect(screen.getByText('推荐下一步')).toBeTruthy();
    for (const track of containing) {
      expect(screen.queryByText(track.name)).toBeNull();
    }
    for (const track of others) {
      expect(screen.getByText(track.name)).toBeTruthy();
    }

    // 实战成绩回写 academy store（handlePracticeComplete → recordPracticeScore）
    const recorded = useAcademyStore.getState().practiceResults.at(-1);
    expect(recorded?.lessonId).toBe(PRACTICE_LESSON);

    // 「重新实战」直达实战视图（restart('practice') 经 initialView 传入 LessonContent）
    fireEvent.click(screen.getByText('重新实战'));
    expect(screen.getByText('返回小节')).toBeTruthy();
    expect(screen.queryByText('课程完成！')).toBeNull();
  });

  it('「重学本课」回到阅读视图并清理 URL hash 残留', async () => {
    useAcademyStore.getState().completeBasics();
    const { container } = renderAt(THEORY_LESSON);
    await finishTheoryLesson(container, THEORY_LESSON);

    window.history.replaceState(null, '', '#u3');
    expect(window.location.hash).toBe('#u3');

    fireEvent.click(screen.getByText('重学本课'));

    expect(screen.getByText('课程路线图')).toBeTruthy();
    expect(screen.queryByText('课程完成！')).toBeNull();
    expect(window.location.hash).toBe('');
  });
});
