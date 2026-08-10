/**
 * PuzzleResult → TrainingRecord 转换（trainingEvents.emit 用）。
 *
 * P1-D 修复批从 PuzzleRush / DailyPuzzle / ThemeDrill 三处相同实现去重下沉：
 * emit 的 totalQuestions 口径与 buildPuzzleResult（P1D-05：rush 取已答数）
 * 单源同步，三模式不再各自维护拷贝。
 */
import type { TrainingResult } from '@/shared/types/common';
import type { PuzzleResult } from '../types';

/** 将 PuzzleResult 转换为 TrainingRecord 用于 trainingEvents.emit */
export function puzzleResultToTrainingRecord(result: PuzzleResult) {
  const trainingResult: TrainingResult = {
    sessionId: result.sessionId,
    module: 'puzzle-trainer',
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctCount,
    accuracy: result.accuracy,
    averageTime: result.averageTime, // 单位：毫秒（与 range-trainer / pot-odds 等模块一致）
    timestamp: result.timestamp,
    details: result.answers.map((a) => ({
      question: a.questionId,
      isCorrect: a.isCorrect,
      timeTaken: a.timeTaken,
      userAnswer: a.selectedOptionId,
      correctAnswer: '',
    })),
  };
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    module: 'puzzle-trainer' as const,
    mode: result.mode,
    result: trainingResult,
    createdAt: Date.now(),
  };
}
