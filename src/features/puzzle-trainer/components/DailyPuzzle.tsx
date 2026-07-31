/**
 * 每日谜题：基于日期种子，当天题目固定。
 *
 * - 完成后显示详细解析（已在 PuzzleCard 内实现）
 * - 完成状态持久化（在 store 中记录 dailyCompleted: { [dateKey]: true }）
 * - 当日重复做不改变完成状态（已完成时显示"今日已完成 ✓"但仍可查看题目）
 * - 显示"今日已有 XXX 人完成"（基于 dateSeed 生成 100-999 之间）
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Users } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { PuzzleCard } from './PuzzleCard';
import { PuzzleResult } from './PuzzleResult';
import { usePuzzleEngine } from '../hooks/usePuzzleEngine';
import { getDailyKey } from '../data/dailyPuzzles';
import { getDailyCompletionCount } from '../utils/dateSeed';
import { usePuzzleStore } from '../store';
import { useProgressStore } from '@/features/progress/store';
// P2-5.4: Session 止损守卫（谜题三模式与其他训练模块同口径）
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingResult } from '@/shared/types/common';
import type { PuzzleResult as PuzzleResultType } from '../types';

export default function DailyPuzzle() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 获取今日题目（用于引擎初始化前显示日期信息）
  const today = useMemo(() => new Date(), []);
  const dateKey = useMemo(() => getDailyKey(today), [today]);
  const completionCount = useMemo(() => getDailyCompletionCount(today), [today]);

  const engine = usePuzzleEngine({ mode: 'daily' });
  const isDailyCompleted = usePuzzleStore((s) => s.isDailyCompleted);
  const markDailyCompleted = usePuzzleStore((s) => s.markDailyCompleted);
  const submitResult = usePuzzleStore((s) => s.submitResult);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P2-5.4: 每日题量上限（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

  const alreadyCompleted = isDailyCompleted(dateKey);
  const [finalResult, setFinalResult] = useState<PuzzleResultType | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);

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
  }, [engine.state.answers.length]);

  // 引擎结束时构建结果并提交
  useEffect(() => {
    if (engine.state.status !== 'playing' && !finalResult) {
      const result = engine.buildResult();
      const submitRes = submitResult(result);
      markDailyCompleted(dateKey); // 标记今日已完成（幂等）
      recordTrainingDay();
      setFinalResult({ ...result, _isNewRecord: submitRes.isNewRecord } as PuzzleResultType & { _isNewRecord: boolean });
      // 发布训练事件到 progress store
      trainingEvents.emit(puzzleResultToTrainingRecord(result));
    }
  }, [engine.state.status, engine, finalResult, submitResult, markDailyCompleted, dateKey, recordTrainingDay]);

  const handleSelect = (optionId: string) => {
    if (engine.isCurrentAnswered) return;
    setSelectedOptionId(optionId);
    engine.answer(optionId);
  };

  const handleNext = () => {
    engine.next();
  };

  // 每日题量上限：未完局时拦截继续答题（已完局的结果页不拦）；
  // 早退位于全部 hooks 之后，避免守卫翻转触发 hooks 数量变化崩溃
  if (!finalResult && sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  if (finalResult) {
    const enriched = finalResult as PuzzleResultType & { _isNewRecord?: boolean };
    return (
      <PuzzleResult
        result={enriched}
        isNewRecord={Boolean(enriched._isNewRecord)}
        onRetry={() => {
          setFinalResult(null);
          engine.reset();
        }}
        onBackHome={() => navigate('/puzzle')}
      />
    );
  }

  if (!engine.currentQuestion) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--ivory-muted)]">
        {t('puzzle.daily.noQuestions')}
      </div>
    );
  }

  const progressValue =
    engine.state.questions.length > 0
      ? ((engine.state.currentIndex + (engine.isCurrentAnswered ? 1 : 0)) / engine.state.questions.length) * 100
      : 0;

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-4 py-4 space-y-3">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--ivory-dim)] hover:text-[var(--ivory)]"
            onClick={() => navigate('/puzzle')}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('puzzle.common.exit')}
          </Button>
          <h2 className="font-display text-base text-[var(--ivory)] tracking-wide">
            {t('puzzle.daily.title')}
          </h2>
          <div className="text-xs text-[var(--ivory-dim)] font-numeric">{dateKey}</div>
        </div>

        {/* 状态卡片：完成人数 + 今日已完成 */}
        <Card className="bg-[var(--surface)] border-[var(--walnut-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-sm)]">
          <CardContent className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-[var(--brass-bright)]" />
              <span className="text-[var(--ivory-muted)]">
                {t('puzzle.daily.completionCount', { count: completionCount })}
              </span>
            </div>
            {alreadyCompleted && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--success)]/15 text-[var(--success)] text-xs font-display"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {t('puzzle.daily.alreadyCompleted')}
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* 进度条 */}
        <Progress
          value={progressValue}
          className="h-1.5 [&_[class*=indicator]]:bg-[var(--brass-bright)]"
        />

        {/* 连续答错降级提示 */}
        {shouldDownshiftDifficulty() && (
          <div className="px-4 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
            {t('puzzle.common.downshiftHint')}
          </div>
        )}

        {/* 题目卡片 */}
        <PuzzleCard
          question={engine.currentQuestion}
          answerRecord={engine.currentAnswer}
          selectedOptionId={selectedOptionId}
          onSelectOption={handleSelect}
          onNext={handleNext}
          isLastQuestion={engine.state.currentIndex >= engine.state.questions.length - 1}
          questionProgress={{
            current: engine.state.currentIndex + 1,
            total: engine.state.questions.length,
          }}
        />

        {/* 实时分数 */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs text-[var(--ivory-dim)]">
          <span>
            {t('puzzle.common.correct')}: <span className="font-numeric text-[var(--success)]">{engine.state.correctCount}</span>
          </span>
          <span>
            {t('puzzle.common.wrong')}: <span className="font-numeric text-[var(--clay)]">{engine.state.wrongCount}</span>
          </span>
        </div>

        {/* 提示：今日题目固定 */}
        <p className="text-center text-[10px] text-[var(--ivory-dim)]/70 pt-1">
          {t('puzzle.daily.fixedHint')}
        </p>
      </div>
    </div>
  );
}

/** 将 PuzzleResult 转换为 TrainingRecord 用于 trainingEvents.emit */
function puzzleResultToTrainingRecord(result: PuzzleResultType) {
  const trainingResult: TrainingResult = {
    sessionId: result.sessionId,
    module: 'puzzle-trainer',
    totalQuestions: result.totalQuestions,
    correctAnswers: result.correctCount,
    accuracy: result.accuracy,
    averageTime: result.averageTime / 1000, // 转换为秒
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
