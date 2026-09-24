import { describe, expect, it } from 'vitest';
import { puzzleResultToTrainingRecord } from './trainingRecord';
import type { PuzzleAnswerRecord, PuzzleResult } from '../types';

/**
 * PuzzleResult → TrainingRecord 转换口径锁定（BUG-PZL-002 回归）：
 * correctAnswer 从 questions 推导正确选项 id，不再恒为空串。
 */
describe('puzzleResultToTrainingRecord', () => {
  const answers: PuzzleAnswerRecord[] = [
    { questionId: 'q1', selectedOptionId: 'a', isCorrect: true, timeTaken: 3000, grade: 'best', evLoss: 0 },
    { questionId: 'q2', selectedOptionId: 'x', isCorrect: false, timeTaken: 5000, grade: 'inaccuracy', evLoss: 1.2 },
  ];

  const result: PuzzleResult = {
    sessionId: 'puzzle-daily-1',
    mode: 'daily',
    totalQuestions: 2,
    correctCount: 1,
    wrongCount: 1,
    accuracy: 0.5,
    duration: 8000,
    averageTime: 4000,
    score: 100,
    timestamp: 1_000,
    answers,
    questions: [
      {
        id: 'q1',
        theme: 'preflop-rfi',
        scenario: 's1',
        options: [
          { id: 'a', text: 'Raise', isCorrect: true, evLoss: 0, explanation: '' },
          { id: 'b', text: 'Fold', isCorrect: false, evLoss: 3, explanation: '' },
        ],
        correctExplanation: '',
        difficulty: 1,
      },
      {
        id: 'q2',
        theme: 'c-bet',
        scenario: 's2',
        options: [
          { id: 'y', text: 'C-bet 5BB', isCorrect: true, evLoss: 0, explanation: '' },
          { id: 'x', text: 'Check', isCorrect: false, evLoss: 1.2, explanation: '' },
        ],
        correctExplanation: '',
        difficulty: 2,
      },
    ],
    status: 'completed',
  };

  it('emit 明细的 correctAnswer 填正确选项 id（BUG-PZL-002：不再恒为空串）', () => {
    const record = puzzleResultToTrainingRecord(result);
    expect(record.result.details[0]?.correctAnswer).toBe('a');
    expect(record.result.details[1]?.correctAnswer).toBe('y');
    expect(record.result.details[1]?.userAnswer).toBe('x');
  });

  it('聚合字段口径：totalQuestions / correctAnswers / accuracy / averageTime 同源', () => {
    const record = puzzleResultToTrainingRecord(result);
    expect(record.module).toBe('puzzle-trainer');
    expect(record.mode).toBe('daily');
    expect(record.result.totalQuestions).toBe(2);
    expect(record.result.correctAnswers).toBe(1);
    expect(record.result.accuracy).toBe(0.5);
    expect(record.result.averageTime).toBe(4000);
    expect(record.result.details).toHaveLength(2);
  });
});
