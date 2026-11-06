// P0-3.4: PositionDrill — 位置认知训练
// 交互式 6-max 椭圆牌桌布局，点击位置作答
// 复用 shadcn/ui button 风格的 seat button

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { POSITION_QUESTIONS, SEAT_LAYOUT } from './positionQuestions';
import type { SeatId } from './positionQuestions';
import { DrillResultView } from './DrillResultView';
import { DrillProgressHeader } from './DrillProgressHeader';
import type { DrillProps, DrillResult } from './types';

const TOTAL = POSITION_QUESTIONS.length;

export default function PositionDrill({ onComplete, onExit }: DrillProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<SeatId | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const overallStartRef = useRef<number>(Date.now());

  const current = POSITION_QUESTIONS[currentIndex]!;

  const handleSeatClick = useCallback(
    (seat: SeatId) => {
      if (isAnswered) return;
      setSelectedSeat(seat);
      setIsAnswered(true);
      if (seat === current.target) {
        setCorrectCount((c) => c + 1);
      }
    },
    [isAnswered, current],
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= TOTAL) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedSeat(null);
    setIsAnswered(false);
  }, [currentIndex]);

  const handleFinish = useCallback(() => {
    const result: DrillResult = {
      correct: correctCount,
      total: TOTAL,
      timeTaken: Date.now() - overallStartRef.current,
    };
    onComplete(result);
  }, [correctCount, onComplete]);

  // ===== 完成结果页 =====
  if (finished) {
    const seconds = ((Date.now() - overallStartRef.current) / 1000).toFixed(1);
    return (
      <DrillResultView
        correct={correctCount}
        total={TOTAL}
        timeText={`${seconds}s`}
        titleKey="drills.common.complete"
        accuracyLabelKey="drills.common.accuracyLabel"
        timeLabelKey="drills.common.timeLabel"
        correctLabelKey="drills.common.correctLabel"
        ctaLabelKey="drills.common.finish"
        onFinish={handleFinish}
      />
    );
  }

  // ===== 答题页 =====
  return (
    <div className="space-y-5">
      {/* Header */}
      <DrillProgressHeader
        current={currentIndex + 1}
        total={TOTAL}
        onExit={onExit}
        progressText={t('drills.common.progress', { current: currentIndex + 1, total: TOTAL })}
        runningAccuracy={{ correct: correctCount, answered: currentIndex }}
      />

      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-xl text-[var(--ivory)]">
          {t('drills.position.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">
          {t('drills.position.subtitle')}
        </p>
      </div>

      {/* Prompt */}
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-4 text-center">
        <p className="text-sm text-[var(--ivory)] font-medium">
          {t(current.promptKey)}
        </p>
      </div>

      {/* 牌桌 */}
      <div className="relative w-full max-w-md mx-auto" style={{ aspectRatio: '4 / 3' }}>
        {/* 椭圆形桌面 */}
        <div
          className="absolute inset-4 rounded-[50%] border-2 border-[var(--walnut-border)]"
          style={{
            background:
              'radial-gradient(ellipse at center, var(--felt-light) 0%, var(--felt) 70%)',
            boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)',
          }}
        />
        {/* 6 个座位 */}
        {SEAT_LAYOUT.map((seat) => {
          const isCorrect = isAnswered && seat.id === current.target;
          const isWrongSelected = isAnswered && selectedSeat === seat.id && seat.id !== current.target;
          return (
            <button
              key={seat.id}
              onClick={() => handleSeatClick(seat.id)}
              disabled={isAnswered}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center',
                'w-14 h-14 rounded-full border-2 text-xs font-bold transition-all',
                'bg-[var(--walnut-raised)] border-[var(--walnut-border)] text-[var(--ivory)]',
                !isAnswered && 'hover:scale-110 hover:border-[var(--brass-bright)] hover:bg-[var(--brass-bright)]/10 cursor-pointer',
                isCorrect && 'bg-[var(--success)]/30 border-[var(--success)] text-[var(--success)] ring-2 ring-[var(--success)]',
                isWrongSelected && 'bg-[var(--danger)]/30 border-[var(--danger)] text-[var(--danger-text)] opacity-80',
                isAnswered && !isCorrect && !isWrongSelected && 'opacity-50',
              )}
              style={{ top: seat.top, left: seat.left }}
              aria-label={seat.id}
            >
              <span className="font-display">{seat.id}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && (
        <div
          className={cn(
            'rounded-lg border p-4',
            selectedSeat === current.target
              ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
              : 'border-[var(--danger)]/40 bg-[var(--danger)]/10',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {selectedSeat === current.target ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                <span className="text-sm font-bold text-[var(--success)]">
                  {t('drills.common.correctFeedback')}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-[var(--danger-text)]" />
                <span className="text-sm font-bold text-[var(--danger-text)]">
                  {t('drills.common.wrongFeedback')}
                </span>
                <span className="text-xs text-[var(--ivory-muted)] ml-2">
                  {t('drills.common.correctAnswerPrefix', { answer: current.target })}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">
            {t(current.explanationKey)}
          </p>
          <div className="flex justify-end mt-3">
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-fill)] text-[var(--brass-fill-ink)] font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              {currentIndex + 1 >= TOTAL ? t('drills.common.viewResult') : t('drills.common.next')}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
