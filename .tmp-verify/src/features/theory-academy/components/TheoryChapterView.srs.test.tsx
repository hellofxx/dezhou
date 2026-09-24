/**
 * TheoryChapterView 章末错题 → SRS 复习队列入队回归（P0，Wave 3 浏览器实测复现）。
 *
 * 浏览器实测现象：走完「进入章末小测 → 答题（答对 2/5，含 3 道错题）→ 查看结果 →
 * 本章完成」全流程后，localStorage `poker-training-progress` 的 reviewItems 始终为空。
 *
 * 本测试以 jsdom 复现同一路径（真实题库 t1-combinatorics，5 题中刻意答错 3 题），
 * 断言 progress store 的 reviewItems 新增 3 条 `theory:<questionId>`。
 * 不引入 testing-library，直接用 react-dom/client + act 渲染（对齐 TheoryQuiz.test.tsx 模式）。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import TheoryChapterView from './TheoryChapterView';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { findChapterById } from '../utils/theoryProgress';
import { orderTheoryQuizQuestion } from '../utils/quizOrder';
import { resolveTheoryQuizQuestion } from '../utils/contentKeys';
import { theoryReviewItemId } from '../utils/theorySrs';

// jsdom 无真实动画帧，跳过动画保证渲染确定
MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-combinatorics';
const chapter = findChapterById(CHAPTER_ID)!;

/** 复刻组件内的渲染管线：先 t() 解析，再走 quizOrder 重排（用于按文本定位选项） */
function displayedQuestions() {
  const t = i18n.t.bind(i18n);
  return chapter.quiz.map((q) => orderTheoryQuizQuestion(resolveTheoryQuizQuestion(t, q)));
}

function buttons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button'));
}

/** 读取 progress store 落到 localStorage 的 reviewItems id（持久化层验收，与浏览器实测口径一致） */
function persistedReviewItemIds(): string[] {
  const raw = window.localStorage.getItem('poker-training-progress');
  if (!raw) return [];
  const parsed = JSON.parse(raw) as { state?: { reviewItems?: { id: string }[] } };
  return (parsed.state?.reviewItems ?? []).map((r) => r.id);
}

/** AnimatePresence mode="wait" 的换题是异步的：冲刷若干轮定时器直到条件满足 */
async function waitUntil(predicate: () => boolean, hint: string, timeoutMs = 3000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
  throw new Error(`等待超时：${hint}`);
}

async function clickByText(container: HTMLElement, text: string) {
  let btn: HTMLButtonElement | undefined;
  await waitUntil(
    () => {
      btn = buttons(container).find((b) => (b.textContent ?? '').includes(text));
      return !!btn;
    },
    `按钮「${text}」（现有：${JSON.stringify(buttons(container).map((b) => b.textContent))}）`,
  );
  await act(async () => {
    btn!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

/** 按「答对/答错」计划走完整个小测；wrongMask[i] === true 表示第 i 题刻意答错 */
async function runQuiz(container: HTMLElement, wrongMask: boolean[]) {
  const questions = displayedQuestions();
  expect(questions.length).toBe(wrongMask.length);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const wantWrong = wrongMask[i]!;
    const target = wantWrong ? (q.correctIndex + 1) % q.options.length : q.correctIndex;
    await clickByText(container, q.options[target]!);
    await clickByText(container, i < questions.length - 1 ? '下一题' : '查看结果');
  }
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
}

describe('TheoryChapterView 章末错题入 SRS 队列', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // 清空两个 store 的相关状态，保证每个用例从零开始
    useProgressStore.setState({ reviewItems: [] });
    useTheoryStore.getState().resetProgress();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  async function mountView() {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[`/theory/chapter/${CHAPTER_ID}`]}>
          <Routes>
            <Route path="/theory/chapter/:chapterId" element={<TheoryChapterView />} />
          </Routes>
        </MemoryRouter>,
      );
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }

  it('首次完成：5 题答错 3 题 → reviewItems 新增 3 条 theory:<questionId>', async () => {
    expect(useProgressStore.getState().reviewItems).toEqual([]);
    await mountView();

    // 第 1/3/5 题答错，第 2/4 题答对（对应浏览器实测 2/5 正确）
    await clickByText(container, '进入章末小测');
    await runQuiz(container, [true, false, true, false, true]);

    const ids = useProgressStore.getState().reviewItems.map((r) => r.id);
    expect(ids).toEqual([
      theoryReviewItemId('t1-combinatorics-q1'),
      theoryReviewItemId('t1-combinatorics-q3'),
      theoryReviewItemId('t1-combinatorics-q5'),
    ]);
    // 持久化层：localStorage 的 poker-training-progress 必须同步带上这 3 条
    expect(persistedReviewItemIds()).toEqual(ids);
  });

  it('重测（章节已完成）：错题同样入队，不因 completeChapter 的 alreadyCompleted 早退而丢失', async () => {
    await mountView();
    await clickByText(container, '进入章末小测');
    await runQuiz(container, [false, false, false, false, false]);
    // 首次全对 → 队列为空
    expect(useProgressStore.getState().reviewItems).toEqual([]);
    act(() => root.unmount());

    root = createRoot(container);
    await mountView();
    // 已完成章节回访：阅读页提供「重考小测」（zh 文案 theory.chapterView.retryQuiz）
    await clickByText(container, '重新挑战小测');
    await runQuiz(container, [false, true, false, false, false]);

    const ids = useProgressStore.getState().reviewItems.map((r) => r.id);
    expect(ids).toEqual([theoryReviewItemId('t1-combinatorics-q2')]);
    expect(persistedReviewItemIds()).toEqual(ids);
  });
});
