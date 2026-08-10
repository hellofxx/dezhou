import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MOTION_DURATION, MOTION_EASE } from '@/shared/utils/motion';
import { cn } from '@/shared/utils/cn';
import { useProgressStore } from '@/features/progress/store';
import { useTheoryStore } from '../store';
import { orderTheoryQuizQuestion } from '../utils/quizOrder';
import { getChapterDifficulty } from '../utils/theoryProgress';
import type { TheoryChapter } from '../types';

interface TheoryQuizProps {
  chapter: TheoryChapter;
  /** 全部题目作答完成时回调（score 0-100） */
  onComplete: (score: number, correctAnswers: number, totalQuestions: number) => void;
}

/**
 * 章末小测：选项经 quizOrder 重排后渲染（答案位置偏差治理）。
 * 每题作答同步更新 progress 的 ELO（按章节 eloDimension）与情绪计数。
 *
 * 设计豁免（P0-B 2026-07-31 定性，登记于 TDD 5.9 反馈闭环系统）：
 * 章末小测为概念判断题、无 EV 语义，暂不接入五级判分体系
 * （沿用二元对错 + 解析），与 hand-history 不 emit 的豁免模式并列。
 */
export function TheoryQuiz({ chapter, onComplete }: TheoryQuizProps) {
  const { t } = useTranslation();
  const orderedQuestions = useMemo(
    () => chapter.quiz.map((q) => orderTheoryQuizQuestion(q)),
    [chapter.quiz],
  );
  const updateElo = useProgressStore((s) => s.updateElo);
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const flaggedQuestions = useTheoryStore((s) => s.progress.flaggedQuestions);
  const toggleFlagQuestion = useTheoryStore((s) => s.toggleFlagQuestion);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  // 防御：空题库（理论章节无小测）时自动按完成处理，避免 onComplete 永不触发导致卡死在空白小测页。
  // 用 effect 触发（而非渲染期调用父 setState）；完成后父组件切至 done 会卸载本组件，不会循环。
  // 正常由 theoryIntegrity 测试保证每章 3-5 题，此为防御性兜底。
  // P1F-03：completedRef 一次性守卫（对齐 TrainingSession 防重入模式）——StrictMode 下 effect
  // 双跑不会重置 ref，onComplete 仅触发一次，避免 completeChapter 双调、训练事件双 emit。
  const isEmpty = orderedQuestions.length === 0;
  const completedRef = useRef(false);
  useEffect(() => {
    if (isEmpty && !completedRef.current) {
      completedRef.current = true;
      onComplete(100, 0, 0);
    }
  }, [isEmpty, onComplete]);

  const question = orderedQuestions[currentIndex];
  if (!question) return null;

  const isCorrect = selectedIndex === question.correctIndex;

  const handleSelect = (index: number) => {
    if (showExplanation) return;
    setSelectedIndex(index);
    setShowExplanation(true);
    const correct = index === question.correctIndex;
    if (correct) setCorrectCount((c) => c + 1);
    // 理论掌握度进入 ELO 与情绪系统（答题时同步调用，不走事件总线）
    updateElo(chapter.eloDimension, correct, getChapterDifficulty(chapter.level));
    recordAnswer(correct);
  };

  const handleNext = () => {
    if (currentIndex < orderedQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedIndex(null);
      setShowExplanation(false);
    } else {
      // 最后一题：得分交由父组件（TheoryChapterView 的 done 阶段）统一展示
      const score = Math.round((correctCount / orderedQuestions.length) * 100);
      onComplete(score, correctCount, orderedQuestions.length);
    }
  };

  return (
    <div className="space-y-6">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={currentIndex + 1}
        aria-valuemin={1}
        aria-valuemax={orderedQuestions.length}
        aria-label={t('theory.quizProgress', { current: currentIndex + 1, total: orderedQuestions.length })}
      >
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
          exit={{ opacity: 0 }}
          transition={{ duration: MOTION_DURATION.fast, ease: MOTION_EASE.standard }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--ivory-muted)] font-numeric">
              {t('theory.quizProgress', { current: currentIndex + 1, total: orderedQuestions.length })}
            </p>
            <button
              onClick={() => toggleFlagQuestion(question.id)}
              aria-label={flaggedQuestions.includes(question.id) ? t('theory.flaggedQuestion') : t('theory.flagQuestion')}
              className={cn(
                'p-2 min-h-11 min-w-11 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                flaggedQuestions.includes(question.id)
                  ? 'text-[var(--poker-gold)] bg-[var(--poker-gold)]/15'
                  : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
              )}
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
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
                  aria-label={`选项 ${String.fromCharCode(65 + index)}: ${option}`}
                  className={cn(
                    'w-full text-left min-h-11 px-4 py-3 rounded-lg border text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60',
                    !showExplanation &&
                      'border-[var(--walnut-border)] bg-[var(--felt)] hover:border-[var(--brass)]/50 hover:bg-[var(--felt-raised)]/40 text-[var(--ivory-dim)]',
                    showExplanation && isCorrectOption && 'border-[var(--poker-success)]/50 bg-[var(--poker-success-bg)] text-[var(--poker-success)]',
                    showExplanation && isSelected && !isCorrectOption && 'border-[var(--poker-danger)]/50 bg-[var(--poker-danger-bg)] text-[var(--poker-danger)]',
                    showExplanation && !isSelected && !isCorrectOption &&
                      'border-[var(--walnut-border)]/50 bg-[var(--felt)]/50 text-[var(--ivory-muted)] opacity-60'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0 font-numeric">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                    {showExplanation && isCorrectOption && <CheckCircle2 className="w-4 h-4 ml-auto shrink-0" />}
                    {showExplanation && isSelected && !isCorrectOption && <XCircle className="w-4 h-4 ml-auto shrink-0" />}
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
                className="inline-flex min-h-11 items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brass)]/60"
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
