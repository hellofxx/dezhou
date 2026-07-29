/**
 * 谜题引擎：管理题目流、计时、命、连对奖励时间。
 *
 * 三种模式：
 *  - rush:  限时冲刺（连对 5 题 +10 秒，答错扣 1 命）
 *  - daily: 每日谜题（无命/无时间，答完所有题结束）
 *  - theme: 主题训练（无命/无时间，答完所有题结束）
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  PuzzleAnswerRecord,
  PuzzleEngineState,
  PuzzleQuestion,
  PuzzleResult,
  PuzzleSessionStatus,
} from '../types';
import type { UsePuzzleEngineOptions } from '../types';
import { calculateGrade } from '@/shared/types/decisionFeedback';
import { getDailyPuzzles } from '../data/dailyPuzzles';
import { getRushQuestions, RUSH_INITIAL_LIVES, RUSH_STREAK_THRESHOLD, RUSH_STREAK_BONUS } from '../data/rushQuestions';
import { getPuzzlesByTheme } from '../data/puzzleBank';

const RUSH_DEFAULT_DURATION = 3 * 60 * 1000; // 3 分钟

/**
 * P4 修复（4.2-P1-2）：根据谜题主题推导相关课程 ID。
 *
 * 映射策略（与 strategy-academy 课程结构对齐）：
 *   - preflop-rfi        → l1-hand-selection
 *   - big-blind-defense  → l2-bb-defense
 *   - three-bet          → l2-3bet-basics
 *   - c-bet              → l3-cbet
 *   - flush-draw         → l3-draws
 *   - river-value        → l3-bet-sizing
 *   - bluff              → l3-bluffing
 *   - short-stack        → l2-short-stack
 *   - icm                → l2-short-stack
 *   - multiway           → l3-multistreet
 */
function inferPuzzleLessonId(theme: string): string | undefined {
  switch (theme) {
    case 'preflop-rfi': return 'l1-hand-selection';
    case 'big-blind-defense': return 'l2-bb-defense';
    case 'three-bet': return 'l2-3bet-basics';
    case 'c-bet': return 'l3-cbet';
    case 'flush-draw': return 'l3-draws';
    case 'river-value': return 'l3-bet-sizing';
    case 'bluff': return 'l3-bluffing';
    case 'short-stack': return 'l2-short-stack';
    case 'icm': return 'l6-icm';
    case 'multiway': return 'l3-multistreet';
    default: return undefined;
  }
}

function buildInitialState(opts: UsePuzzleEngineOptions): PuzzleEngineState {
  let questions: PuzzleQuestion[] = [];

  if (opts.mode === 'rush') {
    questions = getRushQuestions(30);
  } else if (opts.mode === 'daily') {
    questions = getDailyPuzzles();
  } else if (opts.mode === 'theme' && opts.theme) {
    questions = getPuzzlesByTheme(opts.theme);
    if (opts.questionCount && opts.questionCount > 0) {
      questions = questions.slice(0, opts.questionCount);
    }
  }

  const duration = opts.mode === 'rush' ? (opts.duration ?? RUSH_DEFAULT_DURATION) : 0;
  const enableLives = opts.mode === 'rush' && (opts.enableLives ?? true);

  return {
    questions,
    currentIndex: 0,
    correctCount: 0,
    wrongCount: 0,
    lives: enableLives ? RUSH_INITIAL_LIVES : 0,
    streak: 0,
    startTime: Date.now(),
    endTime: null,
    timeRemaining: duration,
    status: 'playing',
    answers: [],
    bonusAwarded: 0,
  };
}

export interface UsePuzzleEngineReturn {
  state: PuzzleEngineState;
  /** 当前题目（无题目时 null） */
  currentQuestion: PuzzleQuestion | null;
  /** 提交选项 */
  answer: (optionId: string) => void;
  /** 进入下一题（仅当当前题已答完时有效） */
  next: () => void;
  /** 主动结束（用于退出按钮） */
  end: () => void;
  /** 重置引擎（用于"再试一次"） */
  reset: () => void;
  /** 是否已答当前题 */
  isCurrentAnswered: boolean;
  /** 当前题的答题记录（已答时返回，否则 null） */
  currentAnswer: PuzzleAnswerRecord | null;
  /** 构建结果对象（用于持久化与结果页） */
  buildResult: () => PuzzleResult;
  /** 最近一次连对奖励反馈（毫秒），用于 UI 显示"⚡ +10s" */
  lastBonus: number;
  /** 清除最近一次奖励反馈 */
  clearBonus: () => void;
}

export function usePuzzleEngine(options: UsePuzzleEngineOptions): UsePuzzleEngineReturn {
  const [state, setState] = useState<PuzzleEngineState>(() => buildInitialState(options));
  const [lastBonus, setLastBonus] = useState(0);

  // 当前题开始时间（用于计算单题用时）
  const questionStartRef = useRef<number>(Date.now());

  // Rush 模式倒计时
  useEffect(() => {
    if (options.mode !== 'rush') return;
    if (state.status !== 'playing') return;

    const intervalId = setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'playing') return prev;
        const elapsed = 1000; // 每秒减 1 秒
        const nextRemaining = Math.max(0, prev.timeRemaining - elapsed);
        if (nextRemaining <= 0) {
          return { ...prev, timeRemaining: 0, status: 'completed' as PuzzleSessionStatus, endTime: Date.now() };
        }
        return { ...prev, timeRemaining: nextRemaining };
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [options.mode, state.status]);

  const currentQuestion = useMemo<PuzzleQuestion | null>(() => {
    if (state.currentIndex >= state.questions.length) return null;
    return state.questions[state.currentIndex] ?? null;
  }, [state.currentIndex, state.questions]);

  const isCurrentAnswered = useMemo(() => {
    const currentId = currentQuestion?.id;
    if (!currentId) return false;
    return state.answers.some((a) => a.questionId === currentId);
  }, [currentQuestion, state.answers]);

  const currentAnswer = useMemo<PuzzleAnswerRecord | null>(() => {
    const currentId = currentQuestion?.id;
    if (!currentId) return null;
    return state.answers.find((a) => a.questionId === currentId) ?? null;
  }, [currentQuestion, state.answers]);

  const answer = useCallback(
    (optionId: string) => {
      setState((prev) => {
        if (prev.status !== 'playing') return prev;
        const q = prev.questions[prev.currentIndex];
        if (!q) return prev;

        // 已答过当前题，幂等
        if (prev.answers.some((a) => a.questionId === q.id)) return prev;

        const option = q.options.find((o) => o.id === optionId);
        if (!option) return prev;

        const timeTaken = Date.now() - questionStartRef.current;
        const evLoss = option.evLoss ?? 0;
        const grade = calculateGrade(evLoss);
        const record: PuzzleAnswerRecord = {
          questionId: q.id,
          selectedOptionId: optionId,
          isCorrect: option.isCorrect,
          timeTaken,
          grade,
          evLoss,
          // P4 修复（4.2-P1-2）：附加相关课程 ID，供 UI 显示"去复习"链接
          relatedLessonId: inferPuzzleLessonId(q.theme),
        };

        const newAnswers = [...prev.answers, record];
        const newCorrectCount = prev.correctCount + (option.isCorrect ? 1 : 0);
        const newWrongCount = prev.wrongCount + (option.isCorrect ? 0 : 1);
        const newStreak = option.isCorrect ? prev.streak + 1 : 0;
        const newLives = options.mode === 'rush' && !option.isCorrect
          ? Math.max(0, prev.lives - 1)
          : prev.lives;

        // Rush 模式：连对 5 题奖励 +10 秒
        let bonus = 0;
        if (options.mode === 'rush' && newStreak > 0 && newStreak % RUSH_STREAK_THRESHOLD === 0) {
          bonus = RUSH_STREAK_BONUS;
          setLastBonus(bonus);
        }

        const newTimeRemaining = options.mode === 'rush'
          ? prev.timeRemaining + bonus
          : prev.timeRemaining;

        return {
          ...prev,
          answers: newAnswers,
          correctCount: newCorrectCount,
          wrongCount: newWrongCount,
          streak: newStreak,
          lives: newLives,
          timeRemaining: newTimeRemaining,
          bonusAwarded: prev.bonusAwarded + bonus,
        };
      });
    },
    [options.mode]
  );

  const next = useCallback(() => {
    setState((prev) => {
      if (prev.status !== 'playing') return prev;
      const currentId = prev.questions[prev.currentIndex]?.id;
      // 当前题未答，不允许前进
      if (!currentId || !prev.answers.some((a) => a.questionId === currentId)) return prev;

      const nextIndex = prev.currentIndex + 1;

      // 没有下一题：完成
      if (nextIndex >= prev.questions.length) {
        return { ...prev, currentIndex: nextIndex, status: 'completed' as PuzzleSessionStatus, endTime: Date.now() };
      }

      // Rush 模式：命耗尽则失败结束
      if (options.mode === 'rush' && prev.lives <= 0) {
        return { ...prev, status: 'failed' as PuzzleSessionStatus, endTime: Date.now() };
      }

      // 重置当前题开始时间
      questionStartRef.current = Date.now();
      return { ...prev, currentIndex: nextIndex };
    });
  }, [options.mode]);

  const end = useCallback(() => {
    setState((prev) =>
      prev.status === 'playing'
        ? { ...prev, status: 'completed' as PuzzleSessionStatus, endTime: Date.now() }
        : prev
    );
  }, []);

  const reset = useCallback(() => {
    setState(buildInitialState(options));
    setLastBonus(0);
    questionStartRef.current = Date.now();
  }, [options]);

  const clearBonus = useCallback(() => setLastBonus(0), []);

  // 检测 Rush 模式命耗尽自动结束（在 next 调用前的状态机检查）
  useEffect(() => {
    if (options.mode !== 'rush') return;
    if (state.status !== 'playing') return;
    if (state.lives <= 0) {
      // 检查当前题已答完（即答错导致命归 0 的那一题已结算）
      const currentId = state.questions[state.currentIndex]?.id;
      const answered = currentId
        ? state.answers.some((a) => a.questionId === currentId)
        : false;
      if (answered) {
        // 等待用户看到反馈后手动 next；不强制结束
      }
    }
  }, [options.mode, state.lives, state.status, state.answers, state.questions, state.currentIndex]);

  const buildResult = useCallback<() => PuzzleResult>(() => {
    const duration = (state.endTime ?? Date.now()) - state.startTime;
    const totalAnswered = state.answers.length;
    const accuracy = totalAnswered > 0 ? state.correctCount / totalAnswered : 0;
    const averageTime = totalAnswered > 0
      ? state.answers.reduce((sum, a) => sum + a.timeTaken, 0) / totalAnswered
      : 0;

    // Puzzle Rush 分数：答对 × 100 + 剩余时间(秒) × 10 + 剩余命 × 200
    const score = options.mode === 'rush'
      ? state.correctCount * 100 + Math.floor(state.timeRemaining / 1000) * 10 + state.lives * 200
      : state.correctCount * 100;

    return {
      sessionId: `puzzle-${options.mode}-${Date.now()}`,
      mode: options.mode,
      theme: options.theme,
      totalQuestions: state.questions.length,
      correctCount: state.correctCount,
      wrongCount: state.wrongCount,
      accuracy,
      duration,
      averageTime,
      score,
      timestamp: Date.now(),
      answers: state.answers,
      questions: state.questions,
      status: state.status,
    };
  }, [options.mode, options.theme, state]);

  return {
    state,
    currentQuestion,
    answer,
    next,
    end,
    reset,
    isCurrentAnswered,
    currentAnswer,
    buildResult,
    lastBonus,
    clearBonus,
  };
}
