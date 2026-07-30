import { useState, useCallback, useEffect, useRef } from 'react';
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
  const {
    quizState,
    getCurrentQuestion,
    getScore,
    getProgress,
    answerQuestion,
    nextQuestion,
    pauseQuiz,
    resumeQuiz,
    endQuiz,
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

  // 时间到处理（视为答错）
  const handleTimeUp = useCallback(() => {
    if (quizState.status !== 'running' || feedback) return;
    const q = getCurrentQuestion();
    if (!q) return;

    // 记录为错误答案（用 fold 作为超时答案）
    answerQuestion('fold' as RangeAction);

    setFeedback({
      isCorrect: false,
      correctAction: q.correctAction,
      userAction: 'fold',
    });
    // P2-2.3: 同步生成五级 DecisionFeedback（超时视为答错，default evLoss=3 → wrong）
    setDecisionFeedback(buildRangeFeedback(false, q));
    setShowFeedback(true);

    // P1-2.4: 超时视为答错，更新 ELO
    recordEloForAnswer(false);
    // P1-3.1: 超时视为答错（quality=1），更新 SRS 复习队列
    const timeTakenMs = Date.now() - quizState.questionStartTime;
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
  }, [quizState.status, quizState.questionStartTime, feedback, getCurrentQuestion, answerQuestion, nextQuestion, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion]);

  const { timeRemaining, pause: pauseTimer, reset: resetTimer } = useTimer({
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

      // P1-3.1: 在 answerQuestion 之前捕获用时（answerQuestion 会重置 questionStartTime）
      const timeTakenMs = Date.now() - quizState.questionStartTime;

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
    [showFeedback, quizState.status, quizState.questionStartTime, getCurrentQuestion, answerQuestion, nextQuestion, pauseTimer, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion],
  );

  // 键盘快捷键：Esc 暂停, Space 下一题
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (quizState.status === 'running') {
          pauseQuiz();
        } else if (quizState.status === 'paused') {
          resumeQuiz();
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
  }, [quizState.status, showFeedback, pauseQuiz, resumeQuiz, nextQuestion]);

  // 暂停处理
  const handlePause = () => {
    pauseQuiz();
    pauseTimer();
  };

  const handleResume = () => {
    resumeQuiz();
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
            第 <span className="text-[var(--ivory)] font-bold font-numeric">{quizState.currentIndex + 1}</span>
            {' / '}
            <span className="font-numeric">{quizState.questions.length}</span> 题
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--sage)] font-medium font-numeric">{getScore.correct} 对</span>
            <span className="text-[var(--ivory-muted)]">/</span>
            <span className="text-[var(--clay)] font-medium font-numeric">{getScore.wrong} 错</span>
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              endQuiz();
            }}
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
          <span>检测到连续答错，建议返回选择更基础的位置或动作类型进行训练</span>
          <button
            onClick={onExit}
            className="text-[var(--clay)] underline hover:opacity-75 transition-opacity"
          >
            切换训练
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
        />
      </div>

      {/* 底部提示 */}
      <div className="text-center pb-4 text-xs text-[var(--ivory-dim)]">
        <span className="hidden sm:inline">
          快捷键：1=Fold · 2=Call · 3=Raise · Space=跳过 · Esc=暂停
        </span>
      </div>

      {/* 暂停遮罩 */}
      {quizState.status === 'paused' && (
        <div className="absolute inset-0 bg-[var(--felt-deep)]/85 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="text-center space-y-4">
            <div className="font-display text-2xl text-[var(--ivory)] tracking-wide">已暂停</div>
            <Button
              onClick={handleResume}
              className="bg-[var(--brass)] hover:bg-[var(--brass-bright)] text-[var(--primary-foreground)] px-8"
            >
              继续训练
            </Button>
            <div>
              <button
                onClick={onExit}
                className="text-sm text-[var(--ivory-dim)] hover:text-[var(--ivory)] transition-colors"
              >
                退出训练
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
