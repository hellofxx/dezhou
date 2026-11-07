/**
 * TheoryChapterView 章末错题 → SRS 复习队列入队回归（P0，Wave 3 浏览器实测复现）。
 *
 * 浏览器实测现象：走完「进入章末小测 → 答题（答对 2/5，含 3 道错题）→ 查看结果 →
 * 本章完成」全流程后，localStorage `poker-training-progress` 的 reviewItems 始终为空。
 *
 * 本测试以 jsdom 复现同一路径（真实题库 t1-combinatorics，8 题中刻意答错 3 题），
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
import { drawQuizQuestions, getQuizDrawSize } from '../utils/quizDraw';
import { resolveTheoryQuizQuestion } from '../utils/contentKeys';
import { theoryReviewItemId } from '../utils/theorySrs';

// jsdom 无真实动画帧，跳过动画保证渲染确定
MotionGlobalConfig.skipAnimations = true;

const CHAPTER_ID = 't1-combinatorics';
const chapter = findChapterById(CHAPTER_ID)!;

/**
 * 复刻组件内的渲染管线：先 t() 解析，再按 Level 抽题（T1–T3 抽 5 题），
 * 最后走 quizOrder 重排（用于按文本定位选项）。attemptNumber 必须与持久化进度一致。
 */
function displayedQuestions(attemptNumber = 1) {
  const t = i18n.t.bind(i18n);
  const resolved = chapter.quiz.map((q) => resolveTheoryQuizQuestion(t, q));
  const drawn = drawQuizQuestions(resolved, {
    chapterId: CHAPTER_ID,
    attemptNumber,
    size: getQuizDrawSize(chapter.level),
  });
  return drawn.map((q) => orderTheoryQuizQuestion(q));
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

/** 按「答对/答错」计划走完整个小测；wrongIds 中的题刻意答错 */
async function runQuiz(container: HTMLElement, wrongIds: string[], attemptNumber = 1) {
  const questions = displayedQuestions(attemptNumber);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]!;
    const wantWrong = wrongIds.includes(q.id);
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

  it('首次完成：8 题池抽 5 题，刻意答错 3 题 → reviewItems 新增 3 条 theory:<questionId>', async () => {
    expect(useProgressStore.getState().reviewItems).toEqual([]);
    await mountView();

    // 抽题后本轮显示 5 题；取本节前 3 题作为错题，避免依赖具体题号顺序
    const drawnIds = displayedQuestions(1).map((q) => q.id);
    expect(drawnIds.length).toBe(5);
    const wrongIds = drawnIds.slice(0, 3);
    // V1 主 CTA 收口：进入小测走 Button 金属件（btn-brass），不再是平铺黄铜底
    const startCta = buttons(container).find((b) => (b.textContent ?? '').includes('进入章末小测'));
    expect(startCta?.className).toContain('btn-brass');
    expect(startCta?.className).not.toContain('bg-[var(--brass-fill)]');
    await clickByText(container, '进入章末小测');
    await runQuiz(container, wrongIds, 1);

    const ids = useProgressStore.getState().reviewItems.map((r) => r.id).toSorted();
    expect(ids).toEqual(wrongIds.map(theoryReviewItemId).toSorted());
    // 持久化层：localStorage 的 poker-training-progress 必须同步带上这 3 条
    expect(persistedReviewItemIds().toSorted()).toEqual(ids);
  });

  it('重测（章节已完成）：错题同样入队，不因 completeChapter 的 alreadyCompleted 早退而丢失', async () => {
    await mountView();
    await clickByText(container, '进入章末小测');
    await runQuiz(container, [], 1);
    // 首次全对 → 队列为空
    expect(useProgressStore.getState().reviewItems).toEqual([]);
    act(() => root.unmount());

    root = createRoot(container);
    await mountView();
    // 已完成章节回访：阅读页提供「重考小测」（zh 文案 theory.chapterView.retryQuiz）
    await clickByText(container, '重新挑战小测');
    // 重考是第 2 次作答：抽题种子与首次不同
    const retryWrongId = displayedQuestions(2)[0]!.id;
    await runQuiz(container, [retryWrongId], 2);

    const ids = useProgressStore.getState().reviewItems.map((r) => r.id);
    expect(ids).toEqual([theoryReviewItemId(retryWrongId)]);
    expect(persistedReviewItemIds()).toEqual(ids);
  });
});
