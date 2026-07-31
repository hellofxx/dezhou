/**
 * 谜题会话共享接线（P1-D 修复批从 PuzzleRush / DailyPuzzle / ThemeDrill
 * 三组件的相同实现去重下沉，同时满足单文件 ≤200 行）：
 *
 * - 选中项状态（题切换时重置）
 * - 每题作答 → progress.recordAnswer（自适应难度判定输入）
 * - 会话结束 → buildResult → store.submitResult → onComplete 钩子
 *   → progress.recordTrainingDay → trainingEvents.emit（单处 emit，口径与
 *   buildPuzzleResult / puzzleResultToTrainingRecord 同源）
 * - 重试（onRetry 钩子 + engine.reset）
 */
import { useEffect, useState } from 'react';
import { useProgressStore } from '@/features/progress/store';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { usePuzzleStore } from '../store';
import { puzzleResultToTrainingRecord } from '../utils/trainingRecord';
import type { PuzzleResult } from '../types';
import type { UsePuzzleEngineReturn } from './usePuzzleEngine';

/** 结果页附加破纪录标记（组件内部流转，不落盘） */
export type EnrichedPuzzleResult = PuzzleResult & { _isNewRecord?: boolean };

interface UsePuzzleSessionOptions {
  /** 会话完成时（submitResult 之后、emit 之前）执行，如 Daily 的 markDailyCompleted */
  onComplete?: (result: PuzzleResult) => void;
  /** 重试时（reset 之前）执行，如 Daily 的 setToday 刷新 */
  onRetry?: () => void;
}

export function usePuzzleSession(
  engine: UsePuzzleEngineReturn,
  options: UsePuzzleSessionOptions = {}
) {
  const submitResult = usePuzzleStore((s) => s.submitResult);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);

  const [finalResult, setFinalResult] = useState<EnrichedPuzzleResult | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

  // 当题切换时重置选中项
  useEffect(() => {
    setSelectedOptionId(null);
  }, [engine.state.currentIndex]);

  // 记录答题到 progress store（用于自适应难度判定）
  useEffect(() => {
    if (engine.state.answers.length > 0) {
      const lastAnswer = engine.state.answers[engine.state.answers.length - 1];
      if (lastAnswer) {
        recordAnswer(lastAnswer.isCorrect);
      }
    }
    // 仅在新增作答时触发一次（与原三组件实现同 deps 口径）
  }, [engine.state.answers.length]);

  // 引擎结束时构建结果并提交（finalResult 非空后不重复执行）
  useEffect(() => {
    if (engine.state.status !== 'playing' && !finalResult) {
      const result = engine.buildResult();
      const submitRes = submitResult(result);
      options.onComplete?.(result);
      // 计入 Streak（一次完整谜题会话算一次训练）
      recordTrainingDay();
      setFinalResult({ ...result, _isNewRecord: submitRes.isNewRecord });
      // 发布训练事件到 progress store
      trainingEvents.emit(puzzleResultToTrainingRecord(result));
    }
    // onComplete 为调用方内联钩子，不入 deps（finalResult 非空后不重复执行）
  }, [engine.state.status, engine, finalResult, submitResult, recordTrainingDay]);

  const handleSelect = (optionId: string) => {
    if (engine.isCurrentAnswered) return;
    setSelectedOptionId(optionId);
    engine.answer(optionId);
  };

  const handleRetry = () => {
    options.onRetry?.();
    setFinalResult(null);
    engine.reset();
  };

  return { finalResult, selectedOptionId, handleSelect, handleRetry };
}
