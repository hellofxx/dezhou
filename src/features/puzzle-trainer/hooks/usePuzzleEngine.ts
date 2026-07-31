/**
 * 谜题引擎：管理题目流、计时、命、连对奖励时间。
 *
 * 三种模式：
 *  - rush:  限时冲刺（连对 5 题 +10 秒，答错扣 1 命）
 *  - daily: 每日谜题（无命/无时间，答完所有题结束）
 *  - theme: 主题训练（无命/无时间，答完所有题结束）
 *
 * 纯逻辑（初始状态 / 作答结算 / 分数与结果口径）已拆至 puzzleEngineCore.ts。
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
import {
  applyAnswer,
  buildInitialState,
  buildPuzzleResult,
  RUSH_DEFAULT_DURATION,
} from './puzzleEngineCore';

/**
 * P4 修复（4.2-P1-2）：根据谜题主题推导相关课程 ID。
 * 10 个主题全部映射到语义相关课程（与 strategy-academy 课程结构对齐）；
 * 本 switch 即映射唯一事实源。
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

export interface UsePuzzleEngineReturn {
  state: PuzzleEngineState;
  /** 当前题目（无题目时 null） */
  currentQuestion: PuzzleQuestion | null;
  /** 提交选项 */
  answer: (optionId: string) => void;
  /** 进入下一题（仅当当前题已答完时有效） */
  next: () => void;
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

  const rushDuration = options.mode === 'rush' ? (options.duration ?? RUSH_DEFAULT_DURATION) : 0;
  const livesEnabled = options.mode === 'rush' && (options.enableLives ?? true);

  // Rush 模式倒计时
  //
  // P1D-03 修复：改 Date.now() 段式基准（对齐 range-trainer useTimer 的 P1A-12 口径）。
  // 旧实现每 tick 固定 -1000ms，后台标签页 interval 被节流后计时实际暂停，可切后台作弊；
  // 现剩余时间 = 总时长 + 累计连对奖励(bonusAwarded) - 墙钟耗时(now - startTime)，
  // 节流恢复后一次性追平。本引擎无暂停语义（reset 重建 startTime），墙钟基准恒有效。
  useEffect(() => {
    if (options.mode !== 'rush') return;
    if (state.status !== 'playing') return;

    const intervalId = setInterval(() => {
      setState((prev) => {
        if (prev.status !== 'playing') return prev;
        const elapsed = Date.now() - prev.startTime;
        const remaining = rushDuration + prev.bonusAwarded - elapsed;
        if (remaining <= 0) {
          // P1D-04 修复：归零瞬间若命已耗尽（如停留在答错反馈未点下一题），
          // 应判 failed 而非 completed，与 next() 的命耗尽判定同口径
          const status: PuzzleSessionStatus =
            livesEnabled && prev.lives <= 0 ? 'failed' : 'completed';
          return { ...prev, timeRemaining: 0, status, endTime: Date.now() };
        }
        return { ...prev, timeRemaining: remaining };
      });
    }, 250);

    return () => clearInterval(intervalId);
  }, [options.mode, state.status, rushDuration, livesEnabled]);

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
        const next = applyAnswer(prev, {
          optionId,
          mode: options.mode,
          questionStartedAt: questionStartRef.current,
          now: Date.now(),
          inferLessonId: inferPuzzleLessonId,
        });
        // 连对奖励反馈（幂等：重复结算时 next === prev，不触发）
        if (next !== prev && next.bonusAwarded > prev.bonusAwarded) {
          setLastBonus(next.bonusAwarded - prev.bonusAwarded);
        }
        return next;
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

      // P1D-04 修复：命耗尽判定前置于"无下一题"——
      // 末题答错致命归 0 时旧顺序会先命中"无下一题"误判 completed
      if (livesEnabled && prev.lives <= 0) {
        return { ...prev, status: 'failed' as PuzzleSessionStatus, endTime: Date.now() };
      }

      const nextIndex = prev.currentIndex + 1;

      // 没有下一题：完成
      if (nextIndex >= prev.questions.length) {
        return { ...prev, currentIndex: nextIndex, status: 'completed' as PuzzleSessionStatus, endTime: Date.now() };
      }

      // 重置当前题开始时间
      questionStartRef.current = Date.now();
      return { ...prev, currentIndex: nextIndex };
    });
  }, [livesEnabled]);

  const reset = useCallback(() => {
    setState(buildInitialState(options));
    setLastBonus(0);
    questionStartRef.current = Date.now();
  }, [options]);

  const clearBonus = useCallback(() => setLastBonus(0), []);

  const buildResult = useCallback<() => PuzzleResult>(
    () => buildPuzzleResult(state, options.mode, options.theme),
    [options.mode, options.theme, state]
  );

  return {
    state,
    currentQuestion,
    answer,
    next,
    reset,
    isCurrentAnswered,
    currentAnswer,
    buildResult,
    lastBonus,
    clearBonus,
  };
}
