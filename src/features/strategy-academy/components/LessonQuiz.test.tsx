import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LessonQuiz } from './LessonQuiz';
import type { QuizQuestion } from '../types';

/**
 * 课后测验契约：
 * - 选项经数值升序重排后渲染，correctIndex 同步重映射（答对判定依赖重排后索引）
 * - 作答后锁定选项并展示解析；下一题重置选择
 * - 最后一题结算调用 onComplete(score)，<70 分展示「重新测验」并可重来
 */

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    question: '底池赔率需要多少胜率？',
    // 数值升序后：['20%', '30%']，正确项 '20%' 位于索引 0
    options: ['30%', '20%'],
    correctIndex: 1,
    explanation: '跟注 50 进 150 底池需要 25% 左右胜率。',
  },
  {
    id: 'q2',
    question: 'MDF 公式的分母是什么？',
    options: ['40', '50', '60'],
    correctIndex: 0,
    explanation: 'MDF = pot / (pot + bet)。',
  },
];

afterEach(() => cleanup());

describe('LessonQuiz：作答与结算', () => {
  it('数值选项升序展示，答对后展示解析与下一题', async () => {
    const onComplete = vi.fn();
    render(<LessonQuiz questions={questions} onComplete={onComplete} />);

    expect(screen.getByText('第 1 / 2 题')).toBeTruthy();
    const optionButtons = screen.getAllByRole('button');
    // 两张选项卡（此时还没有「下一题」按钮）
    expect(optionButtons.map((b) => b.textContent)).toEqual(['A20%', 'B30%']);

    fireEvent.click(screen.getByText('20%'));
    expect(screen.getByText('✓ 正确！')).toBeTruthy();
    expect(screen.getByText(questions[0]!.explanation)).toBeTruthy();
    // 作答后选项锁定
    expect(screen.getByText('20%').closest('button')?.disabled).toBe(true);

    fireEvent.click(screen.getByText('下一题'));
    // AnimatePresence mode="wait"：等待旧题退出动画完成后再断言新题
    await waitFor(() => expect(screen.getByText('第 2 / 2 题')).toBeTruthy());
  });

  it('答错时展示错误解析，结算分数并允许重新测验', async () => {
    const onComplete = vi.fn();
    render(<LessonQuiz questions={questions} onComplete={onComplete} />);

    // 第 1 题选错（30%）
    fireEvent.click(screen.getByText('30%'));
    expect(screen.getByText('✗ 错误')).toBeTruthy();
    // 正确项高亮仍可读
    expect(screen.getByText('20%')).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    // 第 2 题选正确（40）
    await waitFor(() => expect(screen.getByText('第 2 / 2 题')).toBeTruthy());
    fireEvent.click(screen.getByText('40'));
    fireEvent.click(screen.getByText('查看结果'));

    expect(onComplete).toHaveBeenCalledWith(50);
    expect(screen.getByText('继续加油！')).toBeTruthy();
    expect(screen.getByText('答对 1/2 题')).toBeTruthy();

    fireEvent.click(screen.getByText('重新测验'));
    expect(screen.getByText('第 1 / 2 题')).toBeTruthy();
  });

  it('全对时展示通过文案且不出现重试按钮', () => {
    const onComplete = vi.fn();
    render(<LessonQuiz questions={[questions[1]!]} onComplete={onComplete} />);

    fireEvent.click(screen.getByText('40'));
    fireEvent.click(screen.getByText('查看结果'));
    expect(onComplete).toHaveBeenCalledWith(100);
    expect(screen.getByText('测验通过！')).toBeTruthy();
    expect(screen.queryByText('重新测验')).toBeNull();
  });

  it('空题目数组不渲染任何内容', () => {
    const { container } = render(<LessonQuiz questions={[]} onComplete={() => {}} />);
    expect(container.textContent).toBe('');
  });
});
