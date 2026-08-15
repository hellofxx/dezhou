import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
// UI-01: 动效单源 — 统一使用 motion.ts 预设，禁止内联 duration/ease 字面量
import { transitionSlow, transitionStandard } from '@/shared/utils/motion';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, Clock, Target, RotateCcw, Calculator } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { trainingEvents } from '@/shared/stores/trainingEvents';
import type { TrainingResult, QuestionResult } from '@/shared/types/common';
import type { PotOddsQuizQuestion, PotOddsQuizOption } from '../types';
import { getEasyOddsQuestion, useOddsEloRecorder, useOddsSrsRecorder, useOddsEmotionRecorder, buildOddsFeedback } from '../hooks/useOddsCalculation';
// 答案位置偏差治理：题库抽离为数据文件，选项顺序由 orderQuizOptions 统一处理
import { QUIZ_QUESTIONS } from '../data/quizQuestions';
import { orderQuizOptions } from '../utils/quizOrder';
// P1B-04：末题/补救题固定 id（SRS 去重依赖）
import { EASY_LAST_QUESTION_ID, RESCUE_QUESTION_ID } from '../constants';
// P2-5.4: Session 止损守卫
import SessionLimitGuard, { useSessionLimitReached } from '@/shared/components/gate/SessionLimitGuard';
// P4 修复（4.5-P0）：自适应难度降级 + 五级反馈
import { useProgressStore } from '@/features/progress/store';
import type { DecisionFeedback } from '@/shared/types/decisionFeedback';
// P1B-05：评级展示统一走 GRADE_DISPLAY_CONFIG（icon + titleKey i18n + .grade-* 容器类）
import { GRADE_DISPLAY_CONFIG } from '@/shared/types/decisionFeedback';
import { Link } from 'react-router-dom';

// ─── Quiz Data ─────────────────────────────────────────────────────────────────────

// 题库数据见 ../data/quizQuestions（19 题）。模块顶层一次性完成选项排序：
// 数值选项题（outs 计算）按数值升序，其余按题目 id 种子洗牌（确定性，跨用户一致）。
const ORDERED_QUIZ_QUESTIONS: PotOddsQuizQuestion[] = QUIZ_QUESTIONS.map((q) => orderQuizOptions(q));

// 存 i18n key，渲染时经 t() 解析（potOdds.quiz.*）
const CATEGORY_LABELS: Record<string, string> = {
  'odds-judgment': 'potOdds.quiz.categoryJudgment',
  'outs-calculation': 'potOdds.quiz.categoryOuts',
  'implied-odds': 'potOdds.quiz.categoryImplied',
  'reverse-implied': 'potOdds.quiz.categoryReverse',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function PotOddsQuizPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  // Streak 记账：训练完成时计入每日连续训练（recordTrainingDay 内部幂等并检查里程碑）
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);

  // P2-5.4: Session 止损 — 达到每日题量上限时禁止继续训练（早退在全部 hooks 之后，见下）
  const sessionLimitReached = useSessionLimitReached();

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
    const easyLast: PotOddsQuizQuestion = { ...getEasyOddsQuestion(), id: EASY_LAST_QUESTION_ID };
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
        // P1B-04：固定 id（非 Date.now()），SRS 复习项 `odds:9998` 可正常去重更新
        const rescue: PotOddsQuizQuestion = {
          ...getEasyOddsQuestion(),
          id: RESCUE_QUESTION_ID,
        };
        setRescueQuestions((prev) => [...prev, rescue]);
        setRescueUsed(true);
        setCurrentIndex((i) => i + 1);
        setSelectedOption(null);
        setIsAnswered(false);
        setDecisionFeedback(null);
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
    // ODDS-05：重新开始时清空上一题遗留的决策反馈
    setDecisionFeedback(null);
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
      averageTime: avgTime * 1000, // times 单位为秒，转毫秒（与 progress 各模块一致）
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
    // 计入每日连续训练（与 puzzle / theory 模块同模式：完成时同步调用，不走事件总线）
    recordTrainingDay();
  }, [finished, totalQuestions, correctCount, times, effectiveQuestions, userAnswers, lastQuestionCorrect, recordTrainingDay]);

  // 止损早退必须位于全部 hooks 之后：守卫状态在挂载期间翻转（答题中达上限/
  // 调试开关切换）时，hooks 数量变化会触发 "Rendered fewer hooks" 崩溃
  if (sessionLimitReached) {
    return <SessionLimitGuard />;
  }

  // ─── Results Panel ──────────────────────────────────────────────────────────
  if (finished) {
    const accuracy = Math.round((correctCount / totalQuestions) * 100);
    const avgTime = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : '0';

    return (
      <div className="min-h-screen bg-[var(--felt-deep)] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={transitionSlow}
          className="w-full max-w-md text-center"
        >
          <Trophy className="w-16 h-16 text-[var(--brass-bright)] mx-auto mb-4" />
          <h2 className="font-display text-3xl text-[var(--ivory)] mb-2">{t('potOdds.quiz.doneTitle')}</h2>
          <p className="text-[var(--ivory-muted)] mb-8">{t('potOdds.quiz.doneSubtitle')}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('potOdds.quiz.accuracy')}</p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{avgTime}s</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> {t('potOdds.quiz.avgTime')}
              </p>
            </div>
            <div className="rounded-xl bg-[var(--walnut-raised)] p-5">
              <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{totalQuestions}</p>
              <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
                <Target className="w-3 h-3" /> {t('potOdds.quiz.correctCount')}
              </p>
            </div>
          </div>

          {/* Performance message */}
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4 mb-8">
            <p className="text-sm text-[var(--ivory-dim)]">
              {accuracy >= 90 ? t('potOdds.quiz.gradeExcellent') :
               accuracy >= 70 ? t('potOdds.quiz.gradeGood') :
               accuracy >= 50 ? t('potOdds.quiz.gradeFair') :
               t('potOdds.quiz.gradePoor')}
            </p>
            {lastQuestionCorrect && (
              <p className="text-xs text-[var(--sage)] mt-2 font-display">
                {t('potOdds.quiz.lastCorrect')}
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <RotateCcw className="w-4 h-4" /> {t('potOdds.quiz.restart')}
            </button>
            <button
              onClick={() => navigate('/pot-odds')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[var(--ivory-dim)]/30 text-[var(--ivory)] font-semibold text-sm hover:bg-[var(--walnut-raised)] transition-colors"
            >
              <Calculator className="w-4 h-4" /> {t('potOdds.quiz.backToCalc')}
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
            <ArrowLeft className="w-4 h-4" /> {t('potOdds.quiz.back')}
          </button>
          <h1 className="font-display text-xl text-[var(--ivory)]">{t('potOdds.quiz.title')}</h1>
          <span className="text-xs text-[var(--ivory-muted)]">
            {t(CATEGORY_LABELS[currentQuestion.category] ?? 'potOdds.quiz.categoryJudgment')}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[var(--brass-bright)]"
              initial={{ width: 0 }}
              animate={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
              transition={transitionStandard}
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
            transition={transitionStandard}
          >
            <div className="rounded-xl bg-[var(--felt)] border border-[var(--felt-light)] p-6 mb-5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
              <div className="relative z-10">
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-2xl">🃏</span>
                  <p className="text-[var(--ivory)] text-base leading-relaxed font-medium">
                    {t(currentQuestion.scenario)}
                  </p>
                </div>
                <p className="text-[var(--brass-bright)] font-semibold text-lg pl-10">
                  {t(currentQuestion.question)}
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
                    transition={transitionSlow}
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
                      <span className="font-medium">{t(option.text)}</span>
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
                  transition={transitionStandard}
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
                          <span className="text-sm font-bold text-[var(--success)]">{t('potOdds.quiz.correct')}</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-[var(--danger)]" />
                          <span className="text-sm font-bold text-[var(--danger)]">{t('potOdds.quiz.incorrect')}</span>
                          {correctOption && (
                            <span className="text-xs text-[var(--ivory-muted)] ml-2">
                              {t('potOdds.quiz.correctAnswer', { answer: t(correctOption.text) })}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-[var(--ivory-dim)] leading-relaxed">
                      {t(selectedOption.isCorrect ? selectedOption.explanation : (correctOption?.explanation ?? selectedOption.explanation))}
                    </p>

                    {/* P1B-05：五级评级徽章——统一走 GRADE_DISPLAY_CONFIG（icon + titleKey 走 t() + .grade-* 容器类），
                        对齐 QuizCard/GTOFeedback；答对也展示（best/correct），不再仅答错时渲染。
                        注：evLoss 维持现有兜底（答对=0，答错=3），真实 evLoss 分级需题库补 evLossBB 数据（观察项） */}
                    {decisionFeedback && (() => {
                      const gradeConfig = GRADE_DISPLAY_CONFIG[decisionFeedback.grade];
                      return (
                        <div className="mt-3 pt-3 border-t border-[var(--ivory-dim)]/20 flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium',
                              gradeConfig.color,
                              gradeConfig.textColor,
                            )}
                            role="status"
                          >
                            <span aria-hidden="true">{gradeConfig.icon}</span>
                            {t(gradeConfig.titleKey)}
                          </span>
                          {!selectedOption.isCorrect && decisionFeedback.relatedLessonId && (
                            <Link
                              to={`/academy/lesson/${decisionFeedback.relatedLessonId}`}
                              className="text-xs text-[var(--brass-bright)] underline hover:text-[var(--brass)] transition-colors"
                            >
                              {t('potOdds.quiz.reviewLink')}
                            </Link>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* P4 修复（4.5-P0）：连续答错降级提示 */}
                  {shouldDownshiftDifficulty() && (
                    <div className="mb-4 px-4 py-2 rounded-lg bg-[var(--clay)]/15 border border-[var(--clay)]/30 text-xs text-[var(--clay)]">
                      {t('potOdds.quiz.downshiftHint')}
                    </div>
                  )}

                  {/* Next button */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      {currentIndex + 1 >= totalQuestions ? t('potOdds.quiz.viewResult') : t('potOdds.quiz.next')}
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
