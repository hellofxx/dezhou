/**
 * QuizCard 相关课程透传契约（L2 · jsdom）：
 * - decisionFeedback.relatedLessonId + onRelatedLessonOpen → 决策分析区渲染「相关课程」chip
 * - chip 点击调用调用方注入的回调（共享层不拼 feature 路由）
 * - 未注入 onRelatedLessonOpen 时不渲染 chip（避免死链）
 */
import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MotionGlobalConfig } from 'framer-motion';
import type { QuizQuestion } from '@/shared/types/quiz';
import { Position } from '@/shared/types/position';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { QuizCard } from './QuizCard';

beforeAll(() => {
  // jsdom 无真实动画帧，跳过 framer-motion 动画
  MotionGlobalConfig.skipAnimations = true;
});

afterEach(() => cleanup());

const question: QuizQuestion = {
  id: 'q-related-lesson',
  hand: 'AKo',
  position: Position.BTN,
  correctAction: 'raise',
};

const wrongFeedback: DecisionFeedback = {
  grade: 'wrong',
  evLoss: 3,
  correctAction: 'raise',
  explanation: 'BTN 开池被跟注后顶对顶 kicker 应价值下注',
  relatedLessonId: 'l3-cbet',
};

function renderCard(onRelatedLessonOpen?: (lessonId: string) => void) {
  return render(
    <QuizCard
      question={question}
      onAnswer={() => undefined}
      timeRemaining={10}
      timeLimit={10}
      decisionFeedback={wrongFeedback}
      onRelatedLessonOpen={onRelatedLessonOpen}
    />,
  );
}

describe('QuizCard 相关课程 chip 透传', () => {
  it('注入 onRelatedLessonOpen 时渲染 chip，点击回传 lessonId', () => {
    const onOpen = vi.fn();
    renderCard(onOpen);

    // wrong 级别默认展开决策分析 → chip 直接可见
    const chip = screen.getByRole('button', { name: '相关课程' });
    fireEvent.click(chip);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith('l3-cbet');
  });

  it('未注入 onRelatedLessonOpen 时不渲染 chip（共享层不提供默认跳转）', () => {
    renderCard();

    expect(screen.queryByRole('button', { name: '相关课程' })).toBeNull();
    // 决策分析折叠区本身仍可用
    expect(screen.getByRole('button', { name: '收起分析' })).toBeTruthy();
  });
});
