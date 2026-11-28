import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MotionGlobalConfig } from 'framer-motion';
import { PuzzleCard } from './PuzzleCard';
import i18n from '@/i18n/config';
import type { PuzzleAnswerRecord, PuzzleQuestion } from '../types';

MotionGlobalConfig.skipAnimations = true;

const question: PuzzleQuestion = {
  id: 'mobile-feedback',
  theme: 'c-bet',
  scenario: '你在 BTN，面对 BB 的持续下注。',
  hand: 'AKo',
  position: 'BTN',
  board: 'K♠ 7♥ 2♣',
  potSize: 5.5,
  options: [
    { id: 'fold', text: 'Fold', isCorrect: false, explanation: '顶对强，不应弃牌。' },
    { id: 'call', text: 'Call', isCorrect: true, explanation: '跟注获取价值。' },
  ],
  correctExplanation: '顶对顶 kicker，面对小尺寸持续下注应跟注。',
  difficulty: 1,
  evBasis: 'none',
};

const answerRecord: PuzzleAnswerRecord = {
  questionId: question.id,
  selectedOptionId: 'call',
  isCorrect: true,
  timeTaken: 1200,
  grade: 'best',
  evLoss: 0,
};

const originalMatchMedia = window.matchMedia;

function setMobileViewport() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('max-width'),
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

function renderCard(isLastQuestion: boolean, onNext: () => void) {
  return render(
    <MemoryRouter>
      <PuzzleCard
        question={question}
        answerRecord={answerRecord}
        selectedOptionId="call"
        onSelectOption={vi.fn()}
        onNext={onNext}
        isLastQuestion={isLastQuestion}
      />
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('zh');
  setMobileViewport();
});

afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
});

describe('PuzzleCard 移动端反馈闭环', () => {
  it.each([
    { isLastQuestion: false, advanceLabel: '下一题' },
    { isLastQuestion: true, advanceLabel: '查看结果' },
  ])('关闭 Sheet 后可重开反馈或点击「$advanceLabel」', async ({ isLastQuestion, advanceLabel }) => {
    const onNext = vi.fn();
    renderCard(isLastQuestion, onNext);

    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    expect(screen.getByRole('button', { name: '答题反馈' })).toBeTruthy();
    expect(screen.getByRole('button', { name: advanceLabel })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: '答题反馈' }));
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '关闭' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    fireEvent.click(screen.getByRole('button', { name: advanceLabel }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
