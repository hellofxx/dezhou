import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LessonQuiz } from './LessonQuiz';
import type { QuizQuestion } from '../types';

/**
 * 答错回顾门契约（Fix 3 反馈闭环）：
 * - 答错且注入 onReview 时，解析块内出现「回顾本课」quiet 按钮，点击回传 onReview
 * - 答对不出现回顾按钮；未注入 onReview 时答错也不出现（既有消费方零扰动）
 */

const question: QuizQuestion = {
  id: 'review-q1',
  question: '底池赔率需要多少胜率？',
  // 数值升序后：['20%', '30%']，正确项 '20%' 位于索引 0
  options: ['30%', '20%'],
  correctIndex: 1,
  explanation: '跟注 50 进 150 底池需要 25% 左右胜率。',
};

const baseProps = {
  lessonId: 'review-fixture',
  level: 1,
  attemptNumber: 2,
  isPractice: true,
};

afterEach(() => cleanup());

describe('LessonQuiz：答错回顾门', () => {
  it('答错时出现「回顾本课」按钮，点击调用 onReview', () => {
    const onReview = vi.fn();
    render(
      <LessonQuiz {...baseProps} questions={[question]} onComplete={() => {}} onReview={onReview} />,
    );

    expect(screen.queryByText('回顾本课')).toBeNull();
    fireEvent.click(screen.getByText('30%'));
    expect(screen.getByText('✗ 错误')).toBeTruthy();

    const reviewButton = screen.getByText('回顾本课').closest('button');
    expect(reviewButton).not.toBeNull();
    fireEvent.click(reviewButton!);
    expect(onReview).toHaveBeenCalledTimes(1);
  });

  it('答对时不出现回顾按钮', () => {
    const onReview = vi.fn();
    render(
      <LessonQuiz {...baseProps} questions={[question]} onComplete={() => {}} onReview={onReview} />,
    );

    fireEvent.click(screen.getByText('20%'));
    expect(screen.getByText('✓ 正确！')).toBeTruthy();
    expect(screen.queryByText('回顾本课')).toBeNull();
    expect(onReview).not.toHaveBeenCalled();
  });

  it('未注入 onReview 时答错也不渲染回顾按钮（既有消费方零扰动）', () => {
    render(<LessonQuiz {...baseProps} questions={[question]} onComplete={() => {}} />);

    fireEvent.click(screen.getByText('30%'));
    expect(screen.getByText('✗ 错误')).toBeTruthy();
    expect(screen.queryByText('回顾本课')).toBeNull();
  });
});