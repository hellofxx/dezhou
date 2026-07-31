import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Position } from '@/shared/types/position';
import type { TrainingResult } from '@/shared/types/common';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { HelpCircle, Zap, Clock, Hash } from 'lucide-react';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import { useProgressStore } from '@/features/progress/store';
import { TrainingSession } from './TrainingSession';
import { SessionResult } from './SessionResult';
import { useRangeTrainerStore } from '../store';
import { SIX_MAX_POSITIONS, ACTION_TYPES } from '../constants';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';

type Phase = 'config' | 'training' | 'result';

const TIME_OPTIONS = [
  { value: '0', label: '无限时' },
  { value: '5', label: '5 秒' },
  { value: '10', label: '10 秒' },
  { value: '15', label: '15 秒' },
  { value: '30', label: '30 秒' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: '10', label: '10 题' },
  { value: '20', label: '20 题' },
  { value: '30', label: '30 题' },
  { value: '50', label: '50 题' },
];

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

  const handleStart = useCallback(() => {
    startQuiz(position, actionType, timeLimit, questionCount);
    setPhase('training');
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
    resetQuiz();
    startQuiz(position, actionType, timeLimit, questionCount);
    setResult(null);
    setPhase('training');
  }, [position, actionType, timeLimit, questionCount, startQuiz, resetQuiz]);

  const handleBackToHome = useCallback(() => {
    resetQuiz();
    navigate('/range-trainer');
  }, [navigate, resetQuiz]);

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

  // ─── 配置阶段 ────────────────────────────────────────
  return (
    <div className="h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[var(--surface)] border-[var(--surface-raised)]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 w-12 h-12 rounded-xl bg-[var(--brass)]/10 flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-[var(--brass)]" />
          </div>
          <CardTitle className="text-xl">范围测验</CardTitle>
          <CardDescription>
            测试你对各位置开牌范围的掌握程度
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 位置选择 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--ivory-muted)]">
              <Zap className="w-4 h-4" />
              位置
            </label>
            <Select value={position} onValueChange={(v) => setPosition(v as Position)}>
              <SelectTrigger className="bg-[var(--background)] border-[var(--surface-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SIX_MAX_POSITIONS.filter((p) => p !== Position.BB).map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 动作类型 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--ivory-muted)]">
              <Zap className="w-4 h-4" />
              动作类型
            </label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="bg-[var(--background)] border-[var(--surface-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map((at) => (
                  <SelectItem key={at.value} value={at.value}>
                    {at.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 每题限时 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--ivory-muted)]">
              <Clock className="w-4 h-4" />
              每题限时
            </label>
            <Select value={String(timeLimit)} onValueChange={(v) => setTimeLimit(Number(v))}>
              <SelectTrigger className="bg-[var(--background)] border-[var(--surface-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 题目数量 */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-[var(--ivory-muted)]">
              <Hash className="w-4 h-4" />
              题目数量
            </label>
            <Select value={String(questionCount)} onValueChange={(v) => setQuestionCount(Number(v))}>
              <SelectTrigger className="bg-[var(--background)] border-[var(--surface-raised)]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_COUNT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 开始按钮 */}
          <Button
            onClick={handleStart}
            className="w-full bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] h-12 text-base font-semibold font-display tracking-wide"
          >
            开始训练
          </Button>

          <p className="text-xs text-center text-[var(--ivory-dim)]">
            快捷键：1=Fold · 2=Call · 3=Raise · Esc=暂停
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
