import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Position } from '@/shared/types/position';
import type { TrainingResult } from '@/shared/types/common';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useProgressStore } from '@/features/progress/store';
import { TrainingSession } from './TrainingSession';
import { SessionResult } from './SessionResult';
import { QuizConfig } from './QuizConfig';
import { useRangeTrainerStore } from '../store';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/shared/components/gate/SessionLimitGuard';

type Phase = 'config' | 'training' | 'result';

export default function RangeQuizPage() {
  const navigate = useNavigate();
  const startQuiz = useRangeTrainerStore((s) => s.startQuiz);
  const resetQuiz = useRangeTrainerStore((s) => s.resetQuiz);

  const [phase, setPhase] = useState<Phase>('config');
  const [result, setResult] = useState<TrainingResult | null>(null);

  // 配置状态
  const [position, setPosition] = useState<Position>(Position.UTG);
  const [actionType, setActionType] = useState('open');
  const [timeLimit, setTimeLimit] = useState(10);
  const [questionCount, setQuestionCount] = useState(20);

  // Streak 记账：训练完成时计入每日连续训练（recordTrainingDay 内部幂等并检查里程碑）
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练
  const sessionLimitReached = useSessionLimitReached();

  // P1A-01 修复：startQuiz 生成 0 题时返回 false，不切换 phase（停留在配置页）
  const handleStart = useCallback(() => {
    if (startQuiz(position, actionType, timeLimit, questionCount)) {
      setPhase('training');
    }
  }, [position, actionType, timeLimit, questionCount, startQuiz]);

  const handleComplete = useCallback((r: TrainingResult) => {
    setResult(r);
    setPhase('result');
    // 发布训练事件到 progress store
    trainingEvents.emit({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      module: 'range-trainer',
      mode: 'quiz',
      result: r,
      createdAt: Date.now(),
    });
    // 计入每日连续训练（与 puzzle / theory 模块同模式：完成时同步调用，不走事件总线）
    recordTrainingDay();
  }, [recordTrainingDay]);

  const handleRetry = useCallback(() => {
    // P1A-09：resetQuiz 保留 handWeights，"再练一次"保住间隔重复加权
    resetQuiz();
    setResult(null);
    if (startQuiz(position, actionType, timeLimit, questionCount)) {
      setPhase('training');
    } else {
      setPhase('config');
    }
  }, [position, actionType, timeLimit, questionCount, startQuiz, resetQuiz]);

  const handleBackToHome = useCallback(() => {
    resetQuiz();
    navigate('/range-trainer');
  }, [navigate, resetQuiz]);

  // P1A-04：中途退出统一走此路径 —— 仅 resetQuiz 回配置页，不入账、不 emit、不计 streak
  const handleExit = useCallback(() => {
    resetQuiz();
    setPhase('config');
  }, [resetQuiz]);

  // 止损早退必须位于全部 hooks 之后：守卫状态在挂载期间翻转（答题中达上限/
  // 调试开关切换）时，hooks 数量变化会触发 "Rendered fewer hooks" 崩溃
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  // ─── 训练阶段 ────────────────────────────────────────
  if (phase === 'training') {
    return (
      <TrainingSession
        position={position}
        actionType={actionType}
        timeLimit={timeLimit}
        totalQuestions={questionCount}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    );
  }

  // ─── 结果阶段 ────────────────────────────────────────
  if (phase === 'result' && result) {
    return (
      <SessionResult
        result={result}
        onRetry={handleRetry}
        onBackToHome={handleBackToHome}
      />
    );
  }

  // ─── 配置阶段（P1A-01/05/10：选项过滤 + 位置解锁门禁见 QuizConfig）─────
  return (
    <QuizConfig
      position={position}
      actionType={actionType}
      timeLimit={timeLimit}
      questionCount={questionCount}
      onPositionChange={setPosition}
      onActionTypeChange={setActionType}
      onTimeLimitChange={setTimeLimit}
      onQuestionCountChange={setQuestionCount}
      onStart={handleStart}
    />
  );
}
