import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import PotOddsQuizPage from './PotOddsQuizPage';
import i18n from '@/i18n/config';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from '../utils/quizOrder';
import { useProgressStore } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { getTodayString } from '@/shared/utils/spacedRepetition';

/**
 * PotOddsQuizPage 答题主路径（L2 / jsdom）：
 * - 首题渲染 + 选项经 orderQuizOptions 重排（非题库原序）；
 * - 答对 / 答错反馈、五级评级、错题复习链接跳转；
 * - 答题后 ELO（math）+ SRS + Emotion 三处同步；
 * - 连续答错降级提示与每日题量上限守卫。
 */
MotionGlobalConfig.skipAnimations = true;

const mathElo = () => useProgressStore.getState().eloByVariant.standard.math;

function resetProgress(overrides: Partial<typeof DEFAULT_EMOTION_STATE> = {}) {
  useProgressStore.setState({
    activeVariant: 'standard',
    reviewItems: [],
    emotion: { ...DEFAULT_EMOTION_STATE, ...overrides },
    eloByVariant: {
      standard: { ...DEFAULT_ELO, variant: 'standard' },
      'short-deck': { ...DEFAULT_ELO, variant: 'short-deck', gamesPlayed: 0, lastUpdated: 0 },
      'heads-up': { ...DEFAULT_ELO, variant: 'heads-up', gamesPlayed: 0, lastUpdated: 0 },
    },
  });
}

function getButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll('button')).find((b) =>
    b.textContent?.includes(text),
  );
  if (!button) {
    const all = Array.from(container.querySelectorAll('button'))
      .map((b) => JSON.stringify(b.textContent))
      .join(', ');
    throw new Error(`未找到按钮：${text}；现有按钮：[${all}]`);
  }
  return button;
}

/** 当前渲染的选项按钮（选项按钮以 w-full text-left 标识，避免命中返回/下一题） */
function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button')).filter((b) =>
    b.className.includes('w-full text-left'),
  );
}

function renderedOptionTexts(container: HTMLElement): string[] {
  return optionButtons(container).map((b) => b.querySelectorAll('span')[1]?.textContent ?? '');
}

function clickOption(container: HTMLElement, text: string) {
  const option = optionButtons(container).find((b) => b.textContent?.includes(text));
  if (!option) {
    throw new Error(`未找到选项：${text}；现有选项：[${renderedOptionTexts(container).join(' | ')}]`);
  }
  fireEvent.click(option);
}

const originalMatchMedia = window.matchMedia;
function setMobileViewport(matches: boolean) {
  window.matchMedia = ((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={['/pot-odds/quiz']}>
      <PotOddsQuizPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  resetProgress();
  useDebugModeStore.setState({ unlockAll: false });
});

afterEach(() => {
  cleanup();
  resetProgress();
  window.matchMedia = originalMatchMedia;
});

describe('PotOddsQuizPage 初始渲染与选项排序', () => {
  it('首题渲染题库第 1 题：场景、问题、分类与 1 / 19 进度', () => {
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;

    expect(screen.getByText('赔率速算训练')).toBeTruthy();
    expect(screen.getByText(i18n.t(q1.scenario))).toBeTruthy();
    expect(screen.getByText(i18n.t(q1.question))).toBeTruthy();
    expect(screen.getByText('赔率判断')).toBeTruthy();
    expect(container.textContent).toContain('1 / 19');
  });

  it('首题选项顺序等于 orderQuizOptions 的输出（不按题库数据原序渲染）', () => {
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;
    const expected = orderQuizOptions(
      q1,
      undefined,
      q1.options.map((o) => i18n.t(o.text)),
    ).options.map((o) => i18n.t(o.text));

    expect(renderedOptionTexts(container)).toEqual(expected);
  });

  it('答题页「返回」按钮跳转到底池赔率计算器页', () => {
    const { container } = renderQuiz();

    fireEvent.click(getButton(container, '返回'));

    expect(screen.getByTestId('location').textContent).toBe('/pot-odds');
  });

  it('移动端（<768px）把答题反馈渲染进底部对话框 Sheet', async () => {
    setMobileViewport(true);
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;

    clickOption(container, i18n.t(q1.options.find((o) => !o.isCorrect)!.text));

    const dialog = await screen.findByRole('dialog');
    expect(dialog.textContent).toContain('不正确');
    expect(dialog.textContent).toContain('决策错误');
    // 反馈已 Portal 出答题容器，桌面端内联区不再渲染
    expect(container.textContent).not.toContain('不正确');
  });

  it('移动端答题后点击下一题：反馈 Sheet 自动关闭，不遮挡下一题', async () => {
    setMobileViewport(true);
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;

    clickOption(container, i18n.t(q1.options.find((o) => o.isCorrect)!.text));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(getButton(dialog, '下一题'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(container.textContent).toContain('2 / 19');
  });

  it('数值选项题（第 2 题）按数值升序展示，而非题库书写顺序', async () => {
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;
    clickOption(container, i18n.t(q1.options.find((o) => o.isCorrect)!.text));
    await screen.findByText('正确！');
    fireEvent.click(getButton(container, '下一题'));

    const q2 = QUIZ_QUESTIONS[1]!;
    await screen.findByText(i18n.t(q2.question));
    const values = renderedOptionTexts(container).map((text) => {
      const match = /\d+/.exec(text);
      if (!match) throw new Error(`数值选项无数字：${text}`);
      return Number.parseInt(match[0], 10);
    });
    // 题库书写顺序为 8 / 9 / 约 15 / 4，渲染必须按数值升序
    expect(values).toEqual([4, 8, 9, 15]);
  });
});

describe('PotOddsQuizPage 答题反馈与三处同步', () => {
  it('答对：显示正确反馈与最优评级，并同步 ELO(math) / SRS / Emotion', async () => {
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;
    expect(mathElo()).toBe(DEFAULT_ELO.math);

    clickOption(container, i18n.t(q1.options.find((o) => o.isCorrect)!.text));

    expect(await screen.findByText('正确！')).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('最优决策！');
    expect(getButton(container, '下一题')).toBeTruthy();
    expect(optionButtons(container).every((b) => b.disabled)).toBe(true);
    // 答对不展示错题复习区
    expect(screen.queryByText('相关课程')).toBeNull();

    expect(mathElo()).toBeGreaterThan(DEFAULT_ELO.math);
    const reviewItems = useProgressStore.getState().reviewItems;
    expect(reviewItems).toHaveLength(1);
    expect(reviewItems[0]!.id).toBe(`odds:${q1.id}`);
    expect(reviewItems[0]!.label).toBe(q1.scenario);

    const emotion = useProgressStore.getState().emotion;
    expect(emotion.dailyQuestionsAnswered).toBe(1);
    expect(emotion.dailyCorrect).toBe(1);
    expect(emotion.consecutiveWrongCount).toBe(0);
  });

  it('答错：显示正确答案、决策错误评级与可跳转的复习链接', async () => {
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;
    const correctText = i18n.t(q1.options.find((o) => o.isCorrect)!.text);
    const wrongText = i18n.t(q1.options.find((o) => !o.isCorrect)!.text);

    clickOption(container, wrongText);

    expect(await screen.findByText('不正确')).toBeTruthy();
    expect(screen.getByText(`正确答案：${correctText}`)).toBeTruthy();
    expect(screen.getByRole('status').textContent).toContain('决策错误');
    expect(screen.getByText('你的决策')).toBeTruthy();
    expect(screen.getByText('GTO 最优')).toBeTruthy();
    expect(getButton(container, '再做一题')).toBeTruthy();

    expect(mathElo()).toBeLessThan(DEFAULT_ELO.math);
    expect(useProgressStore.getState().reviewItems[0]!.id).toBe(`odds:${q1.id}`);
    expect(useProgressStore.getState().emotion.consecutiveWrongCount).toBe(1);

    // relatedLessonId='l1-basics' 经 RelatedLessonChip 跳转
    fireEvent.click(getButton(container, '相关课程'));
    expect(screen.getByTestId('location').textContent).toBe('/academy/lesson/l1-basics');
  });

  it('连续答错达到 3 次时展示降级提示 banner', async () => {
    resetProgress({
      consecutiveWrongCount: 2,
      dailyQuestionsDate: getTodayString(),
      dailyQuestionsAnswered: 2,
      dailyTotal: 2,
    });
    const { container } = renderQuiz();
    const q1 = QUIZ_QUESTIONS[0]!;

    clickOption(container, i18n.t(q1.options.find((o) => !o.isCorrect)!.text));

    expect(await screen.findByText('不正确')).toBeTruthy();
    expect(
      screen.getByText('检测到连续答错 3 次以上，建议放慢节奏，先复习基础课程再继续训练。'),
    ).toBeTruthy();
  });
});

describe('PotOddsQuizPage Session 止损守卫', () => {
  it('开局已达每日题量上限时渲染守卫页，不进入答题', () => {
    resetProgress({
      dailyQuestionLimit: 10,
      dailyQuestionsAnswered: 10,
      dailyQuestionsDate: getTodayString(),
    });

    const { container } = renderQuiz();

    expect(screen.getByText('今日已达题量上限')).toBeTruthy();
    expect(screen.getByText('返回 Dashboard')).toBeTruthy();
    expect(container.textContent).toContain('10 / 10');
    expect(screen.queryByText('赔率速算训练')).toBeNull();
    expect(optionButtons(container)).toHaveLength(0);
  });
});
