import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { RangeAction } from '@/shared/types/poker';
import type { TrainingResult } from '@/shared/types/common';
import type { QuestionFeedback } from '../types';
import { useQuizEngine, buildRangeFeedback } from '../hooks/useQuizEngine';
import { useTimer } from '../hooks/useTimer';
import { QuizCard } from './QuizCard';
import { QuizTimer } from './QuizTimer';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Pause, X } from 'lucide-react';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';

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
  const completedRef = useRef(false);

  const currentQuestion = getCurrentQuestion();

  // 时间到处理（P1A-02：超时显式标记为 'timeout'，恒判错，与"选择 fold"区分）
  const handleTimeUp = useCallback(() => {
    if (quizState.status !== 'running' || feedback) return;
    const q = getCurrentQuestion();
    if (!q) return;

    // 记录为超时（store 内恒判错，即使正确答案恰为 fold）
    answerQuestion('timeout');

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

    // 1.5 秒后自动进入下一题
    feedbackTimerRef.current = setTimeout(() => {
      setShowFeedback(false);
      setFeedback(null);
      setDecisionFeedback(null);
      nextQuestion();
    }, 1500);
  }, [quizState.status, quizState.questionStartTime, quizState.pausedElapsed, feedback, getCurrentQuestion, answerQuestion, nextQuestion, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion]);

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

      answerQuestion(action);
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

      // 1 秒后自动进入下一题
      feedbackTimerRef.current = setTimeout(() => {
        setShowFeedback(false);
        setFeedback(null);
        setDecisionFeedback(null);
        nextQuestion();
      }, 1000);
    },
    [showFeedback, quizState.status, quizState.questionStartTime, quizState.pausedElapsed, getCurrentQuestion, answerQuestion, nextQuestion, pauseTimer, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion],
  );

  // §13.4.3 教育脚手架：wrong/blunder 反馈底部"再做一题"→ 清除自动跳转定时器后进入下一题
  // （range-trainer 会话内题目均为同位置同动作类型，下一题即"同类型新题"，不清除当前反馈记录）
  const handleTryAgain = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setShowFeedback(false);
    setFeedback(null);
    setDecisionFeedback(null);
    nextQuestion();
  }, [nextQuestion]);

  // 键盘快捷键：Esc 暂停, Space 下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (quizState.status === 'running') {
          pauseQuiz();
        } else if (quizState.status === 'paused') {
          // P1A-03 修复：恢复时同步重启倒计时（否则倒计时永久冻结）
          resumeQuiz();
          startTimer();
        }
      }
      if (e.key === ' ' && showFeedback) {
        e.preventDefault();
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        setShowFeedback(false);
        setFeedback(null);
        setDecisionFeedback(null);
        nextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quizState.status, showFeedback, pauseQuiz, resumeQuiz, startTimer, nextQuestion]);

  // 暂停处理
  const handlePause = () => {
    pauseQuiz();
    pauseTimer();
  };

  const handleResume = () => {
    // P1A-03 修复：恢复时同步重启倒计时（store 续算由 pausedElapsed 承担，P1A-14）
    resumeQuiz();
    startTimer();
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
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--walnut-border)]">
        <div className="flex items-center gap-4">
          <div className="text-sm text-[var(--ivory-dim)]">
            {t('rangeTrainer.session.question', {
              current: quizState.currentIndex + 1,
              total: quizState.questions.length,
            })}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--sage)] font-medium font-numeric">{t('rangeTrainer.session.correctCount', { count: getScore.correct })}</span>
            <span className="text-[var(--ivory-muted)]">/</span>
            <span className="text-[var(--clay)] font-medium font-numeric">{t('rangeTrainer.session.wrongCount', { count: getScore.wrong })}</span>
          </div>
        </div>

        <QuizTimer
          timeRemaining={timeRemaining}
          timeLimit={timeLimit}
          isPaused={quizState.status === 'paused'}
        />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            disabled={quizState.status !== 'running'}
          >
            <Pause className="w-4 h-4" />
          </Button>
          {/* P1A-04 修复：X 不再 endQuiz（全量入账），改为打开暂停遮罩作为确认层，
              由遮罩内"退出训练"走 onExit → resetQuiz，不入账、不 emit、不计 streak */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePause}
            disabled={quizState.status !== 'running'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 进度条 */}
      <Progress value={getProgress} className="h-1 rounded-none" />

      {/* P4 修复（4.5-P0）：连续答错降级提示 */}
      {shouldDownshiftDifficulty() && (
        <div className="px-6 py-2 bg-[var(--clay)]/15 border-b border-[var(--clay)]/30 text-xs text-[var(--clay)] flex items-center justify-between">
          <span>{t('rangeTrainer.session.downshiftHint')}</span>
          <button
            onClick={onExit}
            className="text-[var(--clay)] underline hover:opacity-75 transition-opacity"
          >
            {t('rangeTrainer.session.switchTraining')}
          </button>
        </div>
      )}

      {/* 中央区域 */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <QuizCard
          key={quizState.currentIndex}
          question={currentQuestion}
          onAnswer={handleAnswer}
          timeRemaining={timeRemaining}
          timeLimit={timeLimit}
          feedback={showFeedback ? feedback : null}
          decisionFeedback={showFeedback ? decisionFeedback : null}
          disabled={showFeedback || quizState.status !== 'running'}
          onTryAgain={handleTryAgain}
        />
      </div>

      {/* 底部提示 */}
      <div className="text-center pb-4 text-xs text-[var(--ivory-dim)]">
        <span className="hidden sm:inline">
          {t('rangeTrainer.session.shortcuts')}
        </span>
      </div>

      {/* 暂停遮罩 */}
      {quizState.status === 'paused' && (
        <div className="absolute inset-0 bg-[var(--felt-deep)]/85 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <div className="font-display text-2xl text-[var(--ivory)] tracking-wide">{t('rangeTrainer.session.paused')}</div>
            <Button
              onClick={handleResume}
              className="bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] px-8"
            >
              {t('rangeTrainer.session.resume')}
            </Button>
            <div>
              <button
                onClick={onExit}
                className="text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] transition-colors"
              >
                {t('rangeTrainer.session.exit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
