import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { LessonQuiz, LESSON_QUIZ_DRAW_SIZE } from './LessonQuiz';
import { useProgressStore } from '@/features/progress/store';
import { drawByAttempt } from '@/shared/utils/academyQuizDraw';
import { getLessonMeta } from '../data/lessonMeta';
import type { QuizQuestion } from '../types';

/**
 * 课后测验契约（P0 学习闭环）：
 * - 按 lessonId + attemptNumber 抽题（默认 5 题），重考换题；选项仍经排序出口重排
 * - 作答后锁定选项并展示解析；最后一题结算 onComplete({score, correct, total, wrongQuestionIds})
 * - 首次作答逐题写 ELO（维度取 lessonMeta）+ 情绪计数；练习态（重考）不写，但错题 id 仍上报 SRS
 */

/** 内容完全一致、仅 id 不同的两题：抽题顺序不影响断言 */
const twinA: QuizQuestion = {
  id: 'q1',
  question: '底池赔率需要多少胜率？',
  // 数值升序后：['20%', '30%']，正确项 '20%' 位于索引 0
  options: ['30%', '20%'],
  correctIndex: 1,
  explanation: '跟注 50 进 150 底池需要 25% 左右胜率。',
};
const twinB: QuizQuestion = { ...twinA, id: 'q2' };
const twins: QuizQuestion[] = [twinA, twinB];

/** 8 题题库（验证「抽 5 题」与换题） */
const bank: QuizQuestion[] = Array.from({ length: 8 }, (_, i) => ({
  id: `bank-q${i + 1}`,
  question: `题库第 ${i + 1} 题`,
  options: ['10', '20'],
  correctIndex: 0,
  explanation: `解析 ${i + 1}`,
}));

const baseProps = {
  lessonId: 'l1-basics',
  level: 1,
  attemptNumber: 1,
  isPractice: false,
};

afterEach(() => cleanup());

describe('LessonQuiz：作答与结算', () => {
  it('数值选项升序展示，答对后展示解析与下一题', async () => {
    const onComplete = vi.fn();
    render(<LessonQuiz {...baseProps} questions={twins} onComplete={onComplete} />);

    expect(screen.getByText('第 1 / 2 题')).toBeTruthy();
    const optionButtons = screen.getAllByRole('button');
    // 两张选项卡（此时还没有「下一题」按钮）
    expect(optionButtons.map((b) => b.textContent)).toEqual(['A20%', 'B30%']);

    fireEvent.click(screen.getByText('20%'));
    expect(screen.getByText('✓ 正确！')).toBeTruthy();
    expect(screen.getByText(twinA.explanation)).toBeTruthy();
    // 作答后选项锁定
    expect(screen.getByText('20%').closest('button')?.disabled).toBe(true);

    fireEvent.click(screen.getByText('下一题'));
    // AnimatePresence mode="wait"：等待旧题退出动画完成后再断言新题
    await waitFor(() => expect(screen.getByText('第 2 / 2 题')).toBeTruthy());
  });

  it('答错时展示错误解析，结算返回分数/题量/错题 id，并允许重新测验', async () => {
    const onComplete = vi.fn();
    const firstDrawnId = drawByAttempt(twins, { key: baseProps.lessonId, attemptNumber: 1, size: 5 })[0]!.id;
    render(<LessonQuiz {...baseProps} questions={twins} onComplete={onComplete} />);

    // 第 1 题选错（30%）
    fireEvent.click(screen.getByText('30%'));
    expect(screen.getByText('✗ 错误')).toBeTruthy();
    // 正确项高亮仍可读
    expect(screen.getByText('20%')).toBeTruthy();
    fireEvent.click(screen.getByText('下一题'));

    // 第 2 题选正确（20%）
    await waitFor(() => expect(screen.getByText('第 2 / 2 题')).toBeTruthy());
    fireEvent.click(screen.getByText('20%'));
    fireEvent.click(screen.getByText('查看结果'));

    expect(onComplete).toHaveBeenCalledWith({
      score: 50,
      correct: 1,
      total: 2,
      wrongQuestionIds: [firstDrawnId],
    });
    expect(screen.getByText('继续加油！')).toBeTruthy();
    expect(screen.getByText('答对 1/2 题')).toBeTruthy();

    fireEvent.click(screen.getByText('重新测验'));
    expect(screen.getByText('第 1 / 2 题')).toBeTruthy();
  });

  it('全对时展示通过文案、无错题 id 且不出现重试按钮', () => {
    const onComplete = vi.fn();
    render(<LessonQuiz {...baseProps} questions={[twinA]} onComplete={onComplete} />);

    fireEvent.click(screen.getByText('20%'));
    fireEvent.click(screen.getByText('查看结果'));
    expect(onComplete).toHaveBeenCalledWith({
      score: 100,
      correct: 1,
      total: 1,
      wrongQuestionIds: [],
    });
    expect(screen.getByText('测验通过！')).toBeTruthy();
    expect(screen.queryByText('重新测验')).toBeNull();
  });

  it('空题目数组不渲染任何内容', () => {
    const { container } = render(
      <LessonQuiz {...baseProps} questions={[]} onComplete={() => {}} />,
    );
    expect(container.textContent).toBe('');
  });
});

describe('LessonQuiz：抽题（按尝试次数）', () => {
  it('题池大于 5 时只抽 5 题', () => {
    render(<LessonQuiz {...baseProps} questions={bank} onComplete={() => {}} />);
    expect(LESSON_QUIZ_DRAW_SIZE).toBe(5);
    expect(screen.getByText('第 1 / 5 题')).toBeTruthy();
  });

  it('重考（attemptNumber+1）抽到不同题目集合', () => {
    const firstDrawn = drawByAttempt(bank, { key: baseProps.lessonId, attemptNumber: 1, size: 5 });
    const secondDrawn = drawByAttempt(bank, { key: baseProps.lessonId, attemptNumber: 2, size: 5 });
    expect(firstDrawn.map((q) => q.id)).not.toEqual(secondDrawn.map((q) => q.id));

    const { rerender } = render(<LessonQuiz {...baseProps} questions={bank} onComplete={() => {}} />);
    expect(screen.getByText(firstDrawn[0]!.question)).toBeTruthy();

    rerender(
      <LessonQuiz {...baseProps} attemptNumber={2} isPractice questions={bank} onComplete={() => {}} />,
    );
    expect(screen.getByText(secondDrawn[0]!.question)).toBeTruthy();
  });
});

describe('LessonQuiz：ELO 与 SRS 口径', () => {
  it('首次作答逐题写 ELO（维度取 lessonMeta）与情绪计数', () => {
    const dimension = getLessonMeta(baseProps.lessonId).eloDimension;
    const before = useProgressStore.getState().eloByVariant.standard;
    render(<LessonQuiz {...baseProps} questions={[twinA]} onComplete={() => {}} />);

    fireEvent.click(screen.getByText('20%'));
    const after = useProgressStore.getState().eloByVariant.standard;
    expect(after.gamesPlayed).toBe(before.gamesPlayed + 1);
    expect(after[dimension]).toBeGreaterThan(before[dimension]);
    // 情绪系统记录答题（每日题量递增）
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBeGreaterThan(0);
  });

  it('练习态（重考）不写 ELO/情绪，但仍上报错题 id', () => {
    const onComplete = vi.fn();
    const before = useProgressStore.getState().eloByVariant.standard;
    const beforeEmotion = useProgressStore.getState().emotion.dailyQuestionsAnswered;
    render(
      <LessonQuiz {...baseProps} attemptNumber={2} isPractice questions={[twinA]} onComplete={onComplete} />,
    );

    fireEvent.click(screen.getByText('30%'));
    fireEvent.click(screen.getByText('查看结果'));

    expect(useProgressStore.getState().eloByVariant.standard).toEqual(before);
    expect(useProgressStore.getState().emotion.dailyQuestionsAnswered).toBe(beforeEmotion);
    expect(onComplete).toHaveBeenCalledWith({
      score: 0,
      correct: 0,
      total: 1,
      wrongQuestionIds: ['q1'],
    });
  });
});
