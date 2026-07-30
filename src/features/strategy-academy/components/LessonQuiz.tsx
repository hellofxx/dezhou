import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { orderQuizQuestion } from '../utils/quizShuffle';
import type { QuizQuestion } from '../types';

interface LessonQuizProps {
  questions: QuizQuestion[];
  onComplete: (score: number) => void;
}

export function LessonQuiz({ questions, onComplete }: LessonQuizProps) {
  // 答案位置偏差治理：渲染前重排选项（数值升序 / id 稳定种子洗牌），源数据不变
  const orderedQuestions = useMemo(
    () => questions.map((q) => orderQuizQuestion(q)),
    [questions],
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = orderedQuestions[currentIndex];

  if (!question) return null;

  const isCorrect = selectedIndex === question.correctIndex;

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
    if (index === question.correctIndex) {
      setCorrectCount((c) => c + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < orderedQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
    } else {
      const score = Math.round((correctCount / orderedQuestions.length) * 100);
      setFinished(true);
      onComplete(score);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
    setSelectedIndex(null);
    setShowExplanation(false);
    setCorrectCount(0);
    setFinished(false);
  };

  if (finished) {
    const score = Math.round((correctCount / orderedQuestions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-10"
      >
        <div className="text-5xl mb-4">{score >= 70 ? '🎉' : '📚'}</div>
        <h3 className="font-display text-2xl text-[var(--ivory)] mb-2">
          {score >= 70 ? '测验通过！' : '继续加油！'}
        </h3>
        <p className="text-[var(--ivory-dim)] mb-1">
          答对 {correctCount}/{orderedQuestions.length} 题
        </p>
        <p className="font-numeric text-3xl text-[var(--brass-bright)] mb-6">{score}分</p>
        {score < 70 && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--walnut-raised)] text-[var(--ivory)] hover:bg-[var(--walnut-raised)]/80 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            重新测验
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
          transition={{ duration: 0.2 }}
        >
          <p className="text-xs text-[var(--ivory-muted)] mb-2 font-numeric">
            第 {currentIndex + 1} / {orderedQuestions.length} 题
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
                      'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--poker-danger)]',
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
              className={cn(
                'mt-4 rounded-lg p-4 text-sm leading-relaxed',
                isCorrect
                  ? 'bg-[var(--poker-success-bg)] border border-[var(--poker-success)]/30 text-[var(--poker-success)]/90'
                  : 'bg-[var(--poker-danger-bg)] border border-[var(--poker-danger)]/30 text-[var(--poker-danger)]/90'
              )}
            >
              <p className="font-semibold mb-1">{isCorrect ? '✓ 正确！' : '✗ 错误'}</p>
              <p>{question.explanation}</p>
            </motion.div>
          )}

          {showExplanation && (
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                {currentIndex < orderedQuestions.length - 1 ? '下一题' : '查看结果'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
