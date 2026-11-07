import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, BookOpen } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';
import { drawByAttempt } from '@/shared/utils/academyQuizDraw';
import { useProgressStore } from '@/features/progress/store';
import { orderQuizQuestion } from '../utils/quizShuffle';
import { resolveQuizQuestion } from '../utils/contentKeys';
import { getLessonEloDifficulty } from '../utils/eloDifficulty';
import { getLessonMeta } from '../data/lessonMeta';
import type { QuizQuestion } from '../types';

/** 课时测验抽题数（P0：课时统一抽 5 题；题池不足时全量返回）。 */
export const LESSON_QUIZ_DRAW_SIZE = 5;

/** 本次课时测验结果（total/correct 为实际抽题口径，供 completeCourse 落掌握度与 SRS）。 */
export interface LessonQuizResult {
  score: number;
  correct: number;
  total: number;
  /** 本次答错的稳定题 id（题级 SRS 输入） */
  wrongQuestionIds: string[];
}

interface LessonQuizProps {
  lessonId: string;
  questions: QuizQuestion[];
  /** 课时 Level（ELO 难度映射；L1 最易） */
  level: number;
  /** 本次作答序号：首次 = 1，重考 = attempts + 1（由 CourseView 从 store 读取） */
  attemptNumber: number;
  /** 练习态（非首次作答）：不写 ELO / 情绪计数，只收集错题 id 进 SRS */
  isPractice: boolean;
  onComplete: (result: LessonQuizResult) => void;
}

export function LessonQuiz({
  lessonId,
  questions,
  level,
  attemptNumber,
  isPractice,
  onComplete,
}: LessonQuizProps) {
  const { t } = useTranslation();
  const updateElo = useProgressStore((s) => s.updateElo);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  // 答案位置偏差治理：渲染前先 t() 解析（key 缺失回退数据层中文），再抽题（lessonId + attempt
  // 种子稳定、重考换题），最后重排选项（数值升序 / id 稳定种子洗牌）——
  // 选项种子只依赖题 id，zh/en 顺序一致，源数据不变
  const orderedQuestions = useMemo(() => {
    const resolved = questions.map((q) => resolveQuizQuestion(t, q));
    const drawn = drawByAttempt(resolved, {
      key: lessonId,
      attemptNumber,
      size: LESSON_QUIZ_DRAW_SIZE,
    });
    return drawn.map((q) => orderQuizQuestion(q));
  }, [questions, lessonId, attemptNumber, t]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  // 答错题 id（供上层写题级 SRS）。用 ref：只在事件处理器内追加、不参与渲染
  const wrongQuestionIdsRef = useRef<string[]>([]);

  const question = orderedQuestions[currentIndex];

  if (!question) return null;

  const isCorrect = selectedIndex === question.correctIndex;

  const buildResult = (correct: number): LessonQuizResult => ({
    score: orderedQuestions.length > 0 ? Math.round((correct / orderedQuestions.length) * 100) : 0,
    correct,
    total: orderedQuestions.length,
    wrongQuestionIds: [...wrongQuestionIdsRef.current],
  });

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
    const correct = index === question.correctIndex;
    if (correct) {
      setCorrectCount((c) => c + 1);
    } else {
      wrongQuestionIdsRef.current = [...wrongQuestionIdsRef.current, question.id];
    }
    // 首次作答才计入 ELO 与情绪系统（重考为练习态：不写 ELO/情绪，只收集错题）
    // 维度取 lessonMeta（T3 填充；未登记回退 postflop）
    if (!isPractice) {
      updateElo(getLessonMeta(lessonId).eloDimension, correct, getLessonEloDifficulty(level));
      recordAnswer(correct);
    }
  };

  const handleNext = () => {
    if (currentIndex < orderedQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
      onComplete(buildResult(correctCount));
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    setCorrectCount(0);
    wrongQuestionIdsRef.current = [];
    setFinished(false);
  };

  if (finished) {
    const score = buildResult(correctCount).score;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        {score >= 70 ? (
          <Trophy size={44} className="mx-auto mb-4 text-[var(--brass-bright)]" aria-hidden="true" />
        ) : (
          <BookOpen size={44} className="mx-auto mb-4 text-[var(--ivory-muted)]" aria-hidden="true" />
        )}
        <h3 className="font-display text-2xl text-[var(--ivory)] mb-2">
          {score >= 70 ? t('academy.quiz.passed') : t('academy.quiz.keepGoing')}
        </h3>
        <p className="text-[var(--ivory-dim)] mb-1">
          {t('academy.quiz.answeredCount', { correct: correctCount, total: orderedQuestions.length })}
        </p>
        <p className="font-numeric text-3xl text-[var(--brass-bright)] mb-6">{t('academy.quiz.score', { score })}</p>
        {score < 70 && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {t('academy.quiz.retry')}
          </button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress dots */}
      <div className="flex items-center gap-1.5">
        {orderedQuestions.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < currentIndex
                ? 'bg-[var(--brass-bright)]'
                : i === currentIndex
                  ? 'bg-[var(--brass)]'
                  : 'bg-[var(--walnut-raised)]'
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
        >
          <p className="text-xs text-[var(--ivory-muted)] mb-2 font-numeric">
            {t('academy.quiz.progress', { current: currentIndex + 1, total: orderedQuestions.length })}
          </p>
          <h3 className="font-display text-[17px] text-[var(--ivory)] mb-5 leading-snug">
            {question.question}
          </h3>

          <div className="space-y-2.5">
            {question.options.map((option, index) => {
              const isSelected = selectedIndex === index;
              const isCorrectOption = index === question.correctIndex;

              return (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  disabled={showExplanation}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-lg border text-sm transition-all duration-200',
                    !showExplanation &&
                      'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 text-[var(--ivory-dim)]',
                    showExplanation &&
                      isCorrectOption &&
                      'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                    showExplanation &&
                      isSelected &&
                      !isCorrectOption &&
                      'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--danger-text)]',
                    showExplanation &&
                      !isSelected &&
                      !isCorrectOption &&
                      'border-[var(--walnut-border)]/50 bg-[var(--felt)]/50 text-[var(--ivory-muted)] opacity-60'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-numeric">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {showExplanation && isCorrectOption && (
                      <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />
                    )}
                    {showExplanation && isSelected && !isCorrectOption && (
                      <XCircle className="w-4 h-4 ml-auto shrink-0" />
                    )}
                  </span>
                </button>
              );
            })}
          </div>

          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.out }}
              className={cn(
                'mt-4 rounded-lg p-4 text-sm leading-relaxed',
                isCorrect
                  ? 'bg-[var(--poker-success-bg)] border border-[var(--poker-success)]/30 text-[var(--poker-success)]/90'
                  : 'bg-[var(--poker-danger-bg)] border border-[var(--poker-danger)]/30 text-[var(--danger-text)]/90'
              )}
            >
              <p className="font-semibold mb-1">{isCorrect ? t('academy.quiz.correctMark') : t('academy.quiz.wrongMark')}</p>
              <p>{question.explanation}</p>
            </motion.div>
          )}

          {showExplanation && (
            <div className="mt-5 flex justify-end">
              <Button variant="default" onClick={handleNext}>
                {currentIndex < orderedQuestions.length - 1 ? t('academy.quiz.next') : t('academy.quiz.viewResult')}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
