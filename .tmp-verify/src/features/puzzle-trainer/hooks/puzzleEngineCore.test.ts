import { describe, expect, it } from 'vitest';
import type { PuzzleEngineState, PuzzleQuestion } from '../types';
import { applyAnswer, buildPuzzleResult, computeSessionScore } from './puzzleEngineCore';

/**
 * P1-D 回归测试：
 *  - P1D-02: failed（命耗尽）会话不计剩余时间分
 *  - P1D-05: rush 未答完时 totalQuestions 取已答数（answers.length）
 *  - applyAnswer 结算口径（命/连对/奖励）
 */

function makeQuestion(id: string, correctOptionId = 'a'): PuzzleQuestion {
  return {
    id,
    theme: 'preflop-rfi',
    scenario: 'test',
    options: [
      { id: 'a', text: 'Fold', isCorrect: correctOptionId === 'a', explanation: '' },
      { id: 'b', text: 'Call', isCorrect: correctOptionId === 'b', evLoss: 2, explanation: '' },
      { id: 'c', text: 'Raise 3BB', isCorrect: correctOptionId === 'c', evLoss: 5, explanation: '' },
    ],
    correctExplanation: '',
    difficulty: 1,
  };
}

function makeState(overrides: Partial<PuzzleEngineState> = {}): PuzzleEngineState {
  return {
    questions: [makeQuestion('q1'), makeQuestion('q2'), makeQuestion('q3')],
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    lives: 3,
    streak: 0,
    startTime: 1_000_000,
    endTime: null,
    timeRemaining: 120_000,
    status: 'playing',
    answers: [],
    bonusAwarded: 0,
    ...overrides,
  };
}

describe('computeSessionScore（P1D-02）', () => {
  it('completed 会话：对题×100 + 剩余秒×10 + 命×200', () => {
    const score = computeSessionScore('rush', {
      correctCount: 10,
      timeRemaining: 65_500,
      lives: 2,
      status: 'completed',
    });
    expect(score).toBe(10 * 100 + 65 * 10 + 2 * 200); // 2050
  });

  it('failed（命耗尽）不计剩余时间分：快速送命不再比打满分高', () => {
    const score = computeSessionScore('rush', {
      correctCount: 2,
      timeRemaining: 170_000, // 送命极快，剩余大量时间
      lives: 0,
      status: 'failed',
    });
    expect(score).toBe(200); // 仅对题分；旧口径为 200 + 1700 = 1900
  });

  it('非 rush 模式只计对题分', () => {
    expect(
      computeSessionScore('daily', { correctCount: 7, timeRemaining: 0, lives: 0, status: 'completed' })
    ).toBe(700);
  });
});

describe('buildPuzzleResult（P1D-05）', () => {
  it('rush 未答完：totalQuestions = 已答数，accuracy 分母一致', () => {
    const state = makeState({
      status: 'failed',
      endTime: 1_060_000,
      correctCount: 2,
      wrongCount: 1,
      lives: 0,
      answers: [
        { questionId: 'q1', selectedOptionId: 'a', isCorrect: true, timeTaken: 3000, grade: 'best', evLoss: 0 },
        { questionId: 'q2', selectedOptionId: 'a', isCorrect: true, timeTaken: 4000, grade: 'best', evLoss: 0 },
        { questionId: 'q3', selectedOptionId: 'b', isCorrect: false, timeTaken: 5000, grade: 'inaccuracy', evLoss: 2 },
      ],
    });
    const result = buildPuzzleResult(state, 'rush');
    expect(result.totalQuestions).toBe(3); // 已答数，而非题池 questions.length
    expect(result.accuracy).toBeCloseTo(2 / 3);
    expect(result.correctCount + result.wrongCount).toBe(result.totalQuestions);
  });

  it('rush failed 的 score 不含剩余时间分（与 computeSessionScore 同口径）', () => {
    const state = makeState({
      status: 'failed',
      endTime: 1_030_000,
      correctCount: 1,
      wrongCount: 3,
      lives: 0,
      timeRemaining: 150_000,
      answers: [
        { questionId: 'q1', selectedOptionId: 'a', isCorrect: true, timeTaken: 3000, grade: 'best', evLoss: 0 },
      ],
    });
    expect(buildPuzzleResult(state, 'rush').score).toBe(100);
  });

  it('daily/theme：totalQuestions 仍取题目总数', () => {
    const state = makeState({ status: 'completed', endTime: 1_040_000 });
    expect(buildPuzzleResult(state, 'daily').totalQuestions).toBe(3);
    expect(buildPuzzleResult(state, 'theme', 'preflop-rfi').theme).toBe('preflop-rfi');
  });
});

describe('applyAnswer（结算口径）', () => {
  const inferLessonId = () => undefined;
  const base = { mode: 'rush' as const, questionStartedAt: 0, now: 3000, inferLessonId };

  it('答对：correctCount+1、streak+1、不扣命', () => {
    const next = applyAnswer(makeState(), { ...base, optionId: 'a' });
    expect(next.correctCount).toBe(1);
    expect(next.streak).toBe(1);
    expect(next.lives).toBe(3);
  });

  it('答错：wrongCount+1、streak 归零、扣 1 命', () => {
    const next = applyAnswer(makeState({ streak: 4 }), { ...base, optionId: 'b' });
    expect(next.wrongCount).toBe(1);
    expect(next.streak).toBe(0);
    expect(next.lives).toBe(2);
  });

  it('连对第 5 题：bonusAwarded 与 timeRemaining 各 +10s', () => {
    const next = applyAnswer(makeState({ streak: 4 }), { ...base, optionId: 'a' });
    expect(next.bonusAwarded).toBe(10_000);
    expect(next.timeRemaining).toBe(130_000);
  });

  it('重复作答同一题幂等（返回原状态引用）', () => {
    const answered = applyAnswer(makeState(), { ...base, optionId: 'a' });
    expect(applyAnswer(answered, { ...base, optionId: 'b' })).toBe(answered);
  });
});
