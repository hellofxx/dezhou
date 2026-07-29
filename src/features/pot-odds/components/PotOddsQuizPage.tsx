import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, Clock, Target, RotateCcw, Calculator } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingResult, QuestionResult } from '@/shared/types/common';
import type { PotOddsQuizQuestion, PotOddsQuizOption } from '../types';
import { getEasyOddsQuestion, useOddsEloRecorder, useOddsSrsRecorder, useOddsEmotionRecorder, buildOddsFeedback } from '../hooks/useOddsCalculation';
// 答案位置偏差治理：题库抽离为数据文件，选项顺序由 orderQuizOptions 统一处理
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from '../utils/quizOrder';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/features/progress/components/SessionLimitGuard';
// P4 修复（4.5-P0）：自适应难度降级 + 五级反馈
import { useProgressStore } from '@/features/progress/store';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
import { Link } from 'react-router-dom';

// ─── Quiz Data ─────────────────────────────────────────────────────────────────────

// 题库数据见 ../data/quizQuestions（19 题）。模块顶层一次性完成选项排序：
// 数值选项题（outs 计算）按数值升序，其余按题目 id 种子洗牌（确定性，跨用户一致）。
const ORDERED_QUIZ_QUESTIONS: PotOddsQuizQuestion[] = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));

const CATEGORY_LABELS: Record<string, string> = {
  'odds-judgment': '赔率判断',
  'outs-calculation': 'Outs 计算',
  'implied-odds': '隐含赔率',
  'reverse-implied': '反向隐含赔率',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PotOddsQuizPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<PotOddsQuizOption | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);
  const [lastQuestionCorrect, setLastQuestionCorrect] = useState(false);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const startTimeRef = useRef<number>(Date.now());
  const sessionIdRef = useRef<string>(`${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练
  const sessionLimitReached = useSessionLimitReached();
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  // P1-2.4: pot-odds ELO 记录器（维度=math）
  const recordEloForAnswer = useOddsEloRecorder();
  // P1-3.2: pot-odds SRS 记录器
  const recordSrsForAnswer = useOddsSrsRecorder();
  // P2-5.2: pot-odds 情绪管理记录器
  const recordAnswerForEmotion = useOddsEmotionRecorder();
  // P4 修复（4.5-P0）：自适应难度降级信号
  const shouldDownshiftDifficulty = useProgressStore((s) => s.shouldDownshiftDifficulty);
  // P4 修复（4.2-P1-1）：五级反馈状态
  const [decisionFeedback, setDecisionFeedback] = useState<DecisionFeedback | null>(null);

  // "最后一题简单"策略：将末题替换为最简单的赔率题；
  // rescueUsed 用于避免无限追加补救题。
  const [rescueUsed, setRescueUsed] = useState(false);
  const [rescueQuestions, setRescueQuestions] = useState<PotOddsQuizQuestion[]>([]);

  // 实际生效的题目序列：已排序的 19 题（最后一题被替换为简单题）+ 可选的补救题
  const effectiveQuestions = useMemo<PotOddsQuizQuestion[]>(() => {
    if (ORDERED_QUIZ_QUESTIONS.length === 0) return [];
    const base = ORDERED_QUIZ_QUESTIONS.slice(0, ORDERED_QUIZ_QUESTIONS.length - 1);
    const easyLast: PotOddsQuizQuestion = { ...getEasyOddsQuestion(), id: 9999 };
    return [...base, easyLast, ...rescueQuestions];
  }, [rescueQuestions]);

  const totalQuestions = effectiveQuestions.length;
  const currentQuestion = effectiveQuestions[currentIndex]!;

  const handleSelect = useCallback((option: PotOddsQuizOption) => {
    if (isAnswered) return;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const elapsedMs = elapsed * 1000;
    setTimes((prev) => [...prev, elapsed]);
    setSelectedOption(option);
    setIsAnswered(true);
    if (option.isCorrect) {
      setCorrectCount((c) => c + 1);
    }
    setUserAnswers((prev) => [...prev, option.text]);
    // P1-2.4: 答题后更新 math 维度 ELO
    recordEloForAnswer(option.isCorrect);
    // P1-3.2: 答题后更新 SRS 复习队列
    recordSrsForAnswer(currentQuestion, option.isCorrect, elapsedMs);
    // P2-5.2: 情绪管理 — 记录答题
    recordAnswerForEmotion(option.isCorrect);
    // P4 修复（4.2-P1-1）：生成五级 DecisionFeedback
    const correctOption = currentQuestion.options.find((o) => o.isCorrect);
    setDecisionFeedback(buildOddsFeedback(
      option.isCorrect,
      correctOption?.text ?? '',
      undefined, // evLoss 走默认值（答对=0，答错=3）
      correctOption?.explanation,
      'l1-basics', // pot-odds 基础对应 Level 1 入门
    ));
  }, [isAnswered, recordEloForAnswer, recordSrsForAnswer, recordAnswerForEmotion, currentQuestion]);

  const handleNext = useCallback(() => {
    const isLastQuestion = currentIndex + 1 >= totalQuestions;
    const lastAnswerCorrect = !!selectedOption?.isCorrect;

    // 最后一题已答完：若答错且未用过补救，追加一道简单题
    if (isLastQuestion) {
      if (!lastAnswerCorrect && !rescueUsed) {
        const rescue: PotOddsQuizQuestion = {
          ...getEasyOddsQuestion(),
          id: 10000 + Date.now(),
        };
        setRescueQuestions((prev) => [...prev, rescue]);
        setRescueUsed(true);
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        startTimeRef.current = Date.now();
        return;
      }
      // 否则结束
      setLastQuestionCorrect(lastAnswerCorrect);
      setFinished(true);
      return;
    }

    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setIsAnswered(false);
    setDecisionFeedback(null);
    startTimeRef.current = Date.now();
  }, [currentIndex, totalQuestions, selectedOption, rescueUsed]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setCorrectCount(0);
    setTimes([]);
    setFinished(false);
    setLastQuestionCorrect(false);
    setRescueUsed(false);
    setRescueQuestions([]);
    setUserAnswers([]);
    sessionIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    startTimeRef.current = Date.now();
  }, []);

  // 训练完成时发布事件到 progress store
  useEffect(() => {
    if (!finished) return;
    const accuracy = totalQuestions > 0 ? correctCount / totalQuestions : 0;
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const details: QuestionResult[] = effectiveQuestions.map((q, i) => ({
      question: `q${q.id}`,
      isCorrect: userAnswers[i] === q.options.find((o) => o.isCorrect)?.text,
      timeTaken: times[i] ?? 0,
      userAnswer: userAnswers[i] ?? '',
      correctAnswer: q.options.find((o) => o.isCorrect)?.text ?? '',
    }));
    const result: TrainingResult = {
      sessionId: sessionIdRef.current,
      module: 'pot-odds',
      totalQuestions,
      correctAnswers: correctCount,
      accuracy,
      averageTime: avgTime,
      timestamp: Date.now(),
      details,
      lastQuestionCorrect,
    };
    trainingEvents.emit({
      id: sessionIdRef.current,
      module: 'pot-odds',
      mode: 'quiz',
      result,
      createdAt: Date.now(),
    });
  }, [finished, totalQuestions, correctCount, times, effectiveQuestions, userAnswers, lastQuestionCorrect]);

  // ─── Results Panel ──────────────────────────────────────────────────────────
  if (finished) {
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0';

    return (
      <div className="min-h-screen bg-[var(--felt-deep)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md text-center"
        >
          <Trophy className="w-16 h-16 text-[var(--brass-bright)] mx-auto mb-4" />
          <h2 className="font-display text-3xl text-[var(--ivory)] mb-2">训练完成！</h2>
          <p className="text-[var(--ivory-muted)] mb-8">赔率速算训练结果</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">正确率</p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{avgTime}s</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> 平均用时
              </p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{totalQuestions}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Target className="w-3 h-3" /> 答对
              </p>
            </div>
          </div>

          {/* Performance message */}
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4 mb-8">
            <p className="text-sm text-[var(--ivory-dim)]">
              {accuracy >= 90 ? '🎯 出色！你的赔率计算能力非常扎实！' :
               accuracy >= 70 ? '👍 不错！继续练习可以更加熟练。' :
               accuracy >= 50 ? '📚 还需要加强，建议复习赔率计算基础。' :
               '💡 建议先学习底池赔率和 Outs 计算的基础知识。'}
            </p>
            {lastQuestionCorrect && (
              <p className="text-xs text-[var(--sage)] mt-2 font-display">
                ✓ 最后一题答对，以成功收尾！
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" /> 再来一轮
            </button>
            <button
              onClick={() => navigate('/pot-odds')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--ivory-dim)]/30 text-[var(--ivory)] font-semibold text-sm hover:bg-[var(--walnut-raised)] transition-colors"
            >
              <Calculator className="w-4 h-4" /> 返回计算器
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Quiz View ──────────────────────────────────────────────────────────────
  const correctOption = currentQuestion.options.find((o) => o.isCorrect);

  return (
    <div className="min-h-screen bg-[var(--felt-deep)] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/pot-odds')}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--ivory-muted)] hover:text-[var(--ivory)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 返回
          </button>
          <h1 className="font-display text-xl text-[var(--ivory)]">赔率速算训练</h1>
          <span className="text-xs text-[var(--ivory-muted)]">
            {CATEGORY_LABELS[currentQuestion.category]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--brass-bright)]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span className="text-xs text-[var(--ivory-muted)] shrink-0">
            {currentIndex + 1} / {totalQuestions}
          </span>
          {currentIndex > 0 && (
            <span className="text-xs text-[var(--success)] shrink-0">
              ✓ {correctCount}
            </span>
          )}
        </div>

        {/* Scenario card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            <div className="rounded-xl bg-[var(--felt)] border border-[var(--felt-light)] p-6 mb-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🃏</span>
                  <p className="text-[var(--ivory)] text-base leading-relaxed font-medium">
                    {currentQuestion.scenario}
                  </p>
                </div>
                <p className="text-[var(--brass-bright)] font-semibold text-lg pl-10">
                  {currentQuestion.question}
                </p>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-4">
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option;
                const showCorrect = isAnswered && option.isCorrect;
                const showWrong = isAnswered && isSelected && !option.isCorrect;

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(option)}
                    disabled={isAnswered}
                    className={cn(
                      'w-full text-left rounded-lg border px-5 py-4 text-sm transition-all',
                      'bg-[var(--walnut-raised)]/60 border-[var(--ivory-dim)]/20 text-[var(--ivory)]',
                      !isAnswered && 'hover:bg-[var(--walnut-raised)] hover:border-[var(--brass-bright)]/40 cursor-pointer',
                      showCorrect && 'border-[var(--success)]/60 bg-[var(--success)]/10 ring-1 ring-[var(--success)]/40',
                      showWrong && 'border-[var(--danger)]/60 bg-[var(--danger)]/10 ring-1 ring-[var(--danger)]/40',
                      isAnswered && !showCorrect && !showWrong && 'opacity-40',
                    )}
                    animate={
                      showWrong ? { x: [0, -4, 4, -4, 4, 0] } :
                      showCorrect ? { scale: [1, 1.01, 1] } : {}
                    }
                    transition={{ duration: 0.4 }}
                    whileHover={!isAnswered ? { scale: 1.01 } : {}}
                    whileTap={!isAnswered ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full border flex items-center justify-center text-xs font-bold shrink-0',
                        showCorrect ? 'border-[var(--success)] text-[var(--success)]' :
                        showWrong ? 'border-[var(--danger)] text-[var(--danger)]' :
                        'border-[var(--ivory-dim)]/40 text-[var(--ivory-muted)]'
                      )}>
                        {showCorrect ? <CheckCircle2 className="w-4 h-4" /> :
                         showWrong ? <XCircle className="w-4 h-4" /> :
                         String.fromCharCode(65 + i)}
                      </span>
                      <span className="font-medium">{option.text}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {isAnswered && selectedOption && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className={cn(
                    'rounded-lg border p-4 mb-4',
                    selectedOption.isCorrect
                      ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
                      : 'border-[var(--danger)]/40 bg-[var(--danger)]/10'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedOption.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                          <span className="text-sm font-bold text-[var(--success)]">正确！</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-[var(--danger)]" />
                          <span className="text-sm font-bold text-[var(--danger)]">不正确</span>
                          {correctOption && (
                            <span className="text-xs text-[var(--ivory-muted)] ml-2">
                              正确答案：{correctOption.text}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">
                      {selectedOption.isCorrect ? selectedOption.explanation : (correctOption?.explanation ?? selectedOption.explanation)}
                    </p>

                    {/* P4 修复（4.2-P1-1）：五级反馈显示 + 课程跳转 */}
                    {decisionFeedback && !selectedOption.isCorrect && decisionFeedback.relatedLessonId && (
                      <div className="mt-3 pt-3 border-t border-[var(--ivory-dim)]/20">
                        <span className="text-xs text-[var(--ivory-muted)] mr-2">
                          评级：{decisionFeedback.grade}
                        </span>
                        <Link
                          to={`/academy/lesson/${decisionFeedback.relatedLessonId}`}
                          className="text-xs text-[var(--brass-bright)] underline hover:text-[var(--brass)] transition-colors"
                        >
                          去复习相关课程 →
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* P4 修复（4.5-P0）：连续答错降级提示 */}
                  {shouldDownshiftDifficulty() && (
                    <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
                      检测到连续答错 3 次以上，建议放慢节奏，先复习基础课程再继续训练。
                    </div>
                  )}

                  {/* Next button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {currentIndex + 1 >= totalQuestions ? '查看成绩' : '下一题'}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
