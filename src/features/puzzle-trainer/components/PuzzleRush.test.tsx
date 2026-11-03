/**
 * PuzzleRush 限时冲刺容器测试。
 *
 * 契约：
 *  - ?duration=3|5 决定时长与标题；倒计时 mm:ss、剩余命数 3、题号与实时分数展示；
 *  - 作答经 progress.recordAnswer 记账；答错扣命；下一题推进；
 *  - 剩余时间 < 30 秒进入紧急态；时间到 / 命耗尽结束会话（结果页 + 提交 store + 单处 emit）；
 *  - 降级提示、每日题量上限守卫、退出跳转。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

const navigateMock = vi.hoisted(() => vi.fn());
const emitMock = vi.hoisted(() => vi.fn());
const searchParamsMock = vi.hoisted(() => ({ duration: '' }));
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
  useSearchParams: () => [new URLSearchParams(`duration=${searchParamsMock.duration}`), vi.fn()],
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

import PuzzleRush from './PuzzleRush';
import { usePuzzleStore } from '../store';
import { getRushQuestions } from '../data/rushQuestions';
import { getTodayString } from '@/shared/utils/spacedRepetition';

const FIXED_NOW = new Date(2026, 7, 22, 10, 0, 0, 0);
const THREE_MINUTES = 180_000;

describe('PuzzleRush 限时冲刺', () => {
  let container: HTMLDivElement;
  let root: Root;
  const rushQuestions = getRushQuestions(30, FIXED_NOW);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
    vi.clearAllMocks();
    searchParamsMock.duration = '';
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
      root.render(<PuzzleRush />);
    });

  const text = () => container.textContent ?? '';

  const click = (element: Element | null | undefined) => {
    if (!element) throw new Error('点击目标不存在');
    act(() => {
      (element as HTMLElement).click();
    });
  };

  const currentQuestion = () => {
    const scenario = container.querySelector('.puzzle-question-scenario')?.textContent ?? '';
    const question = rushQuestions.find((q) => q.scenario === scenario);
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

  const clock = (): HTMLElement | undefined =>
    [...container.querySelectorAll<HTMLElement>('div')].find((node) =>
      /^\d{2}:\d{2}$/.test(node.textContent?.trim() ?? '')
    );

  const filledLives = () => container.querySelectorAll('svg[class*="fill-[var(--clay)]"]').length;

  it('默认为 3 分钟：标题、03:00 倒计时、3 条命与首题渲染', () => {
    render();
    expect(text()).toContain('3 分钟限时冲刺');
    expect(clock()?.textContent?.trim()).toBe('03:00');
    expect(filledLives()).toBe(3);
    expect(text()).toContain('第 1 / 30 题');
    expect(container.querySelector('.puzzle-question-scenario')?.textContent).toBe(
      rushQuestions[0]?.scenario
    );
  });

  it('?duration=5 切换为 5 分钟模式', () => {
    searchParamsMock.duration = '5';
    render();
    expect(text()).toContain('5 分钟限时冲刺');
    expect(clock()?.textContent?.trim()).toBe('05:00');
  });

  it('答对记分并显示二元反馈；答错扣一条命', () => {
    render();
    answerCurrent(true);
    expect(progressMock.recordAnswer).toHaveBeenCalledWith(true);
    expect(text()).toContain('回答正确');
    expect(text()).toMatch(/答对[:：]\s*1/);

    clickNext();
    answerCurrent(false);
    expect(progressMock.recordAnswer).toHaveBeenCalledWith(false);
    expect(text()).toMatch(/答错[:：]\s*1/);
    expect(filledLives()).toBe(2);
  });

  it('点击下一题推进到下一题场景', () => {
    render();
    answerCurrent(true);
    clickNext();
    expect(container.querySelector('.puzzle-question-scenario')?.textContent).toBe(
      rushQuestions[1]?.scenario
    );
    expect(text()).toContain('第 2 / 30 题');
  });

  it('剩余不足 30 秒时倒计时进入紧急态', () => {
    render();
    act(() => {
      vi.advanceTimersByTime(150_250);
    });
    expect(clock()?.textContent?.trim()).toBe('00:29');
    expect(clock()?.className).toContain('clay');
  });

  it('时间到结束会话：结果页 + rushBest 落库 + recordTrainingDay/emit 各一次', () => {
    render();
    act(() => {
      vi.advanceTimersByTime(THREE_MINUTES + 250);
    });

    expect(text()).toContain('冲刺结束');
    expect(progressMock.recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(emitMock).toHaveBeenCalledTimes(1);
    expect(usePuzzleStore.getState().history).toHaveLength(1);
    // 未作答 → 分数仅剩余命 3 × 200
    expect(usePuzzleStore.getState().rushBest?.bestScore).toBe(600);
  });

  it('命耗尽判 failed 并结束会话', () => {
    render();
    for (let i = 0; i < 3; i += 1) {
      answerCurrent(false);
      clickNext();
    }
    expect(text()).toContain('冲刺结束');
    expect(filledLives()).toBe(0);
    expect(usePuzzleStore.getState().rushBest?.bestScore).toBe(0);
  });

  it('连续答错达阈值时显示降级提示', () => {
    progressMock.shouldDownshift = true;
    render();
    expect(text()).toContain('检测到连续答错');
  });

  it('达到每日题量上限时渲染 Session 守卫', () => {
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
  });
});
