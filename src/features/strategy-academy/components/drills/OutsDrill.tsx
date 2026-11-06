// P0-3.5: OutsDrill — Outs 速算
// 8 道题，覆盖同花听牌 / OESD / Gutshot / 二四法则 / 高牌听牌
// 图形化显示 hero 底牌 + 公共牌
// 答案位置偏差治理：选项经 t() 解析后用 orderResolvedOptions 重排（数值题按 id 哈希定向单调排列）

import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { PokerCard } from '@/shared/components/poker/Card';
import { stringToCard } from '@/shared/utils/deck';
import { cn } from '@/shared/utils/cn';
import { orderResolvedOptions } from '../../utils/quizShuffle';
import { OUTS_QUESTIONS } from './outsQuestions';
import { DrillResultView } from './DrillResultView';
import { DrillProgressHeader } from './DrillProgressHeader';
import type { DrillProps, DrillResult } from './types';

const TOTAL = OUTS_QUESTIONS.length;

export default function OutsDrill({ onComplete, onExit }: DrillProps) {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const overallStartRef = useRef<number>(Date.now());

  const raw = OUTS_QUESTIONS[currentIndex]!;
  const language = i18n.language;
  // 渲染前重排：t() 解析后按数值定向单调排列 / 种子洗牌，correctIndex 同步重映射。
  // 依赖 language：语言切换时用新文本重算（种子只依赖题目 id，同题顺序跨语言一致）。
  const current = useMemo(() => {
    void language;
    const ordered = orderResolvedOptions(raw.id, raw.optionsKeys, raw.correctIndex, (key) =>
      t(key),
    );
    return { ...raw, optionsKeys: ordered.options, correctIndex: ordered.correctIndex };
  }, [raw, t, language]);

  const handleSelect = useCallback(
    (idx: number) => {
      if (isAnswered) return;
      setSelectedIndex(idx);
      setIsAnswered(true);
      if (idx === current.correctIndex) {
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
    setSelectedIndex(null);
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
          {t('drills.outs.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">
          {t('drills.outs.subtitle')}
        </p>
      </div>

      {/* Prompt + Cards */}
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
        <p className="text-sm text-[var(--ivory)] text-center font-medium">
          {t(current.promptKey)}
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          {current.board && current.board.length > 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-[var(--ivory-muted)]">
                {t('drills.outs.boardLabel')}
              </span>
              <div className="flex gap-1.5 justify-center flex-wrap">
                {current.board.map((c, i) => (
                  <PokerCard key={i} card={stringToCard(c)} size="sm" animationDelay={i * 0.06} />
                ))}
              </div>
            </div>
          )}
          {current.heroHand && current.heroHand.length > 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-[var(--ivory-muted)]">
                {t('drills.outs.heroLabel')}
              </span>
              <div className="flex gap-1.5">
                {current.heroHand.map((c, i) => (
                  <PokerCard key={i} card={stringToCard(c)} size="sm" animationDelay={i * 0.1} />
                ))}
              </div>
            </div>
          )}
          {(!current.heroHand || current.heroHand.length === 0) &&
            (!current.board || current.board.length === 0) && (
              <p className="text-xs text-[var(--ivory-muted)]">
                {t('drills.outs.rulePrompt')}
              </p>
            )}
        </div>
      </div>

      {/* Options */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {current.optionsKeys.map((optKey, i) => {
          const isSelected = selectedIndex === i;
          const showCorrect = isAnswered && i === current.correctIndex;
          const showWrong = isAnswered && isSelected && i !== current.correctIndex;
          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              disabled={isAnswered}
              className={cn(
                'relative min-w-[80px] rounded-lg border px-3 py-3 text-sm font-bold transition-all',
                'bg-[var(--walnut-raised)] border-[var(--walnut-border)] text-[var(--ivory)]',
                'hover:bg-[var(--walnut-raised)]/80',
                !isAnswered && 'hover:scale-[1.02]',
                showCorrect && 'ring-2 ring-[var(--success)] bg-[var(--success)]/15 border-[var(--success)]',
                showWrong && 'ring-2 ring-[var(--danger)] bg-[var(--danger)]/15 border-[var(--danger)] opacity-80',
                isAnswered && !showCorrect && !showWrong && 'opacity-40',
              )}
            >
              {t(optKey)}
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {isAnswered && (
        <div
          className={cn(
            'rounded-lg border p-4',
            selectedIndex === current.correctIndex
              ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
              : 'border-[var(--danger)]/40 bg-[var(--danger)]/10',
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {selectedIndex === current.correctIndex ? (
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
                  {t('drills.common.correctAnswerPrefix', {
                    answer: t(current.optionsKeys[current.correctIndex]!),
                  })}
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
