/**
 * LevelCheckpointPage 组件测试（jsdom）。
 *
 * 锁定契约（PRD §5.16.13 / P2）：
 * 1. 门禁：本级核心课未全部完成 → 只显示锁定提示与进度，不渲染开始入口（URL 直达不可绕过）；
 * 2. 12 题混合测评：首轮逐题按来源课 ELO 维度更新 ELO + recordAnswer；
 * 3. 只写 checkpoints[level]：不发证、不解锁下一级、不写 completedLessons / lessonAttempts；
 * 4. 重考不更新 ELO，但错题仍按来源课写入 SRS 队列（checkpoint:l<n>:<qid>，route 回链来源课）。
 */
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import i18n from '@/i18n/config';
import LevelCheckpointPage from './LevelCheckpointPage';
import { useAcademyStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
import { loadAcademyLessonsForLevel } from '../data/lessons/loaders';
import { getLevelSummariesByNumber } from '../utils/academyMeta';
import { resolveQuizQuestion } from '../utils/contentKeys';
import {
  buildCheckpointQuestions,
  CHECKPOINT_QUESTION_COUNT,
  type CheckpointQuestion,
} from '../utils/checkpoint';

MotionGlobalConfig.skipAnimations = true;

const t = i18n.t.bind(i18n);
/** 会话种子 = Math.floor(0.5 * 2^31)（下方 Math.random 固定为 0.5） */
const SEED = Math.floor(0.5 * 2 ** 31);
const PATH = '/academy/checkpoint/:level';

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAt(level: string) {
  return render(
    <MemoryRouter initialEntries={[`/academy/checkpoint/${level}`]}>
      <Routes>
        <Route path={PATH} element={<LevelCheckpointPage />} />
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 选项按钮（带 A-D 字母前缀） */
function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return [...container.querySelectorAll('button')].filter((button) =>
    /^[A-D]/.test(button.textContent?.trim() ?? ''),
  );
}

/** 按 store 口径把某 level 数字的全部课程标记完成 */
function completeLevel(level: number) {
  const store = useAcademyStore.getState();
  for (const entry of getLevelSummariesByNumber(level)) {
    for (const lesson of entry.lessons) store.completeLesson(lesson.id);
  }
}

/** 组件内同一条管线：解析 i18n → 会话种子抽题 → 选项重排 */
async function expectedQuestions(): Promise<CheckpointQuestion[]> {
  const lessons = await loadAcademyLessonsForLevel(1);
  return buildCheckpointQuestions(
    lessons.map((lesson) => ({
      ...lesson,
      quiz: lesson.quiz.map((question) => resolveQuizQuestion(t, question)),
    })),
    1,
    SEED,
  );
}

/** 逐题作答：wrongMask[i] 为 true 时选一个干扰项 */
function answerRound(
  container: HTMLElement,
  questions: readonly CheckpointQuestion[],
  wrongMask: readonly boolean[],
) {
  questions.forEach((item, index) => {
    const options = optionButtons(container);
    expect(options.length).toBeGreaterThan(1);
    const correctIndex = item.question.correctIndex;
    const chosen = wrongMask[index] === true ? (correctIndex + 1) % options.length : correctIndex;
    fireEvent.click(options[chosen]!);
    fireEvent.click(
      screen.getByText(index === questions.length - 1 ? '查看结果' : '下一题'),
    );
  });
}

function gamesPlayed(): number {
  return useProgressStore.getState().eloByVariant.standard.gamesPlayed;
}

function answeredTotal(): number {
  return useProgressStore.getState().emotion.dailyTotal;
}

function reviewItems() {
  return useProgressStore.getState().reviewItems;
}

async function startCheckpoint() {
  const view = renderAt('1');
  await waitFor(() => expect(screen.getByText('开始检查点')).toBeTruthy());
  fireEvent.click(screen.getByText('开始检查点'));
  return view;
}

beforeAll(async () => {
  await loadAcademyLessonsForLevel(1);
});

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  useAcademyStore.getState().resetProgress();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  useAcademyStore.getState().resetProgress();
});

describe('LevelCheckpointPage 门禁', () => {
  it('未知 Level 显示「级别未找到」', async () => {
    renderAt('99');
    await waitFor(() => expect(screen.getByText('级别未找到')).toBeTruthy());
    expect(screen.queryByText('开始检查点')).toBeNull();
  });

  it('本级课程未全部完成：显示锁定提示与进度，无开始入口', async () => {
    const { container } = renderAt('1');
    await waitFor(() =>
      expect(container.textContent).toContain('需完成本级别全部课程才能开始检查点'),
    );
    expect(container.textContent).toContain('当前进度：0/');
    expect(screen.queryByText('开始检查点')).toBeNull();
    expect(optionButtons(container)).toHaveLength(0);
  });

  it('本级课程全部完成后可进入检查点入口', async () => {
    completeLevel(1);
    const { container } = renderAt('1');
    await waitFor(() => expect(screen.getByText('开始检查点')).toBeTruthy());
    expect(container.textContent).toContain(`题目数量：${CHECKPOINT_QUESTION_COUNT} 题`);
    expect(container.textContent).toContain('形成性自查：不发证书、不解锁下一级');
  });
});

describe('LevelCheckpointPage 首轮提交', () => {
  it('12 题混合测评：写 checkpoints、逐题更新 ELO，不解锁与不发证', async () => {
    completeLevel(1);
    const completedBefore = [...useAcademyStore.getState().progress.completedLessons];
    const eloBefore = gamesPlayed();
    const answeredBefore = answeredTotal();

    const { container } = await startCheckpoint();
    expect(container.textContent).toContain(`第 1 / ${CHECKPOINT_QUESTION_COUNT} 题`);

    const questions = await expectedQuestions();
    answerRound(container, questions, questions.map(() => false));

    const record = useAcademyStore.getState().checkpoints[1];
    expect(record?.attempts).toBe(1);
    expect(record?.lastScore).toBe(100);
    expect(record?.firstScore).toBe(100);
    expect(record?.questionIds).toHaveLength(CHECKPOINT_QUESTION_COUNT);
    expect(new Set(record?.questionIds).size).toBe(CHECKPOINT_QUESTION_COUNT);

    // 首轮逐题：ELO 局数 +12，情绪计数器 +12
    expect(gamesPlayed()).toBe(eloBefore + CHECKPOINT_QUESTION_COUNT);
    expect(answeredTotal()).toBe(answeredBefore + CHECKPOINT_QUESTION_COUNT);

    // 无解锁 / 无认证 / 不写课时完成态与课后尝试
    const state = useAcademyStore.getState();
    expect(state.progress.completedLessons).toEqual(completedBefore);
    expect(state.certifications).toEqual({});
    expect(state.isCertified(1)).toBe(false);
    expect(state.getCertificationState(1).status).toBe('available');
    expect(state.lessonAttempts).toEqual({});
    expect(state.isLevelLessonsCompleted(2)).toBe(false);
    expect(state.isLevelEntryUnlocked('l3')).toBe(false);

    // 结果卡：形成性口径 + 与认证区分
    expect(container.textContent).toContain('形成性自查：不发证书、不解锁下一级');
    expect(container.textContent).toContain('首次成绩 100% · 最佳成绩 100%');
    expect(container.textContent).toContain('本次按来源课时逐题计入 ELO');
  });
});

describe('LevelCheckpointPage 重考', () => {
  it('重考不更新 ELO，保留首轮成绩为首次值，错题仍入 SRS 并回链来源课', async () => {
    completeLevel(1);
    const answeredBefore = answeredTotal();
    const reviewBefore = new Set(reviewItems().map((item) => item.id));

    const { container } = await startCheckpoint();
    const questions = await expectedQuestions();
    // 首轮：奇数题刻意答错（6 对 6 错 → 50%）
    answerRound(container, questions, questions.map((_item, index) => index % 2 === 1));
    expect(useAcademyStore.getState().checkpoints[1]?.lastScore).toBe(50);
    const eloAfterFirst = gamesPlayed();

    // 重考（无冷却）：全对。种子固定 → 期望题目与首轮一致
    fireEvent.click(screen.getByText('再检查一次'));
    expect(container.textContent).toContain(`第 1 / ${CHECKPOINT_QUESTION_COUNT} 题`);
    answerRound(container, questions, questions.map(() => false));

    expect(gamesPlayed()).toBe(eloAfterFirst);
    expect(answeredTotal()).toBe(answeredBefore + CHECKPOINT_QUESTION_COUNT);

    const record = useAcademyStore.getState().checkpoints[1];
    expect(record?.attempts).toBe(2);
    expect(record?.firstScore).toBe(50);
    expect(record?.bestScore).toBe(100);
    expect(record?.lastScore).toBe(100);
    expect(container.textContent).toContain('首次成绩 50% · 最佳成绩 100%');
    expect(container.textContent).toContain('重考不计入 ELO，仅更新成绩与复习队列');

    // 首轮错题入 SRS（新出现、id 命名空间按 Level 隔离、route 回链来源课）
    const expectedWrong = questions.filter((_item, index) => index % 2 === 1);
    const added = reviewItems().filter((item) => !reviewBefore.has(item.id));
    expect(added.length).toBe(expectedWrong.length);
    for (const item of expectedWrong) {
      const entry = added.find((candidate) => candidate.id === `checkpoint:l1:${item.question.id}`);
      expect(entry, `缺少复习项 ${item.question.id}`).toBeTruthy();
      expect(entry!.metadata?.route).toBe(`/academy/lesson/${item.lessonId}`);
    }
  });
});
