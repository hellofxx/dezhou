// P0-3.3: HandRankingDrill — 牌力排名闪电战
// 10 道题，最后 2 题简单题，复用 PokerCard 渲染牌面
// 所有用户可见文案均通过 useTranslation 引用 i18n key
// 答案位置偏差治理：选项经解析后用 orderResolvedOptions 按 id 种子洗牌（牌型名为文字选项）

import { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { ArrowLeft, CheckCircle2, XCircle, ArrowRight, Trophy, Clock, Target } from 'lucide-react';
import { PokerCard } from '@/shared/components/Card';
import { stringToCard } from '@/shared/utils/deck';
import { cn } from '@/shared/utils/cn';
import { orderResolvedOptions } from '../../utils/quizShuffle';
import { HAND_RANKING_QUESTIONS } from './handRankingQuestions';
import type { DrillProps, DrillResult } from './types';

const TOTAL = HAND_RANKING_QUESTIONS.length;

export default function HandRankingDrill({ onComplete, onExit }: DrillProps) {
  const { t, i18n } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const overallStartRef = useRef<number>(Date.now());

  const raw = HAND_RANKING_QUESTIONS[currentIndex]!;
  const language = i18n.language;
  // 渲染前重排：选项文本（含 simple-compare 的内联 label）解析后按 id 种子洗牌，
  // correctIndex 同步重映射。依赖 language：语言切换时重算（种子只依赖 id，顺序跨语言一致）。
  const current = useMemo(() => {
    void language;
    const ordered = orderResolvedOptions(raw.id, raw.optionsKeys, raw.correctIndex, (key) =>
      resolveOptionText(t, raw, key),
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
    startTimeRef.current = Date.now();
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
          {t('drills.handRanking.title')}
        </h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">
          {t('drills.handRanking.subtitle')}
        </p>
      </div>

      {/* Prompt */}
      <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--felt)] p-5">
        <p className="text-sm text-[var(--ivory)] text-center font-medium">
          {t(current.promptKey)}
        </p>

        {/* Cards display */}
        <div className="mt-4 flex flex-col items-center gap-3">
          {current.type === 'compare-hands' && current.handA && current.handB && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              <HandRow
                label={t('drills.handRanking.options.handA')}
                cards={current.handA}
              />
              <span className="font-display text-lg text-[var(--ivory-muted)]">VS</span>
              <HandRow
                label={t('drills.handRanking.options.handB')}
                cards={current.handB}
              />
            </div>
          )}
          {current.type === 'identify-rank' && current.cards && (
            <div className="flex gap-1.5 justify-center flex-wrap">
              {current.cards.map((c, i) => (
                <PokerCard key={i} card={stringToCard(c)} size="sm" animationDelay={i * 0.08} />
              ))}
            </div>
          )}
          {current.type === 'simple-compare' && (
            <div className="flex items-center justify-center gap-6 sm:gap-10">
              <SimpleLabel label={current.labelA!} />
              <span className="font-display text-lg text-[var(--ivory-muted)]">VS</span>
              <SimpleLabel label={current.labelB!} />
            </div>
          )}
        </div>
      </div>

      {/* Options */}
      <div
        className={cn(
          'grid gap-2.5',
          current.optionsKeys.length === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-4',
        )}
      >
        {current.optionsKeys.map((optKey, i) => {
          const optionText = resolveOptionText(t, current, optKey);
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
              {optionText}
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
                <XCircle className="w-4 h-4 text-[var(--danger)]" />
                <span className="text-sm font-bold text-[var(--danger)]">
                  {t('drills.common.wrongFeedback')}
                </span>
                <span className="text-xs text-[var(--ivory-muted)] ml-2">
                  {t('drills.common.correctAnswerPrefix', {
                    answer: resolveOptionText(t, current, current.optionsKeys[current.correctIndex]!),
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
function HandRow({ label, cards }: { label: string; cards: string[] }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs text-[var(--ivory-muted)] font-medium">{label}</span>
      <div className="flex gap-1.5">
        {cards.map((c, i) => (
          <PokerCard key={i} card={stringToCard(c)} size="sm" animationDelay={i * 0.06} />
        ))}
      </div>
    </div>
  );
}

function SimpleLabel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-[var(--ivory-muted)]">{label.length > 2 ? '手牌' : '对子'}</span>
      <span className="font-display text-3xl font-bold text-[var(--brass-bright)] tracking-wider">
        {label}
      </span>
    </div>
  );
}

// ===== 工具：解析选项文本 =====
// simple-compare 题型使用 labelA/labelB 内联数据；其它题型直接走 i18n。
// 按 key 而非按位置匹配：选项重排后位置会变，key 是唯一稳定标识。
function resolveOptionText(
  t: TFunction,
  q: typeof HAND_RANKING_QUESTIONS[number],
  optKey: string,
): string {
  if (q.type === 'simple-compare') {
    if (optKey === 'drills.handRanking.options.labelA' && q.labelA) return q.labelA;
    if (optKey === 'drills.handRanking.options.labelB' && q.labelB) return q.labelB;
  }
  return t(optKey);
}
