// P0-3.6: PotOddsDrill — 底池赔率直觉
// 6 道题，图形化赔率计算与跟注/弃牌决策
// 答案位置偏差治理：选项经 t() 解析后用 orderResolvedOptions 重排
// （百分比题按 id 哈希定向单调排列；跟注/弃牌文字题按 id 种子洗牌）

import { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Clock, Target } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { orderResolvedOptions } from '../../utils/quizShuffle';
import { POT_ODDS_QUESTIONS } from './potOddsQuestions';
import type { DrillProps, DrillResult } from './types';

const TOTAL = POT_ODDS_QUESTIONS.length;

export default function PotOddsDrill({ onComplete, onExit }: DrillProps) {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const overallStartRef = useRef<number>(Date.now());

  const raw = POT_ODDS_QUESTIONS[currentIndex]!;
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
    const accuracy = Math.round((correctCount / TOTAL) * 100);
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
            <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('drills.common.accuracyLabel')}</p>
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
              <Target className="w-3 h-3" /> {t('drills.common.correctLabel')}
            </p>
          </div>
        </div>
        <button
          onClick={handleFinish}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {t('drills.common.finish')}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // ===== 答题页 =====
  return (
    <div className="space-y-5">
      {/* Header */}
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
          {t('drills.common.progress', { current: currentIndex + 1, total: TOTAL })}
        </span>
        {currentIndex > 0 && (
          <span className="text-xs text-[var(--success)] shrink-0">
            {t('drills.common.runningAccuracy', {
              rate: Math.round((correctCount / currentIndex) * 100),
            })}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-xl text-[var(--ivory)]">
          {t('drills.potOdds.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">
          {t('drills.potOdds.subtitle')}
        </p>
      </div>

      {/* Prompt + Pot visualization */}
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
        <p className="text-sm text-[var(--ivory)] text-center font-medium">
          {t(current.promptKey)}
        </p>
        <div className="mt-4 flex flex-col items-center gap-3">
          {/* 文字信息：底池 / 下注 / 跟注 / 胜率 */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            {current.potSize !== undefined && (
              <InfoChip
                label={t('drills.potOdds.potLabel')}
                value={`${current.potSize} BB`}
                color="green"
              />
            )}
            {current.betSize !== undefined && (
              <InfoChip
                label={t('drills.potOdds.betLabel')}
                value={`${current.betSize} BB`}
                color="orange"
              />
            )}
            {current.callSize !== undefined && (
              <InfoChip
                label={t('drills.potOdds.callLabel')}
                value={`${current.callSize} BB`}
                color="blue"
              />
            )}
            {current.equity !== undefined && (
              <InfoChip
                label={t('drills.potOdds.equityLabel')}
                value={`${current.equity}%`}
                color="purple"
              />
            )}
          </div>

          {/* 图形化可视化：底池 vs 跟注金额比例 */}
          {current.showGraphical &&
            current.potSize !== undefined &&
            current.callSize !== undefined && (
              <PotVisualization t={t} potSize={current.potSize} callSize={current.callSize} />
            )}
        </div>
      </div>

      {/* Options */}
      <div
        className={cn(
          'grid gap-2.5',
          current.optionsKeys.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
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
                'relative min-w-[100px] rounded-lg border px-4 py-3 text-sm font-bold transition-all',
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
                <span className="text-xs text-[var(--success)]/80 ml-2">
                  {t('drills.potOdds.positiveEv')}
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-[var(--danger)]" />
                <span className="text-sm font-bold text-[var(--danger)]">
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
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
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

// ===== 子组件 =====
function InfoChip({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: 'green' | 'orange' | 'blue' | 'purple';
}) {
  const colorClass = {
    green: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30',
    orange: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30',
    blue: 'bg-[var(--info)]/15 text-[var(--info)] border-[var(--info)]/30',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }[color];
  return (
    <div className={cn('inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1', colorClass)}>
      <span className="opacity-80">{label}</span>
      <span className="font-numeric font-bold">{value}</span>
    </div>
  );
}

function PotVisualization({
  t,
  potSize,
  callSize,
}: {
  t: TFunction;
  potSize: number;
  callSize: number;
}) {
  const total = potSize + callSize;
  const potPercent = (potSize / total) * 100;
  const callPercent = (callSize / total) * 100;
  return (
    <div className="w-full max-w-sm">
      <div className="flex h-6 rounded-md overflow-hidden border border-[var(--walnut-border)]">
        <div
          className="bg-[var(--success)]/60 flex items-center justify-center text-[10px] font-bold text-[var(--felt-deep)]"
          style={{ width: `${potPercent}%` }}
        >
          {potPercent >= 20 ? `${t('drills.potOdds.potLabel')} ${potSize}` : ''}
        </div>
        <div
          className="bg-[var(--info)]/60 flex items-center justify-center text-[10px] font-bold text-[var(--ivory)]"
          style={{ width: `${callPercent}%` }}
        >
          {callPercent >= 20 ? `${t('drills.potOdds.callLabel')} ${callSize}` : ''}
        </div>
      </div>
      <p className="text-[10px] text-[var(--ivory-muted)] text-center mt-1">
        {t('drills.potOdds.ratioHint', { pot: potSize, call: callSize })}
      </p>
    </div>
  );
}
