/**
 * SessionResult（训练结算页）组件测试（L2 · jsdom）
 *
 * 覆盖契约：
 *  - 正确率四档评价文案（≥0.9 优秀 / ≥0.7 良好 / ≥0.5 继续加油 / <0.5 需要更多练习）
 *  - 统计卡片（总题数 / 正确 / 错误 / 平均用时秒）
 *  - 薄弱手牌 = 答错次数 ≥2 的手牌，按答错次数降序；无薄弱手牌时不渲染该卡片
 *  - 错题详情表格（手牌 / 你的选择 / 正确答案 / 用时），全对时不渲染错题卡片
 *  - 「再练一次」「返回首页」回调
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { QuestionResult, TrainingResult } from '@/shared/types/common';
import { SessionResult } from './SessionResult';

afterEach(() => cleanup());

function detail(question: string, over: Partial<QuestionResult> = {}): QuestionResult {
  return {
    question,
    isCorrect: true,
    timeTaken: 1500,
    userAnswer: 'raise',
    correctAnswer: 'raise',
    ...over,
  };
}

function makeResult(over: Partial<TrainingResult> = {}): TrainingResult {
  return {
    sessionId: 'quiz-fixture',
    module: 'range-trainer',
    totalQuestions: 10,
    correctAnswers: 9,
    accuracy: 0.9,
    averageTime: 2500,
    timestamp: 1700000000000,
    details: [],
    ...over,
  };
}

function renderResult(result: TrainingResult, onRetry = vi.fn(), onBackToHome = vi.fn()) {
  const utils = render(
    <SessionResult result={result} onRetry={onRetry} onBackToHome={onBackToHome} />,
  );
  return { ...utils, onRetry, onBackToHome };
}

describe('SessionResult 正确率分档', () => {
  it.each([
    [1, 100, '优秀！'],
    [0.75, 75, '良好'],
    [0.55, 55, '继续加油'],
    [0.3, 30, '需要更多练习'],
  ])('正确率 %s 渲染 %s%% 与评价「%s」', (accuracy, percent, label) => {
    const { container } = renderResult(
      makeResult({ accuracy, correctAnswers: 0, totalQuestions: 0 }),
    );

    expect(screen.getByText(`${percent}%`)).toBeTruthy();
    expect(container.textContent).toContain(label);
  });
});

describe('SessionResult 统计卡片', () => {
  it('展示总题数、正确数、错误数与平均用时（ms → 秒，保留 1 位）', () => {
    renderResult(
      makeResult({ totalQuestions: 10, correctAnswers: 7, accuracy: 0.7, averageTime: 2345 }),
    );

    expect(screen.getByText('总题数')).toBeTruthy();
    expect(screen.getByText('正确')).toBeTruthy();
    expect(screen.getByText('错误')).toBeTruthy();
    expect(screen.getByText('平均用时')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    // 错误数 = 总题数 - 正确数，不是直接读 details
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2.3s')).toBeTruthy();
  });
});

describe('SessionResult 薄弱手牌', () => {
  it('只列出答错 ≥2 次的手牌，并按答错次数降序', () => {
    const result = makeResult({
      details: [
        detail('AA', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
        detail('AA', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
        detail('KK', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
        detail('KK', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
        detail('KK', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
        // 只错一次：不进入薄弱手牌
        detail('QQ', { isCorrect: false, userAnswer: 'call', correctAnswer: 'raise' }),
      ],
    });

    renderResult(result);

    expect(screen.getByText('薄弱手牌')).toBeTruthy();
    const chips = screen
      .getAllByText(/错 \d+ 次/)
      .map((el) => el.parentElement?.textContent);
    expect(chips).toEqual(['KK错 3 次', 'AA错 2 次']);
  });

  it('无答错 ≥2 次的手牌时不渲染薄弱手牌卡片', () => {
    renderResult(
      makeResult({
        details: [
          detail('AA', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise' }),
          detail('KK'),
        ],
      }),
    );

    expect(screen.queryByText('薄弱手牌')).toBeNull();
    expect(screen.queryByText(/错 \d+ 次/)).toBeNull();
  });
});

describe('SessionResult 错题详情', () => {
  it('仅列出答错的题目，并展示手牌 / 你的选择 / 正确答案 / 用时', () => {
    const { container } = renderResult(
      makeResult({
        details: [
          detail('AA', { isCorrect: false, userAnswer: 'fold', correctAnswer: 'raise', timeTaken: 1500 }),
          detail('KQs'),
        ],
      }),
    );

    expect(screen.getByText('错题详情')).toBeTruthy();
    const cells = Array.from(container.querySelectorAll('tbody td')).map((td) => td.textContent);
    expect(cells).toEqual(['AA', 'fold', 'raise', '1.5s']);
  });

  it('全对时不渲染错题详情卡片', () => {
    renderResult(makeResult({ details: [detail('AA')] }));

    expect(screen.queryByText('错题详情')).toBeNull();
    expect(screen.queryByText('手牌')).toBeNull();
  });
});

describe('SessionResult 操作按钮', () => {
  it('点击「再练一次」与「返回首页」分别触发对应回调', () => {
    const { onRetry, onBackToHome } = renderResult(makeResult());

    fireEvent.click(screen.getByRole('button', { name: /再练一次/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /返回首页/ }));
    expect(onBackToHome).toHaveBeenCalledTimes(1);
  });
});
