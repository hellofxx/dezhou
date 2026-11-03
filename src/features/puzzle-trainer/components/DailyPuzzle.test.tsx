/**
 * DailyPuzzle 每日谜题容器测试。
 *
 * 契约：
 *  - 顶部展示日期 key（本地时区）/ 同伴完成数 / 题号进度 / 「今日题目固定」提示；
 *  - 每题作答经 progress.recordAnswer 记账；答完 8 题后 markDailyCompleted 落库（幂等键）；
 *  - 完成后提交 store（history 落库）与 trainingEvents 单处 emit，并切结果页；
 *  - 已完成的 dateKey 显示「今日已做」；连续答错显示降级提示；达每日题量上限显示守卫。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const navigateMock = vi.hoisted(() => vi.fn());
const emitMock = vi.hoisted(() => vi.fn());
const progressMock = vi.hoisted(() => ({
  recordAnswer: vi.fn(),
  recordTrainingDay: vi.fn(),
  shouldDownshift: false,
  limit: 0,
  answered: 0,
  date: '',
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('@/features/progress/store', () => ({
  useProgressStore: (selector: (state: unknown) => unknown) =>
    selector({
      recordAnswer: progressMock.recordAnswer,
      recordTrainingDay: progressMock.recordTrainingDay,
      shouldDownshiftDifficulty: () => progressMock.shouldDownshift,
      emotion: {
        dailyQuestionLimit: progressMock.limit,
        dailyQuestionsAnswered: progressMock.answered,
        dailyQuestionsDate: progressMock.date,
      },
    }),
}));

vi.mock('@/shared/stores/trainingEvents', () => ({
  trainingEvents: { emit: emitMock },
}));

import DailyPuzzle from './DailyPuzzle';
import { usePuzzleStore } from '../store';
import { getDailyPuzzles } from '../data/dailyPuzzles';
import { getDailyCompletionCount, getDailyKey } from '../utils/dateSeed';
import { getTodayString } from '@/shared/utils/spacedRepetition';

const FIXED_NOW = new Date(2026, 7, 22, 10, 0, 0, 0);
const TODAY_KEY = '2026-08-22';

describe('DailyPuzzle 每日谜题', () => {
  let container: HTMLDivElement;
  let root: Root;
  // 日期种子题库：引擎与断言同源（固定系统时间 → 同一天题目固定）
  const dailyQuestions = getDailyPuzzles(FIXED_NOW);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    progressMock.shouldDownshift = false;
    progressMock.limit = 0;
    progressMock.answered = 0;
    progressMock.date = getTodayString();
    localStorage.clear();
    usePuzzleStore.getState().reset();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const render = () =>
    act(() => {
      root.render(<DailyPuzzle />);
    });

  const text = () => container.textContent ?? '';

  const click = (element: Element | null | undefined) => {
    if (!element) throw new Error('点击目标不存在');
    act(() => {
      (element as HTMLElement).click();
    });
  };

  /** 按 DOM 场景文本反查当前题（题库顺序固定） */
  const currentQuestion = () => {
    const scenario = container.querySelector('.puzzle-question-scenario')?.textContent ?? '';
    const question = dailyQuestions.find((q) => q.scenario === scenario);
    if (!question) throw new Error(`未匹配到题目：${scenario}`);
    return question;
  };

  const answerCurrent = (correctly: boolean) => {
    const question = currentQuestion();
    const optionId = correctly
      ? question.options.find((o) => o.isCorrect)?.id
      : question.options.find((o) => !o.isCorrect)?.id;
    click(container.querySelector(`[data-testid="action-tile-${optionId}"]`));
  };

  const clickNext = () => {
    const next = [...container.querySelectorAll('button')].find((btn) =>
      ['下一题', '查看结果'].includes(btn.textContent?.trim() ?? '')
    );
    click(next);
  };

  it('顶部展示日期 key、同伴完成数、题号进度与固定题目提示', () => {
    render();
    expect(text()).toContain(TODAY_KEY);
    expect(text()).toContain(String(getDailyCompletionCount(FIXED_NOW)));
    expect(text()).toContain('第 1 / 8 题');
    expect(text()).toContain('今日题目固定，所有人看到的题目相同');
  });

  it('今日未完成时不显示「今日已做」', () => {
    render();
    expect(text()).not.toContain('今日已做');
  });

  it('今日已完成（store 已标记）时显示「今日已做」', () => {
    usePuzzleStore.setState({ dailyCompleted: { [TODAY_KEY]: true } });
    render();
    expect(text()).toContain('今日已做');
  });

  it('答对首题：progress.recordAnswer(true) 记账且进度推进到 13%', () => {
    render();
    answerCurrent(true);
    expect(progressMock.recordAnswer).toHaveBeenCalledWith(true);
    expect(text()).toContain('回答正确');
    expect(text()).toContain('13%');
  });

  it('答错首题：progress.recordAnswer(false) 记账', () => {
    render();
    answerCurrent(false);
    expect(progressMock.recordAnswer).toHaveBeenCalledWith(false);
    expect(text()).toContain('回答错误');
  });

  it('答完 8 题：写入 dailyCompleted 幂等键、提交 store、emit 一次并切结果页', () => {
    render();
    for (let i = 0; i < dailyQuestions.length; i += 1) {
      answerCurrent(true);
      clickNext();
    }

    expect(usePuzzleStore.getState().dailyCompleted[TODAY_KEY]).toBe(true);
    expect(usePuzzleStore.getState().history).toHaveLength(1);
    expect(usePuzzleStore.getState().dailyBest?.bestAccuracy).toBe(1);
    expect(progressMock.recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(text()).toContain('训练完成');
  });

  it('结果页「返回首页」跳转 /puzzle', () => {
    render();
    for (let i = 0; i < dailyQuestions.length; i += 1) {
      answerCurrent(true);
      clickNext();
    }
    const backHome = [...container.querySelectorAll('button')].find((btn) =>
      btn.textContent?.includes('返回首页')
    );
    click(backHome);
    expect(navigateMock).toHaveBeenCalledWith('/puzzle');
  });

  it('连续答错达阈值时显示降级提示', () => {
    progressMock.shouldDownshift = true;
    render();
    expect(text()).toContain('检测到连续答错');
  });

  it('达到每日题量上限时渲染 Session 守卫而非题目', () => {
    progressMock.limit = 1;
    progressMock.answered = 1;
    render();
    expect(text()).toContain('今日已达题量上限');
    expect(container.querySelector('.puzzle-question-scenario')).toBeNull();
  });

  it('退出按钮跳转 /puzzle', () => {
    render();
    const exit = [...container.querySelectorAll('button')].find((btn) =>
      btn.textContent?.includes('退出')
    );
    click(exit);
    expect(navigateMock).toHaveBeenCalledWith('/puzzle');
    expect(getDailyKey(FIXED_NOW)).toBe(TODAY_KEY);
  });
});
