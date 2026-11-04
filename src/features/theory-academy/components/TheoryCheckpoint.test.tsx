/**
 * TheoryCheckpoint 组件测试（jsdom）：
 * 1. 门禁：核心章未读完时不渲染入口（只显示 lockedHint）；
 * 2. 首次检查点：写 checkpoints 记录 + 按题更新 ELO（12 题 → gamesPlayed +12）；
 * 3. 检查点不解锁下一级、不写 completedChapters；
 * 4. 重考不更新 ELO，但错题仍按来源章入 SRS 队列（theory:<questionId>）。
 * 不引入 testing-library，沿用仓库既有 react-dom/client + act 模式。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import { TheoryCheckpoint } from './TheoryCheckpoint';
import { useTheoryStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
import { loadTheoryLevelById } from '../data/levels/loaders';
import { getCoreChaptersOfLevel, findLevelSummaryById } from '../utils/theoryMeta';
import { buildCheckpointQuestions, type TheoryCheckpointQuestion } from '../utils/checkpoint';
import { resolveTheoryQuizQuestion } from '../utils/contentKeys';
import { orderTheoryQuizQuestion } from '../utils/quizOrder';
import type { TheoryQuizQuestion } from '../types';

MotionGlobalConfig.skipAnimations = true;

const LEVEL_ID = 't1';
const t = i18n.t.bind(i18n);

function coreChapterIds(): string[] {
  return getCoreChaptersOfLevel(findLevelSummaryById(LEVEL_ID)!).map((chapter) => chapter.id);
}

/** 组件内的同一条管线：抽题 → t() 解析 → 选项重排 */
async function expectedQuestions(
  attemptNumber: number,
): Promise<(TheoryCheckpointQuestion & { question: TheoryQuizQuestion })[]> {
  const level = await loadTheoryLevelById(LEVEL_ID);
  if (!level) throw new Error('t1 数据加载失败');
  return buildCheckpointQuestions(level, attemptNumber).map((item) => ({
    ...item,
    question: orderTheoryQuizQuestion(resolveTheoryQuizQuestion(t, item.question)),
  }));
}

function buttons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button'));
}

async function clickByText(container: HTMLElement, text: string) {
  const button = buttons(container).find((candidate) => (candidate.textContent ?? '').trim() === text);
  if (!button) {
    throw new Error(
      `未找到按钮「${text}」；现有：${JSON.stringify(buttons(container).map((b) => b.textContent))}`,
    );
  }
  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await Promise.resolve();
  });
}

async function waitForButton(container: HTMLElement, text: string, timeoutMs = 4000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (buttons(container).some((candidate) => (candidate.textContent ?? '').trim() === text)) return;
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
  }
  throw new Error(
    `等待按钮「${text}」超时；现有：${JSON.stringify(buttons(container).map((b) => b.textContent))}`,
  );
}

function seedCompleted(chapterIds: string[]) {
  const progress = useTheoryStore.getState().progress;
  act(() => {
    useTheoryStore.setState({ progress: { ...progress, completedChapters: chapterIds } });
  });
}

function gamesPlayed(): number {
  return useProgressStore.getState().eloByVariant.standard.gamesPlayed;
}

function reviewItemIds(): string[] {
  return useProgressStore.getState().reviewItems.map((item) => item.id);
}

/** 取与正确项不同的首个选项文本（干扰项，用于刻意答错） */
function distractorText(options: readonly string[], correctIndex: number): string {
  const index = options.findIndex((_text, position) => position !== correctIndex);
  return options[index]!;
}

describe('TheoryCheckpoint 门禁', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => useTheoryStore.getState().resetProgress());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    act(() => useTheoryStore.getState().resetProgress());
  });

  it('核心章未读完只显示 lockedHint，不渲染开始按钮', async () => {
    seedCompleted(coreChapterIds().slice(0, 1));
    await act(async () => {
      root.render(
        <MemoryRouter>
          <TheoryCheckpoint levelId={LEVEL_ID} />
        </MemoryRouter>,
      );
    });
    expect(container.textContent).toContain(t('theory.checkpoint.lockedHint'));
    expect(
      buttons(container).some((b) => (b.textContent ?? '').includes(t('theory.checkpoint.entry'))),
    ).toBe(false);
  });
});

describe('TheoryCheckpoint 提交口径', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => useTheoryStore.getState().resetProgress());
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    act(() => useTheoryStore.getState().resetProgress());
  });

  async function renderAndStart() {
    seedCompleted(coreChapterIds());
    await act(async () => {
      root.render(
        <MemoryRouter>
          <TheoryCheckpoint levelId={LEVEL_ID} />
        </MemoryRouter>,
      );
    });
    await waitForButton(container, t('theory.checkpoint.entry'));
    await clickByText(container, t('theory.checkpoint.entry'));
  }

  async function answerAll(
    questions: (TheoryCheckpointQuestion & { question: TheoryQuizQuestion })[],
    wrongMask: boolean[],
  ) {
    for (let index = 0; index < questions.length; index += 1) {
      const item = questions[index]!.question;
      const correctText = item.options[item.correctIndex]!;
      const target =
        wrongMask[index] === true
          ? distractorText(item.options, item.correctIndex)
          : correctText;
      await clickByText(container, target);
      await clickByText(
        container,
        index === questions.length - 1 ? t('theory.checkpoint.finish') : t('theory.quiz.next'),
      );
    }
  }

  it('首次检查：写记录 + 12 题逐题更新 ELO，不变更 completedChapters', async () => {
    await renderAndStart();
    const completedBefore = [...useTheoryStore.getState().progress.completedChapters];
    const eloBefore = gamesPlayed();
    const t3UnlockedBefore = useTheoryStore.getState().isTheoryLevelUnlocked('t3');
    const questions = await expectedQuestions(1);

    await answerAll(
      questions,
      questions.map(() => false),
    );

    const record = useTheoryStore.getState().progress.checkpoints?.t1;
    expect(record?.attempts).toBe(1);
    expect(record?.lastScore).toBe(100);
    expect(record?.questionIds).toHaveLength(questions.length);
    expect(gamesPlayed()).toBe(eloBefore + questions.length);
    expect(useTheoryStore.getState().progress.completedChapters).toEqual(completedBefore);
    expect(useTheoryStore.getState().isTheoryLevelUnlocked('t3')).toBe(t3UnlockedBefore);
    expect(container.textContent).toContain(t('theory.checkpoint.noCertificate'));
  });

  it('重考不更新 ELO，错题按来源章写入 SRS 队列', async () => {
    await renderAndStart();
    const first = await expectedQuestions(1);
    await answerAll(
      first,
      first.map(() => false),
    );
    const eloAfterFirst = gamesPlayed();

    // 结果卡「再检查一次」→ 第二轮（抽题序号 2）前 3 题刻意答错
    await clickByText(container, t('theory.checkpoint.retry'));
    const second = await expectedQuestions(2);
    const wrongMask = second.map((_item, index) => index < 3);
    await answerAll(second, wrongMask);

    expect(gamesPlayed()).toBe(eloAfterFirst);
    const record = useTheoryStore.getState().progress.checkpoints?.t1;
    expect(record?.attempts).toBe(2);
    const wrongIds = second
      .filter((_item, index) => wrongMask[index] === true)
      .map((item) => `theory:${item.question.id}`);
    const queue = reviewItemIds();
    for (const id of wrongIds) expect(queue).toContain(id);
  });
});
