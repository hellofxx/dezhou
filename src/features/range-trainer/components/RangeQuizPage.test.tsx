/**
 * RangeQuizPage（测验页编排）组件测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 初始渲染配置阶段（QuizConfig），不渲染答题卡
 *  - 点击「开始训练」进入训练阶段（TrainingSession，显示第 1 / 总题数）
 *  - 完成会话 → 结算阶段（SessionResult）、trainingEvents 发布一次 range-trainer/quiz、
 *    以及 recordTrainingDay 计入当日连续训练
 *  - 结算页「再练一次」重新开局（status running、题目重建）；「返回首页」重置会话并跳转
 *  - 每日题量已达上限时渲染 SessionLimitGuard（而非配置页）
 *
 * 夹具说明：为保证确定性与运行时长，会话启动后把题目裁剪为 1 题（仅替换 store 数据，
 * 不改被测逻辑），再以「答对 + 推进反馈定时器」驱动完成分支。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import { DEFAULT_ELO } from '@/shared/types/elo';
import type { EloRating } from '@/shared/types/elo';
import type { PokerVariant } from '@/shared/types/elo';
import type { TrainingRecord } from '@/shared/types/training';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import { useProgressStore, DEFAULT_STREAK_STATE } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useRangeTrainerStore, INITIAL_QUIZ_STATE } from '../store';
import { PRESET_RANGES, ADVANCED_PRESET_RANGES } from '../constants';
import RangeQuizPage from './RangeQuizPage';

// jsdom 无真实动画帧，跳过 framer-motion 动画
MotionGlobalConfig.skipAnimations = true;

const rangeStore = () => useRangeTrainerStore.getState();
const progressStore = () => useProgressStore.getState();

const elo = (variant: PokerVariant): EloRating => ({ ...DEFAULT_ELO, variant });

function resetStores(): void {
  useRangeTrainerStore.setState({
    gameVariant: 'standard',
    playerCount: 6,
    presets: [...PRESET_RANGES, ...ADVANCED_PRESET_RANGES],
    quizState: { ...INITIAL_QUIZ_STATE, handWeights: {} },
  });
  useProgressStore.setState({
    activeVariant: 'standard',
    eloByVariant: {
      standard: elo('standard'),
      'short-deck': elo('short-deck'),
      'heads-up': elo('heads-up'),
    },
    emotion: { ...DEFAULT_EMOTION_STATE },
    streak: { ...DEFAULT_STREAK_STATE },
    reviewItems: [],
  });
  useDebugModeStore.setState({ unlockAll: false });
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/range-trainer/quiz']}>
      <RangeQuizPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((btn) =>
    btn.textContent?.includes(text),
  );
  if (!button) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((btn) => JSON.stringify(btn.textContent?.trim()))
      .join(', ');
    throw new Error(`未找到按钮：${text}；现有按钮：[${all}]`);
  }
  return button;
}

/** 把当前会话裁剪为单题，避免 20 题长跑（仅替换 store 夹具数据） */
function trimToSingleQuestion(): void {
  act(() => {
    const qs = rangeStore().quizState;
    useRangeTrainerStore.setState({
      quizState: {
        ...qs,
        questions: qs.questions.slice(0, 1),
        answers: [null],
        isCorrect: [false],
        timePerQuestion: [0],
        totalQuestions: 1,
        currentIndex: 0,
      },
    });
  });
}

/** 答对当前题并推进反馈自动跳题定时器（1s），使会话走完结算 */
function answerCurrentCorrectly(container: HTMLElement): void {
  const qs = rangeStore().quizState;
  const question = qs.questions[qs.currentIndex]!;
  const label =
    question.correctAction === 'fold' ? 'Fold' : question.correctAction === 'call' ? 'Call' : 'Raise';
  fireEvent.click(findButton(container, label));
  act(() => {
    vi.advanceTimersByTime(1100);
  });
  // 结算链路（completed → onComplete → 结果页）需再刷一帧 effect
  act(() => {});
}

let emitted: TrainingRecord[] = [];
let unsubscribe: () => void = () => {};

beforeEach(() => {
  vi.useFakeTimers();
  resetStores();
  emitted = [];
  unsubscribe = trainingEvents.subscribe((record) => emitted.push(record));
});

afterEach(() => {
  unsubscribe();
  cleanup();
  vi.useRealTimers();
  resetStores();
});

describe('RangeQuizPage 配置阶段', () => {
  it('初始渲染配置卡而非答题区', () => {
    const { container } = renderPage();

    expect(screen.getByText('范围测验')).toBeTruthy();
    expect(findButton(container, '开始训练')).toBeTruthy();
    expect(container.textContent).not.toContain('第 1 / 20 题');
    expect(rangeStore().quizState.status).toBe('idle');
  });

  it('点击「开始训练」进入训练阶段并显示题号', () => {
    const { container } = renderPage();

    fireEvent.click(findButton(container, '开始训练'));

    expect(rangeStore().quizState.status).toBe('running');
    expect(container.textContent).toContain('第 1 / 20 题');
    expect(screen.queryByText('范围测验')).toBeNull();
  });

  it('每日题量已达上限时渲染止损守卫', () => {
    useProgressStore.setState({
      emotion: {
        ...DEFAULT_EMOTION_STATE,
        dailyQuestionLimit: 4,
        dailyQuestionsAnswered: 4,
        dailyQuestionsDate: getTodayString(),
      },
    });

    const { container } = renderPage();

    expect(screen.getByText('今日已达题量上限')).toBeTruthy();
    expect(container.textContent).not.toContain('范围测验');
    expect(rangeStore().quizState.status).toBe('idle');
  });
});

describe('RangeQuizPage 完成与结算', () => {
  it('答完最后一题进入结算页，发布 trainingEvents 并计入当日连续训练', () => {
    const { container } = renderPage();
    fireEvent.click(findButton(container, '开始训练'));
    trimToSingleQuestion();

    answerCurrentCorrectly(container);

    expect(container.textContent).toContain('训练完成！');
    expect(emitted).toHaveLength(1);
    expect(emitted[0]!.module).toBe('range-trainer');
    expect(emitted[0]!.mode).toBe('quiz');
    expect(emitted[0]!.result.totalQuestions).toBe(1);
    expect(emitted[0]!.result.correctAnswers).toBe(1);
    expect(progressStore().streak.currentStreak).toBe(1);
    expect(progressStore().streak.lastTrainingDate).toBe(getTodayString());
  });

  it('结算页「再练一次」重新开局（不回到配置页）', () => {
    const { container } = renderPage();
    fireEvent.click(findButton(container, '开始训练'));
    trimToSingleQuestion();
    answerCurrentCorrectly(container);

    fireEvent.click(findButton(container, '再练一次'));

    expect(rangeStore().quizState.status).toBe('running');
    expect(rangeStore().quizState.questions).toHaveLength(20);
    expect(container.textContent).toContain('第 1 / 20 题');
    expect(container.textContent).not.toContain('训练完成！');
  });

  it('重开时该组合已无题库（startQuiz 返回 false）→ 回到配置页', () => {
    const { container } = renderPage();
    fireEvent.click(findButton(container, '开始训练'));
    trimToSingleQuestion();
    answerCurrentCorrectly(container);

    // 清空预置范围：重开时 generateQuestions 返回 0 题
    act(() => {
      useRangeTrainerStore.setState({ presets: [] });
    });
    fireEvent.click(findButton(container, '再练一次'));

    expect(rangeStore().quizState.status).toBe('idle');
    expect(container.textContent).toContain('范围测验');
    expect(container.textContent).not.toContain('训练完成！');
  });

  it('结算页「返回首页」重置会话并跳转 /range-trainer', () => {
    const { container } = renderPage();
    fireEvent.click(findButton(container, '开始训练'));
    trimToSingleQuestion();
    answerCurrentCorrectly(container);

    fireEvent.click(findButton(container, '返回首页'));

    expect(screen.getByTestId('location').textContent).toBe('/range-trainer');
    expect(rangeStore().quizState.status).toBe('idle');
    expect(rangeStore().quizState.questions).toHaveLength(0);
  });
});

describe('RangeQuizPage 中途退出', () => {
  it('暂停遮罩内「退出训练」回到配置页，不入账、不发布事件', () => {
    const { container } = renderPage();
    fireEvent.click(findButton(container, '开始训练'));

    // 顶部暂停按钮（lucide-pause 图标）打开暂停遮罩
    const pauseIcon = container.querySelector('button svg.lucide-pause');
    expect(pauseIcon).not.toBeNull();
    fireEvent.click(pauseIcon!.closest('button')!);
    expect(rangeStore().quizState.status).toBe('paused');

    fireEvent.click(findButton(container, '退出训练'));

    expect(rangeStore().quizState.status).toBe('idle');
    expect(container.textContent).toContain('范围测验');
    expect(emitted).toHaveLength(0);
    expect(progressStore().streak.currentStreak).toBe(0);
  });
});
