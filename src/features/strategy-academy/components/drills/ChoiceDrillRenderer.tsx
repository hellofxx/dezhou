// ChoiceDrillRenderer — 通用选择题 Drill 渲染器
// 用于 L2-L8 的 ChoiceDrill 类型课程，数据来自 lesson.drillData

import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Clock, Target } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { orderDrillOptions } from '../../utils/quizShuffle';
import { resolveLessonTitle, resolveLessonSubtitle } from '../../utils/titleKeys';
import type { DrillProps, DrillResult } from './types';
import type { Lesson } from '../../types';

interface ChoiceDrillRendererProps extends DrillProps {
  lesson: Lesson;
}

export default function ChoiceDrillRenderer({ onComplete, onExit, lesson }: ChoiceDrillRendererProps) {
  const { t } = useTranslation();
  // 答案位置偏差治理：渲染前重排选项（数值升序 / id 稳定种子洗牌），源数据不变
  const questions = useMemo(
    () => (lesson.drillData?.questions ?? []).map((q) => orderDrillOptions(q)),
    [lesson],
  );
  const TOTAL = questions.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const overallStartRef = useRef<number>(Date.now());

  const current = questions[currentIndex];

  const handleSelect = useCallback(
    (idx: number) => {
      if (isAnswered || !current) return;
      setSelectedIndex(idx);
      setIsAnswered(true);
      if (current.options[idx]?.isCorrect) {
        setCorrectCount((c) => c + 1);
      }
    },
    [isAnswered, current],
  );

  const handleNext = useCallback(() => {
    if (!current) return;
    if (currentIndex + 1 >= TOTAL) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedIndex(null);
    setIsAnswered(false);
  }, [currentIndex, TOTAL, current]);

  const handleFinish = useCallback(() => {
    const result: DrillResult = {
      correct: correctCount,
      total: TOTAL,
      timeTaken: Date.now() - overallStartRef.current,
    };
    onComplete(result);
  }, [correctCount, TOTAL, onComplete]);

  if (TOTAL === 0) {
    return (
      <div className="text-center py-8 text-[var(--ivory-muted)]">
        {t('drills.common.noQuestions')}
      </div>
    );
  }

  // ===== 完成结果页 =====
  if (finished || !current) {
    const accuracy = TOTAL > 0 ? Math.round((correctCount / TOTAL) * 100) : 0;
    const seconds = ((Date.now() - overallStartRef.current) / 1000).toFixed(1);
    return (
      <div className="text-center py-8">
        <Trophy className="w-14 h-14 text-[var(--brass-bright)] mx-auto mb-4" />
        <h3 className="font-display text-2xl text-[var(--ivory)] mb-6">
          {t('drills.common.complete')}
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('academy.drill.accuracy')}</p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{seconds}s</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> {t('drills.common.timeLabel')}
            </p>
          </div>
          <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
            <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{TOTAL}</p>
            <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
              <Target className="w-3 h-3" /> {t('academy.drill.correctCount')}
            </p>
          </div>
        </div>
        <button
          onClick={handleFinish}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t('drills.common.finishBtn')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ===== 答题页 =====
  return (
    <div className="space-y-5">
      {/* Header: 进度 + 退出 */}
      <div className="flex items-center gap-3">
        <button
          onClick={onExit}
          className="inline-flex items-center gap-1 text-xs text-[var(--ivory-muted)] hover:text-[var(--brass-bright)] transition-colors shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('drills.common.exit')}
        </button>
        <div className="flex-1 h-1.5 rounded-full bg-[var(--walnut-raised)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--brass-bright)] transition-all duration-300"
            style={{ width: `${(currentIndex / TOTAL) * 100}%` }}
          />
        </div>
        <span className="text-xs text-[var(--ivory-muted)] shrink-0">
          {currentIndex + 1} / {TOTAL}
        </span>
        {currentIndex > 0 && (
          <span className="text-xs text-[var(--success)] shrink-0">
            {t('academy.drill.accuracy')} {Math.round((correctCount / currentIndex) * 100)}%
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-xl text-[var(--ivory)]">
          {resolveLessonTitle(t, lesson)}
        </h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">
          {resolveLessonSubtitle(t, lesson)}
        </p>
      </div>

      {/* Scenario + Question */}
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
        {/* Scenario tag */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          {current.scenario && (
            <span className="px-2 py-0.5 rounded-full bg-black/30 text-[11px] text-[var(--ivory-dim)]">
              {current.scenario}
            </span>
          )}
          {current.hand && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--brass-bright)]/20 text-[11px] text-[var(--brass-bright)] font-mono font-bold">
              {current.hand}
            </span>
          )}
          {current.position && (
            <span className="px-2 py-0.5 rounded-full bg-[var(--info)]/20 text-[11px] text-[var(--info)] font-bold">
              {current.position}
            </span>
          )}
        </div>

        {/* Question text */}
        <p className="text-sm text-[var(--ivory)] text-center font-medium">
          {current.question}
        </p>

        {/* Difficulty indicator */}
        <div className="flex items-center justify-center gap-1 mt-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                i < current.difficulty ? 'bg-[var(--warning)]' : 'bg-[var(--walnut-border)]',
              )}
            />
          ))}
        </div>
      </div>

      {/* Options */}
      <div className={cn(
        'grid gap-2.5',
        current.options.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2',
      )}>
        {current.options.map((opt, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = isAnswered && opt.isCorrect;
          const showWrong = isAnswered && isSelected && !opt.isCorrect;
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={cn(
                'relative rounded-lg border px-4 py-3 text-sm font-bold transition-all text-left',
                'bg-[var(--walnut-raised)] border-[var(--walnut-border)] text-[var(--ivory)]',
                'hover:bg-[var(--walnut-raised)]/80',
                !isAnswered && 'hover:scale-[1.02]',
                showCorrect && 'ring-2 ring-[var(--success)] bg-[var(--success)]/15 border-[var(--success)]',
                showWrong && 'ring-2 ring-[var(--danger)] bg-[var(--danger)]/15 border-[var(--danger)] opacity-80',
                isAnswered && !showCorrect && !showWrong && 'opacity-40',
              )}
            >
              <span className="mr-2 text-xs opacity-50 font-mono">{String.fromCharCode(65 + i)}.</span>
              {opt.text}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && selectedIndex !== null && (
        <div
          className={cn(
            'rounded-lg border p-4',
            current.options[selectedIndex]?.isCorrect
              ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
              : 'border-[var(--danger)]/40 bg-[var(--danger)]/10',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {current.options[selectedIndex]?.isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                <span className="text-sm font-bold text-[var(--success)]">{t('academy.drill.correct')}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-[var(--danger)]" />
                <span className="text-sm font-bold text-[var(--danger)]">{t('academy.drill.incorrect')}</span>
                {current.options.find(o => o.isCorrect) && (
                  <span className="text-xs text-[var(--ivory-muted)] ml-2">
                    {t('drills.common.correctAnswerPrefix', { answer: current.options.find(o => o.isCorrect)!.text })}
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">
            {current.explanation}
          </p>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {currentIndex + 1 >= TOTAL ? t('academy.drill.viewScore') : t('drills.common.next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
