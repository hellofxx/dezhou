// ChoiceDrillRenderer — 通用选择题 Drill 渲染器
// 用于 L2-L8 的 ChoiceDrill 类型课程，数据来自 lesson.drillData

import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { orderDrillOptions } from '../../utils/quizShuffle';
import { resolveLessonTitle, resolveLessonSubtitle } from '../../utils/titleKeys';
import { resolveDrillQuestion } from '../../utils/contentKeys';
import { DrillResultView } from './DrillResultView';
import { DrillProgressHeader } from './DrillProgressHeader';
import type { DrillProps, DrillResult } from './types';
import type { Lesson } from '../../types';

interface ChoiceDrillRendererProps extends DrillProps {
  lesson: Lesson;
}

export default function ChoiceDrillRenderer({ onComplete, onExit, lesson }: ChoiceDrillRendererProps) {
  const { t } = useTranslation();
  // 答案位置偏差治理：渲染前先 t() 解析（key 缺失回退数据层中文），再重排选项
  // （数值升序 / id 稳定种子洗牌）——种子只依赖 id，zh/en 顺序一致，源数据不变
  const questions = useMemo(
    () => (lesson.drillData?.questions ?? []).map((q) => orderDrillOptions(resolveDrillQuestion(t, q))),
    [lesson, t],
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
    const seconds = ((Date.now() - overallStartRef.current) / 1000).toFixed(1);
    return (
      <DrillResultView
        correct={correctCount}
        total={TOTAL}
        timeText={`${seconds}s`}
        titleKey="drills.common.complete"
        accuracyLabelKey="academy.drill.accuracy"
        timeLabelKey="drills.common.timeLabel"
        correctLabelKey="academy.drill.correctCount"
        ctaLabelKey="drills.common.finishBtn"
        onFinish={handleFinish}
      />
    );
  }

  // ===== 答题页 =====
  return (
    <div className="space-y-5">
      {/* Header: 进度 + 退出 */}
      <DrillProgressHeader
        current={currentIndex + 1}
        total={TOTAL}
        onExit={onExit}
        progressText={`${currentIndex + 1} / ${TOTAL}`}
        runningAccuracy={{
          correct: correctCount,
          answered: currentIndex,
          textKey: 'academy.drill.liveAccuracy',
        }}
      />

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
                <XCircle className="w-4 h-4 text-[var(--danger-text)]" />
                <span className="text-sm font-bold text-[var(--danger-text)]">{t('academy.drill.incorrect')}</span>
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity"
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
