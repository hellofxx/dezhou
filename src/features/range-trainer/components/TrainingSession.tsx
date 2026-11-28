import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { RangeAction } from '@/shared/types/poker';
import type { TrainingResult } from '@/shared/types/common';
import type { QuestionFeedback } from '../types';
import { useQuizEngine, buildRangeFeedback } from '../hooks/useQuizEngine';
import { useTimer } from '../hooks/useTimer';
import { QuizCard } from './QuizCard';
import { QuizTimer } from './QuizTimer';
import { TrainingPauseDialog } from './TrainingPauseDialog';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { TRAINING_OVERLAY_EVENT } from '@/shared/constants/app';
import { Pause, X } from 'lucide-react';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';

/** 答对后的反馈自动推进延迟：够确认结果，又不打断连续训练节奏 */
const FEEDBACK_AUTO_ADVANCE_MS = 1500;

interface TrainingSessionProps {
  position: string;
  actionType: string;
  timeLimit: number;
  totalQuestions?: number;
  onComplete: (result: TrainingResult) => void;
  onExit: () => void;
}

export function TrainingSession({
  timeLimit,
  onComplete,
  onExit,
}: TrainingSessionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    quizState,
    getCurrentQuestion,
    getScore,
    getProgress,
    answerQuestion,
    nextQuestion,
    pauseQuiz,
    resumeQuiz,
    buildResult,
    recordEloForAnswer,
    recordSrsForAnswer,
    recordAnswerForEmotion,
    shouldDownshiftDifficulty,
  } = useQuizEngine();

  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  const [decisionFeedback, setDecisionFeedback] = useState<DecisionFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackAdvanceModeRef = useRef<'auto' | 'manual'>('auto');
  const completedRef = useRef(false);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);
  // 快捷键浮层开合状态 + "本次暂停由浮层触发"标记（关浮层时只恢复浮层造成的暂停）
  const overlayOpenRef = useRef(false);
  const pausedByOverlayRef = useRef(false);

  const currentQuestion = getCurrentQuestion();

  // RNG-005：反馈自动跳题定时器统一入口（暂停时清除、恢复时按需重启）
  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
  }, []);

  const scheduleFeedbackAdvance = useCallback((delay: number) => {
    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setDecisionFeedback(null);
      nextQuestion();
    }, delay);
  }, [nextQuestion]);

  // 时间到处理（P1A-02：超时显式标记为 'timeout'，恒判错，与"选择 fold"语义区分）
  const handleTimeUp = useCallback(() => {
    if (quizState.status !== 'running' || feedback) return;
    const q = getCurrentQuestion();
    if (!q) return;

    // 记录为超时（store 内恒判错，即使正确答案恰为 fold）；拒重时不得写任何副作用。
    if (!answerQuestion('timeout')) return;

    setFeedback({
      isCorrect: false,
      correctAction: q.correctAction,
      userAction: 'timeout',
    });
    // P2-2.3: 同步生成五级 DecisionFeedback（超时视为答错，default evLoss=3 → wrong）
    setDecisionFeedback(buildRangeFeedback(false, q));
    setShowFeedback(true);

    // P1-2.4: 超时视为答错，更新 ELO
    recordEloForAnswer(false);
    // P1-3.1: 超时视为答错（quality=1），更新 SRS 复习队列（P1A-14：含暂停前已耗时）
    const timeTakenMs = quizState.pausedElapsed + (Date.now() - quizState.questionStartTime);
    recordSrsForAnswer(q, false, timeTakenMs);
    // P2-5.2: 情绪管理 — 记录答错
    recordAnswerForEmotion(false);

    // 超时按答错处理：保留反馈与决策分析，等待用户主动下一题
    feedbackAdvanceModeRef.current = 'manual';
  }, [quizState.status, quizState.questionStartTime, quizState.pausedElapsed, feedback, getCurrentQuestion, answerQuestion, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion]);

  const { timeRemaining, start: startTimer, pause: pauseTimer, reset: resetTimer } = useTimer({
    timeLimit: timeLimit,
    onTimeUp: handleTimeUp,
    autoStart: true,
  });

  // 暂停/恢复时同步计时器
  useEffect(() => {
    if (quizState.status === 'paused') {
      pauseTimer();
    }
  }, [quizState.status, pauseTimer]);

  // 切题时重置计时器和反馈
  useEffect(() => {
    resetTimer();
    setFeedback(null);
    setDecisionFeedback(null);
    setShowFeedback(false);
    feedbackAdvanceModeRef.current = 'auto';
  }, [quizState.currentIndex, resetTimer]);

  // 检测完成
  useEffect(() => {
    if (quizState.status === 'completed' && !completedRef.current) {
      completedRef.current = true;
      const result = buildResult();
      onComplete(result);
    }
  }, [quizState.status, buildResult, onComplete]);

  // 答题处理
  const handleAnswer = useCallback(
    (action: RangeAction) => {
      if (showFeedback || quizState.status !== 'running') return;

      const q = getCurrentQuestion();
      if (!q) return;

      // P1-3.1: 在 answerQuestion 之前捕获用时（P1A-14：含暂停前已耗时）
      const timeTakenMs = quizState.pausedElapsed + (Date.now() - quizState.questionStartTime);

      if (!answerQuestion(action)) return;
      pauseTimer();

      const isCorrect = action === q.correctAction;
      setFeedback({
        isCorrect,
        correctAction: q.correctAction,
        userAction: action,
      });
      // P2-2.3: 同步生成五级 DecisionFeedback（答对→best，答错→wrong）
      setDecisionFeedback(buildRangeFeedback(isCorrect, q));
      setShowFeedback(true);

      // P1-2.4: 答题后更新 preflop 维度 ELO
      recordEloForAnswer(isCorrect);
      // P1-3.1: 答题后更新 SRS 复习队列
      recordSrsForAnswer(q, isCorrect, timeTakenMs);
      // P2-5.2: 情绪管理 — 记录答题
      recordAnswerForEmotion(isCorrect);

      // 答对自动推进；答错保留反馈，等待用户下一题 / Space
      feedbackAdvanceModeRef.current = isCorrect ? 'auto' : 'manual';
      if (isCorrect) scheduleFeedbackAdvance(FEEDBACK_AUTO_ADVANCE_MS);
    },
    [showFeedback, quizState.status, quizState.questionStartTime, quizState.pausedElapsed, getCurrentQuestion, answerQuestion, scheduleFeedbackAdvance, pauseTimer, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion],
  );

  // 手动推进：仅运行中的已反馈题可推进；答对也可提前跳过自动等待。
  const handleNext = useCallback(() => {
    if (quizState.status !== 'running' || !feedback) return;
    clearFeedbackTimer();
    setShowFeedback(false);
    setFeedback(null);
    setDecisionFeedback(null);
    nextQuestion();
  }, [quizState.status, feedback, nextQuestion, clearFeedbackTimer]);

  // 键盘快捷键：Esc 暂停, Space 下一题（Sheet 内交互由 Radix 自行处理）
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      // 快捷键浮层打开期间，Esc/Space 归浮层所有：避免关闭浮层与本组件暂停/跳题双触发
      if (overlayOpenRef.current) return;
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (target?.closest('[role="dialog"]')) return;

      if (e.key === 'Escape') {
        if (quizState.status === 'running') {
          // RNG-005/006：Esc 暂停与按钮暂停行为对齐——清除反馈跳题定时器 + 同步停表
          // （修复前 Esc 只暂停 store，倒计时在暂停遮罩下继续走，恢复后段起点错位）
          clearFeedbackTimer();
          pauseQuiz();
          pauseTimer();
        } else if (quizState.status === 'paused') {
          // P1A-03 修复：恢复时同步重启倒计时（否则倒计时永久冻结）
          resumeQuiz();
          startTimer();
          if (showFeedback && feedbackAdvanceModeRef.current === 'auto') {
            scheduleFeedbackAdvance(FEEDBACK_AUTO_ADVANCE_MS);
          }
        }
        return;
      }

      if (e.key === ' ' && showFeedback && quizState.status === 'running') {
        // 焦点在可用控件上时交给控件自身，避免按空格激活按钮同时切题
        if (target?.closest('button:not([disabled]), a[href], input, textarea, select')) return;
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizState.status, showFeedback, pauseQuiz, resumeQuiz, startTimer, handleNext, clearFeedbackTimer, pauseTimer, scheduleFeedbackAdvance]);

  // 快捷键浮层（BlankLayout 经 TRAINING_OVERLAY_EVENT 派发）：浮层是模态，
  // 打开即暂停会话与倒计时；关闭后仅恢复"由浮层造成"的暂停，并接续被中断的自动推进。
  useEffect(() => {
    const handleOverlay = (event: Event) => {
      const { open } = (event as CustomEvent<{ open?: boolean }>).detail ?? {};

      if (open) {
        if (overlayOpenRef.current) return;
        overlayOpenRef.current = true;
        clearFeedbackTimer();
        pausedByOverlayRef.current = quizState.status === 'running';
        pauseQuiz();
        pauseTimer();
        return;
      }

      overlayOpenRef.current = false;
      if (!pausedByOverlayRef.current) return;
      pausedByOverlayRef.current = false;
      resumeQuiz();
      startTimer();
      // RNG-005：仅当浮层打断的是自动推进反馈时才重排定时器（手动推进态恢复后不自跳）
      if (showFeedback && feedbackAdvanceModeRef.current === 'auto') {
        scheduleFeedbackAdvance(FEEDBACK_AUTO_ADVANCE_MS);
      }
    };

    window.addEventListener(TRAINING_OVERLAY_EVENT, handleOverlay);
    return () => window.removeEventListener(TRAINING_OVERLAY_EVENT, handleOverlay);
  }, [quizState.status, showFeedback, clearFeedbackTimer, pauseQuiz, pauseTimer, resumeQuiz, startTimer, scheduleFeedbackAdvance]);

  // 暂停处理
  const handlePause = () => {
    // RNG-005：清除反馈自动跳题定时器，暂停期间不切题（恢复时若仍在反馈中会重启定时器）
    clearFeedbackTimer();
    pauseQuiz();
    pauseTimer();
  };

  const handleResume = () => {
    resumeQuiz();
    startTimer();
    // RNG-005：暂停打断的是自动推进；手动推进态恢复后不应自行跳题
    if (showFeedback && feedbackAdvanceModeRef.current === 'auto') {
      scheduleFeedbackAdvance(FEEDBACK_AUTO_ADVANCE_MS);
    }
  };

  // 清理定时器
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  if (!currentQuestion) return null;

  return (
    <div className="relative h-full flex flex-col">
      {/* 顶部状态栏：窄屏允许换行，计时器与操作按钮保持固定宽度不被挤压 */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 border-b border-[var(--walnut-border)]">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <div className="text-sm text-[var(--ivory-dim)]">
            {t('rangeTrainer.session.question', {
              current: quizState.currentIndex + 1,
              total: quizState.questions.length,
            })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--sage-text)] font-medium font-numeric">{t('rangeTrainer.session.correctCount', { count: getScore.correct })}</span>
            <span className="text-[var(--ivory-muted)]">/</span>
            <span className="text-[var(--clay-text)] font-medium font-numeric">{t('rangeTrainer.session.wrongCount', { count: getScore.wrong })}</span>
          </div>
        </div>

        <div className="shrink-0">
          <QuizTimer
            timeRemaining={timeRemaining}
            timeLimit={timeLimit}
            isPaused={quizState.status === 'paused'}
          />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Button
            ref={pauseButtonRef}
            variant="ghost"
            size="sm"
            aria-label={t('common.ui.pause')}
            onClick={handlePause}
            disabled={quizState.status !== 'running'}
          >
            <Pause className="w-4 h-4" aria-hidden="true" />
          </Button>
          {/* P1A-04 修复：X 不再 endQuiz（全量入账），改为打开暂停遮罩作为确认层，
              由遮罩内"退出训练"走 onExit → resetQuiz，不入账、不 emit、不计 streak */}
          <Button
            variant="ghost"
            size="sm"
            aria-label={t('rangeTrainer.session.exit')}
            onClick={handlePause}
            disabled={quizState.status !== 'running'}
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* 进度条 */}
      <Progress
        value={getProgress}
        className="h-1 rounded-none"
        label={t('rangeTrainer.session.question', {
          current: quizState.currentIndex + 1,
          total: quizState.questions.length,
        })}
      />

      {/* P4 修复（4.5-P0）：连续答错降级提示 —— 窄屏换行而非把文案压成竖条 */}
      {shouldDownshiftDifficulty() && (
        <div className="px-6 py-2 bg-[var(--clay)]/15 border-b border-[var(--clay)]/30 text-xs text-[var(--clay-text)] flex flex-wrap items-center gap-2">
          <span className="min-w-0">{t('rangeTrainer.session.downshiftHint')}</span>
          <button
            onClick={onExit}
            className="shrink-0 underline hover:opacity-75 transition-opacity"
          >
            {t('rangeTrainer.session.switchTraining')}
          </button>
        </div>
      )}

      {/* 中央区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          timeRemaining={timeRemaining}
          timeLimit={timeLimit}
          feedback={showFeedback ? feedback : null}
          decisionFeedback={showFeedback ? decisionFeedback : null}
          disabled={showFeedback || quizState.status !== 'running'}
          onNext={handleNext}
          onRelatedLessonOpen={(lessonId) => navigate(`/lesson/${lessonId}`)}
        />
      </div>

      {/* 底部提示 */}
      <div className="text-center pb-4 text-xs text-[var(--ivory-dim)]">
        <span className="hidden sm:inline">
          {t('rangeTrainer.session.shortcuts')}
        </span>
      </div>

      <TrainingPauseDialog
        open={quizState.status === 'paused'}
        onResume={handleResume}
        onExit={onExit}
        returnFocusRef={pauseButtonRef}
      />
    </div>
  );
}
