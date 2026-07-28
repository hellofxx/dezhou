import { useMemo, useCallback } from 'react';
import type { RangeAction } from '@/shared/types/poker';
import { Position } from '@/shared/types/position';
import type { TrainingResult, QuestionResult } from '@/shared/types/common';
import type { QuizQuestion } from '../types';
import { useRangeTrainerStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
// P1-3.1: SRS 集成
import {
  createReviewItem,
  processReview,
  type ReviewItem,
} from '@/features/progress/utils/spacedRepetition';
// P2-2.3: 五级反馈
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { buildDecisionFeedback } from '@/shared/types/decisionFeedback';

/**
 * 返回最简单的题目（"AA 在 BTN 是否应该开池？"，答案=raise）。
 * 用于"最后一题简单"策略：让用户以正确结束训练。
 */
export function getEasyQuestion(): QuizQuestion {
  return {
    hand: 'AA',
    position: Position.BTN,
    correctAction: 'raise',
    context: 'BTN open',
  };
}

/**
 * 根据 position + actionType 推导相关课程 ID（用于反馈闭环跳转）。
 *
 * 映射策略（与 strategy-academy 课程结构对齐）：
 *   - BB 防御类（bb + call-vs-raise / 3bet）→ l2-bb-defense
 *   - 3bet/4bet 类                          → l2-3bet-basics / l2-4bet-strategy
 *   - open 类（任意位置）                    → l1-hand-selection（手牌选择基础）
 *   - 无法映射                              → undefined（不显示跳转链接）
 */
function inferRelatedLessonId(position: string, actionType: string): string | undefined {
  const pos = position.toLowerCase();
  const act = actionType.toLowerCase();

  // BB 防御场景
  if (pos === 'bb') {
    if (act.includes('3bet')) return 'l2-bb-defense';
    if (act.includes('call')) return 'l2-bb-defense';
  }
  // 3bet / 4bet 场景
  if (act.includes('4bet')) return 'l2-4bet-strategy';
  if (act.includes('3bet')) return 'l2-3bet-basics';
  // 开池场景 → 回到手牌选择基础
  if (act.includes('open')) return 'l1-hand-selection';
  return undefined;
}

/**
 * P2-2.3: 根据答题对错与题目构造五级 DecisionFeedback。
 *
 * range-trainer 题目没有 evLoss 字段，使用以下默认映射：
 *  - 答对（选中最优动作）→ 'best'（evLoss=0）
 *  - 答错 → 'wrong'（默认 evLoss=3 BB，落在 wrong 2-5 区间）
 *
 * P4 修复：从 question.position + question.context（格式 `${pos} ${actionType}`）
 *         推导 relatedLessonId，贯通"训练→课程"反馈闭环。
 *
 * 调用方可在答题后调用本函数，将结果作为 QuizCard 的 decisionFeedback prop 传入。
 */
export function buildRangeFeedback(
  isCorrect: boolean,
  question: QuizQuestion,
): DecisionFeedback {
  const correctAction = question.correctAction;
  const explanation = isCorrect
    ? ''
    : `最优动作是 ${correctAction}。`;

  // 从 context（格式 `${position} ${actionType}`）解析 actionType
  let actionType = '';
  if (question.context) {
    const parts = question.context.split(' ');
    actionType = parts.slice(1).join(' ');
  }
  const relatedLessonId = inferRelatedLessonId(question.position, actionType);

  return buildDecisionFeedback({
    isCorrect,
    correctAction,
    explanation,
    relatedLessonId,
  });
}

export function useQuizEngine() {
  const quizState = useRangeTrainerStore((s) => s.quizState);
  const answerQuestion = useRangeTrainerStore((s) => s.answerQuestion);
  const nextQuestion = useRangeTrainerStore((s) => s.nextQuestion);
  const pauseQuiz = useRangeTrainerStore((s) => s.pauseQuiz);
  const resumeQuiz = useRangeTrainerStore((s) => s.resumeQuiz);
  const endQuiz = useRangeTrainerStore((s) => s.endQuiz);
  const resetQuiz = useRangeTrainerStore((s) => s.resetQuiz);

  // P1-2.4: ELO 能力分级 — range-trainer 维度=preflop
  const updateElo = useProgressStore((s) => s.updateElo);
  const preflopElo = useProgressStore((s) => s.elo.preflop);

  // P2-5.2: 情绪管理 — 记录答题用于连续答错检测与每日题量统计
  const recordAnswerForEmotion = useProgressStore((s) => s.recordAnswer);
  // P4 修复（4.5-P0）：自适应难度降级判断
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  const consecutiveWrongCount = useProgressStore((s) => s.emotion.consecutiveWrongCount);

  const getCurrentQuestion = useCallback((): QuizQuestion | null => {
    if (quizState.currentIndex >= quizState.questions.length) return null;
    return quizState.questions[quizState.currentIndex] ?? null;
  }, [quizState.currentIndex, quizState.questions]);

  const getScore = useMemo(() => {
    const answered = quizState.answers.filter((a) => a !== null).length;
    const correct = quizState.isCorrect.filter(Boolean).length;
    const wrong = answered - correct;
    return { correct, wrong, total: answered };
  }, [quizState.answers, quizState.isCorrect]);

  const getProgress = useMemo(() => {
    if (quizState.questions.length === 0) return 0;
    return (quizState.currentIndex / quizState.questions.length) * 100;
  }, [quizState.currentIndex, quizState.questions.length]);

  const checkAnswer = useCallback(
    (action: RangeAction): boolean => {
      const question = getCurrentQuestion();
      if (!question) return false;
      return action === question.correctAction;
    },
    [getCurrentQuestion],
  );

  const getElapsedTime = useMemo(() => {
    return quizState.timePerQuestion.reduce((a, b) => a + b, 0);
  }, [quizState.timePerQuestion]);

  const getAverageTime = useMemo(() => {
    const answered = quizState.timePerQuestion.filter((t) => t > 0);
    if (answered.length === 0) return 0;
    return answered.reduce((a, b) => a + b, 0) / answered.length;
  }, [quizState.timePerQuestion]);

  const isCurrentAnswered = quizState.answers[quizState.currentIndex] !== null;

  const currentAnswer = quizState.answers[quizState.currentIndex] ?? null;

  const buildResult = useCallback((): TrainingResult => {
    const details: QuestionResult[] = quizState.questions.map((q, i) => ({
      question: q.hand,
      isCorrect: quizState.isCorrect[i] ?? false,
      timeTaken: quizState.timePerQuestion[i] ?? 0,
      userAnswer: quizState.answers[i] ?? 'none',
      correctAnswer: q.correctAction,
    }));

    const answeredCount = quizState.answers.filter((a) => a !== null).length;
    const correctCount = quizState.isCorrect.filter(Boolean).length;

    // 最后一题是否答对：取已答的最后一题（rescue 题或原最后一题）
    // quiz 完成时至少答完 1 题；若 rescueUsed，最后一题就是 questions 末尾
    const lastAnsweredIndex = (() => {
      for (let i = quizState.answers.length - 1; i >= 0; i--) {
        if (quizState.answers[i] !== null) return i;
      }
      return -1;
    })();
    const lastQuestionCorrect =
      lastAnsweredIndex >= 0
        ? (quizState.isCorrect[lastAnsweredIndex] ?? false)
        : false;

    return {
      sessionId: `quiz-${Date.now()}`,
      module: 'range-trainer',
      totalQuestions: answeredCount,
      correctAnswers: correctCount,
      accuracy: answeredCount > 0 ? correctCount / answeredCount : 0,
      averageTime: getAverageTime,
      timestamp: Date.now(),
      details,
      lastQuestionCorrect,
    };
  }, [quizState, getAverageTime]);

  // P1-2.4: 在答题后调用 updateElo 更新 preflop 维度 ELO
  // 难度推断：range-trainer 题目无 difficulty 字段，根据当前 preflop ELO 推断
  // （高分用户对应高难度题目，简化映射：ELO 0-3000 → 难度 0-1）
  const recordEloForAnswer = useCallback(
    (isCorrect: boolean, difficulty?: number) => {
      const diff =
        typeof difficulty === 'number'
          ? Math.min(1, Math.max(0, difficulty))
          : Math.min(1, Math.max(0, preflopElo / 3000));
      updateElo('preflop', isCorrect, diff);
    },
    [updateElo, preflopElo]
  );

  // P1-3.1: SRS 集成 — 答题后将该题注册/更新到复习队列
  // quality 评分：答对且用时<5秒→5，答对→4，答错但接近→2，答错→1
  // （range-trainer 只有 fold/call/raise，"答错但接近"无判定依据，统一为 1）
  // 调用方在 handleAnswer 中答题后调用，与 recordEloForAnswer 并列
  const addReviewItem = useProgressStore((s) => s.addReviewItem);
  const updateReviewItem = useProgressStore((s) => s.updateReviewItem);
  const reviewItems = useProgressStore((s) => s.reviewItems);

  const recordSrsForAnswer = useCallback(
    (question: QuizQuestion, isCorrect: boolean, timeTakenMs: number) => {
      // 题目 → ReviewItem 映射：使用 position:hand 作为 id，label 显示场景
      const id = `range:${question.position}:${question.hand}`;
      const label = `${question.hand} @ ${question.position}${question.context ? ` (${question.context})` : ''}`;
      const metadata = {
        front: `${question.hand} 在 ${question.position} 该如何行动？`,
        back: question.correctAction,
        options: [
          { text: '弃牌 Fold', isCorrect: question.correctAction === 'fold' },
          { text: '跟注 Call', isCorrect: question.correctAction === 'call' },
          { text: '加注 Raise', isCorrect: question.correctAction === 'raise' },
        ],
        source: 'range' as const,
      };

      const existing = reviewItems.find((r) => r.id === id);
      const baseItem: ReviewItem = existing
        ? existing
        : createReviewItem(id, label, 'range', metadata);

      // quality 映射：答对+快→5，答对→4，答错→1
      const quality = isCorrect ? (timeTakenMs < 5000 ? 5 : 4) : 1;
      const updated = processReview(baseItem, quality);

      if (existing) {
        updateReviewItem(updated);
      } else {
        addReviewItem(updated);
      }
    },
    [reviewItems, addReviewItem, updateReviewItem]
  );

  return {
    // State
    quizState,
    getCurrentQuestion,
    getScore,
    getProgress,
    checkAnswer,
    getElapsedTime,
    getAverageTime,
    isCurrentAnswered,
    currentAnswer,
    buildResult,
    // Easy-question 辅助（供调用方使用）
    getEasyQuestion,

    // P2-2.3: 五级反馈构造（调用方在 handleAnswer 中答题后调用）
    buildRangeFeedback,

    // Actions
    answerQuestion,
    nextQuestion,
    pauseQuiz,
    resumeQuiz,
    endQuiz,
    resetQuiz,

    // P1-2.4: ELO 更新（调用方在 handleAnswer 中答题后调用）
    recordEloForAnswer,

    // P1-3.1: SRS 更新（调用方在 handleAnswer 中答题后调用）
    recordSrsForAnswer,

    // P2-5.2: 情绪管理 — 答题记录（调用方在 handleAnswer 中答题后调用）
    recordAnswerForEmotion,

    // P4 修复（4.5-P0）：自适应难度降级信号
    // 当 consecutiveWrongCount >= 3 时为 true，调用方应降低难度（如切到更前位置/更简单 actionType）
    shouldDownshiftDifficulty,
    consecutiveWrongCount,
  };
}
