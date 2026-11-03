import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import PotOddsQuizPage from './PotOddsQuizPage';
import i18n from '@/i18n/config';
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { getEasyOddsQuestion } from '../hooks/useOddsCalculation';
import { useProgressStore } from '@/features/progress/store';
import { DEFAULT_EMOTION_STATE } from '@/features/progress/types';
import { DEFAULT_ELO } from '@/shared/types/elo';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingRecord } from '@/shared/types/training';
import type { PotOddsQuizQuestion } from '../types';

/**
 * PotOddsQuizPage 完整会话（L2 / jsdom）：
 * 19 题（末题被替换为简单题）全对 → 结算面板 + trainingEvents.emit + recordTrainingDay；
 * 末题答错 → 追加固定 id 的补救题（total 变 20），补救答对后以最后一题答对收尾。
 * 同时锁定"再来一轮"重置与"返回计算器"跳转。
 */
MotionGlobalConfig.skipAnimations = true;

const EASY = getEasyOddsQuestion();
const originalRecordTrainingDay = useProgressStore.getState().recordTrainingDay;
let emitted: TrainingRecord[] = [];
let unsubscribe: () => void = () => undefined;

function resetProgress() {
  useProgressStore.setState({
    activeVariant: 'standard',
    reviewItems: [],
    emotion: { ...DEFAULT_EMOTION_STATE },
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
  if (!button) throw new Error(`未找到按钮：${text}`);
  return button;
}

function optionButtons(container: HTMLElement): HTMLButtonElement[] {
  return Array.from(container.querySelectorAll('button')).filter((b) =>
    b.className.includes('w-full text-left'),
  );
}

function clickOption(container: HTMLElement, text: string) {
  const option = optionButtons(container).find((b) => b.textContent?.includes(text));
  if (!option) throw new Error(`未找到选项：${text}`);
  fireEvent.click(option);
}

async function pumpFrames(frames = 4) {
  await act(async () => {
    for (let i = 0; i < frames; i += 1) {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    }
  });
}

/** 作答当前题并点击「下一题」/「查看成绩」 */
async function answerAndAdvance(container: HTMLElement, question: PotOddsQuizQuestion, correct: boolean) {
  const option = correct
    ? question.options.find((o) => o.isCorrect)!
    : question.options.find((o) => !o.isCorrect)!;
  clickOption(container, i18n.t(option.text));
  await screen.findByText(correct ? '正确！' : '不正确');

  const advance = Array.from(container.querySelectorAll('button')).find(
    (b) => b.textContent?.includes('下一题') || b.textContent?.includes('查看成绩'),
  );
  if (!advance) throw new Error('未找到下一题 / 查看成绩按钮');
  fireEvent.click(advance);
  await pumpFrames();
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

beforeEach(async () => {
  // 组件测试共享 i18n 全局实例；其他语言切换用例可能把 language 留在 en，
  // 导致选项文本以英文渲染而断言用 zh key 解析。固定 zh 消除文件间顺序耦合。
  await i18n.changeLanguage('zh');
  resetProgress();
  useDebugModeStore.setState({ unlockAll: false });
  useProgressStore.setState({ recordTrainingDay: vi.fn() });
  emitted = [];
  unsubscribe = trainingEvents.subscribe((record) => emitted.push(record));
});

afterEach(() => {
  unsubscribe();
  cleanup();
  resetProgress();
  useProgressStore.setState({ recordTrainingDay: originalRecordTrainingDay });
});

describe('PotOddsQuizPage 完整会话结算', () => {
  it('19 题全对：结算 100%、emit 一次 pot-odds 事件、记录训练日一次', async () => {
    const recordTrainingDay = useProgressStore.getState().recordTrainingDay;
    const { container } = renderQuiz();

    // 前 18 题为题库原题，第 19 题固定替换为简单题
    for (const question of QUIZ_QUESTIONS.slice(0, QUIZ_QUESTIONS.length - 1)) {
      await answerAndAdvance(container, question, true);
    }
    await screen.findByText(i18n.t(EASY.scenario));
    await answerAndAdvance(container, EASY, true);

    expect(await screen.findByText('训练完成！')).toBeTruthy();
    const text = container.textContent ?? '';
    expect(text).toContain('100%');
    expect(text).toContain('19/19');
    expect(text).toContain('✓ 最后一题答对，以成功收尾！');

    expect(recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveLength(1);
    const record = emitted[0]!;
    expect(record.module).toBe('pot-odds');
    expect(record.mode).toBe('quiz');
    expect(record.result.totalQuestions).toBe(19);
    expect(record.result.correctAnswers).toBe(19);
    expect(record.result.accuracy).toBe(1);
    expect(record.result.lastQuestionCorrect).toBe(true);
    expect(record.result.details).toHaveLength(19);
    expect(record.result.details.every((detail) => detail.isCorrect)).toBe(true);
    expect(record.id).toBe(record.result.sessionId);

    // 三处同步覆盖整场会话
    expect(useProgressStore.getState().reviewItems).toHaveLength(19);
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBe(19);
    expect(useProgressStore.getState().eloByVariant.standard.math).toBeGreaterThan(DEFAULT_ELO.math);
  });

  it('结算面板的返回计算器跳转与再来一轮重置', async () => {
    const { container } = renderQuiz();
    for (const question of QUIZ_QUESTIONS.slice(0, QUIZ_QUESTIONS.length - 1)) {
      await answerAndAdvance(container, question, true);
    }
    await screen.findByText(i18n.t(EASY.scenario));
    await answerAndAdvance(container, EASY, true);
    await screen.findByText('训练完成！');

    fireEvent.click(getButton(container, '返回计算器'));
    expect(screen.getByTestId('location').textContent).toBe('/pot-odds');

    fireEvent.click(getButton(container, '再来一轮'));
    await pumpFrames();
    expect(screen.getByText('赔率速算训练')).toBeTruthy();
    expect(container.textContent).toContain('1 / 19');
    expect(screen.queryByText('正确！')).toBeNull();
    expect(optionButtons(container).some((b) => b.disabled)).toBe(false);
  });

  it('末题答错追加补救题（total 20），补救答对后以最后一题答对收尾', async () => {
    const recordTrainingDay = useProgressStore.getState().recordTrainingDay;
    const { container } = renderQuiz();

    for (const question of QUIZ_QUESTIONS.slice(0, QUIZ_QUESTIONS.length - 1)) {
      await answerAndAdvance(container, question, true);
    }
    await screen.findByText(i18n.t(EASY.scenario));

    // 末题故意答错 → 点击「查看成绩」不结束，而是进入第 20 题（补救题）
    await answerAndAdvance(container, EASY, false);
    expect(container.textContent).toContain('20 / 20');

    await answerAndAdvance(container, EASY, true);

    expect(await screen.findByText('训练完成！')).toBeTruthy();
    const text = container.textContent ?? '';
    expect(text).toContain('95%');
    expect(text).toContain('19/20');
    expect(text).toContain('✓ 最后一题答对，以成功收尾！');

    expect(recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveLength(1);
    const record = emitted[0]!;
    expect(record.result.totalQuestions).toBe(20);
    expect(record.result.correctAnswers).toBe(19);
    expect(record.result.accuracy).toBeCloseTo(0.95, 6);
    expect(record.result.lastQuestionCorrect).toBe(true);
    expect(record.result.details).toHaveLength(20);
    // 第 19 题（简单末题）答错，第 20 题（补救题 odds:9998）答对
    expect(record.result.details[18]!.isCorrect).toBe(false);
    expect(record.result.details[19]!.isCorrect).toBe(true);
    // SRS：简单末题 + 补救题均以固定 id 入队（去重键可复用）
    const reviewIds = useProgressStore.getState().reviewItems.map((item) => item.id);
    expect(reviewIds).toContain('odds:9999');
    expect(reviewIds).toContain('odds:9998');
  });

  it('补救题再答错时不再追加第二道（rescueUsed 仅一次），以最后一题答错结算', async () => {
    const recordTrainingDay = useProgressStore.getState().recordTrainingDay;
    const { container } = renderQuiz();
    const base = QUIZ_QUESTIONS.slice(0, QUIZ_QUESTIONS.length - 1);

    // 14 对 + 4 错 → 70%，覆盖 gradeGood 与"最后一题未答对"分支
    for (let i = 0; i < base.length; i += 1) {
      await answerAndAdvance(container, base[i]!, i < 14);
    }
    await screen.findByText(i18n.t(EASY.scenario));
    await answerAndAdvance(container, EASY, false); // 末题答错 → 追加补救题
    expect(container.textContent).toContain('20 / 20');

    await answerAndAdvance(container, EASY, false); // 补救题也答错 → 直接结束，不再追加

    expect(await screen.findByText('训练完成！')).toBeTruthy();
    const text = container.textContent ?? '';
    expect(text).toContain('70%');
    expect(text).toContain('14/20');
    expect(text).toContain('👍 不错！继续练习可以更加熟练。');
    expect(text).not.toContain('最后一题答对');

    expect(recordTrainingDay).toHaveBeenCalledTimes(1);
    expect(emitted).toHaveLength(1);
    const result = emitted[0]!.result;
    expect(result.totalQuestions).toBe(20);
    expect(result.correctAnswers).toBe(14);
    expect(result.lastQuestionCorrect).toBe(false);
    // 第 15-20 题（含补救题）全部答错，且未产生第 21 题
    expect(result.details).toHaveLength(20);
    expect(result.details.slice(14).every((detail) => !detail.isCorrect)).toBe(true);
  });
});
