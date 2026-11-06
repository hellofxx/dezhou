/**
 * PuzzleResult 结果页组件测试（含 PuzzleResultParts 错题列表）。
 *
 * 契约：
 *  - Rush 显示分数卡与「m分s秒」用时；非 Rush 显示平均用时且不显示分数卡；
 *  - 破纪录时展示新纪录徽章；
 *  - 仅答错题进入错题列表，含题目场景 / 你的选择 / 正确答案 / 完整解析；
 *  - 「再试一次」「返回首页」回调可触发。
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PuzzleResult } from './PuzzleResult';
import type { PuzzleAnswerRecord, PuzzleQuestion, PuzzleResult as PuzzleResultData } from '../types';

const question: PuzzleQuestion = {
  id: 'q-1',
  theme: 'c-bet',
  scenario: '6-max，100BB。翻牌 K♠ 7♥ 2♣，底池 5.5BB，BTN 对 BB。',
  hand: 'AKo',
  options: [
    { id: 'a', text: 'C-bet 2BB', isCorrect: true, evLoss: 0, explanation: '顶对顶 kicker 价值下注。' },
    { id: 'b', text: 'Check', isCorrect: false, evLoss: 3, explanation: 'Check 损失价值。' },
  ],
  correctExplanation: '干燥牌面持顶对，c-bet 1/3 池是标准价值线。',
  difficulty: 1,
  evBasis: 'none',
};

const correctQuestion: PuzzleQuestion = { ...question, id: 'q-2', scenario: '答对的那道题场景' };

const correctAnswer: PuzzleAnswerRecord = {
  questionId: 'q-2',
  selectedOptionId: 'a',
  isCorrect: true,
  timeTaken: 3000,
  grade: 'best',
  evLoss: 0,
};

const wrongAnswer: PuzzleAnswerRecord = {
  questionId: 'q-1',
  selectedOptionId: 'b',
  isCorrect: false,
  timeTaken: 8000,
  grade: 'wrong',
  evLoss: 3,
};

function makeResult(overrides: Partial<PuzzleResultData> = {}): PuzzleResultData {
  return {
    sessionId: 'session-1',
    mode: 'daily',
    totalQuestions: 2,
    correctCount: 1,
    wrongCount: 1,
    accuracy: 0.5,
    duration: 12000,
    averageTime: 5500,
    score: 100,
    timestamp: 1_700_000_000_000,
    answers: [correctAnswer, wrongAnswer],
    questions: [correctQuestion, question],
    status: 'completed',
    ...overrides,
  };
}

describe('PuzzleResult 结果页', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = (result: PuzzleResultData, isNewRecord = false, handlers = { onRetry: vi.fn(), onBackHome: vi.fn() }) => {
    act(() => {
      root.render(
        <PuzzleResult
          result={result}
          isNewRecord={isNewRecord}
          onRetry={handlers.onRetry}
          onBackHome={handlers.onBackHome}
        />
      );
    });
    return handlers;
  };

  const text = () => container.textContent ?? '';

  const buttonByText = (needle: string): HTMLButtonElement | undefined =>
    [...container.querySelectorAll('button')].find((btn) => btn.textContent?.includes(needle));

  it('Rush 结果展示分数卡与「分秒」用时格式', () => {
    render(makeResult({ mode: 'rush', score: 2400, duration: 72_000, correctCount: 10, totalQuestions: 10 }));
    expect(text()).toContain('冲刺结束');
    expect(text()).toContain('分数');
    expect(text()).toContain('2400');
    expect(text()).toContain('1分12秒');
  });

  it('非 Rush 结果展示训练完成、平均用时且不显示分数卡', () => {
    render(makeResult({ mode: 'daily', duration: 12000, averageTime: 5500 }));
    expect(text()).toContain('训练完成');
    expect(text()).not.toContain('分数');
    expect(text()).toContain('12s');
    expect(text()).toContain('平均用时');
    expect(text()).toContain('5.5s');
  });

  it('破纪录时展示新纪录徽章', () => {
    render(makeResult(), true);
    expect(text()).toContain('新纪录');
  });

  it('未破纪录时不展示新纪录徽章', () => {
    render(makeResult(), false);
    expect(text()).not.toContain('新纪录');
  });

  it('错题列表只收录答错题，含场景 / 你的选择 / 正确答案 / 解析', () => {
    render(makeResult());
    expect(text()).toContain('答错 1 题');
    expect(text()).toContain(question.scenario);
    expect(text()).not.toContain(correctQuestion.scenario);
    expect(text()).toContain('你的选择');
    expect(text()).toContain('Check');
    expect(text()).toContain('正确答案');
    expect(text()).toContain('C-bet 2BB');
    expect(text()).toContain(question.correctExplanation);
  });

  it('全对时不渲染错题列表', () => {
    render(makeResult({ answers: [correctAnswer], questions: [correctQuestion], wrongCount: 0 }));
    expect(text()).not.toContain('答错 0 题');
    expect(text()).not.toContain('你的选择');
  });

  it('再试一次 / 返回首页按钮触发对应回调', () => {
    const handlers = render(makeResult());
    act(() => {
      buttonByText('再试一次')?.click();
    });
    expect(handlers.onRetry).toHaveBeenCalledTimes(1);

    act(() => {
      buttonByText('返回首页')?.click();
    });
    expect(handlers.onBackHome).toHaveBeenCalledTimes(1);
  });
});

describe('PuzzleResult 标题层级（内嵌 h2）', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderResult = (result: PuzzleResultData, isNewRecord = false) => {
    act(() => {
      root.render(
        <PuzzleResult
          result={result}
          isNewRecord={isNewRecord}
          onRetry={vi.fn()}
          onBackHome={vi.fn()}
        />
      );
    });
  };

  it('标题为 h2，结果视图内不出现 h1', () => {
    renderResult(makeResult());

    expect(container.querySelector('h2')?.textContent).toBe('训练完成');
    expect(container.querySelector('h1')).toBeNull();
  });

  it('冲刺模式标题文案切换，层级仍为 h2', () => {
    renderResult(makeResult({ mode: 'rush' }));

    expect(container.querySelector('h2')?.textContent).toBe('冲刺结束');
  });
});
