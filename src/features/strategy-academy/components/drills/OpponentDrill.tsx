// P2-1.8: OpponentDrill — 对手画像识别训练
// 两阶段作答：第 1 问判断对手类型，第 2 问选择剥削策略；两问全对才计为答对
// 判分逻辑：utils/opponentScoring.ts 的 scoreOpponentAnswer（本组件仅渲染与状态编排）
// 题库：data/opponentProfiles.ts 的 OPPONENT_DRILL_QUESTIONS（8 题）

import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { OPPONENT_DRILL_QUESTIONS, getOpponentProfile } from '../../data/opponentProfiles';
import { scoreOpponentAnswer } from '../../utils/opponentScoring';
import { OpponentStatsPanel } from './OpponentStatsPanel';
import { OpponentDrillResult } from './OpponentDrillResult';
import type { DrillProps, DrillResult } from './types';

const TOTAL = OPPONENT_DRILL_QUESTIONS.length;

export default function OpponentDrill({ onComplete, onExit }: DrillProps) {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const overallStartRef = useRef<number>(Date.now());

  const current = OPPONENT_DRILL_QUESTIONS[currentIndex]!;
  const isAnswered = selectedStrategy !== null;
  const { typeCorrect, strategyCorrect } = scoreOpponentAnswer(current, selectedType, selectedStrategy);

  const handleSelectType = useCallback(
    (profileId: string) => {
      if (selectedType !== null) return;
      setSelectedType(profileId);
    },
    [selectedType],
  );

  const handleSelectStrategy = useCallback(
    (index: number) => {
      if (selectedType === null || selectedStrategy !== null) return;
      setSelectedStrategy(index);
      if (scoreOpponentAnswer(current, selectedType, index).isFullyCorrect) {
        setCorrectCount((c) => c + 1);
      }
    },
    [selectedType, selectedStrategy, current],
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= TOTAL) {
      setFinished(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedType(null);
    setSelectedStrategy(null);
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
    return (
      <OpponentDrillResult
        correctCount={correctCount}
        total={TOTAL}
        startTime={overallStartRef.current}
        onFinish={handleFinish}
      />
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
      </div>

      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-xl text-[var(--ivory)]">{t('drills.opponent.title')}</h2>
        <p className="text-xs text-[var(--ivory-dim)] mt-1">{t('drills.opponent.subtitle')}</p>
      </div>

      {/* 对手数据面板 */}
      <OpponentStatsPanel question={current} />

      {/* 第 1 问：对手类型 */}
      <div>
        <p className="text-sm text-[var(--ivory)] font-medium mb-2">{t('drills.opponent.typePrompt')}</p>
        <div className="grid grid-cols-2 gap-2">
          {current.typeOptions.map((profileId) => {
            const profile = getOpponentProfile(profileId);
            const isSelected = selectedType === profileId;
            const revealCorrect = isAnswered && profileId === current.correctType;
            const revealWrong = isAnswered && isSelected && profileId !== current.correctType;
            return (
              <button
                key={profileId}
                onClick={() => handleSelectType(profileId)}
                disabled={selectedType !== null}
                aria-label={profile.name}
                className={cn(
                  'rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                  'border-[var(--walnut-border)] bg-[var(--walnut-raised)] text-[var(--ivory)]',
                  selectedType === null && 'hover:border-[var(--brass-bright)] hover:bg-[var(--brass-bright)]/10 cursor-pointer',
                  isSelected && !isAnswered && 'border-[var(--brass-bright)] bg-[var(--brass-bright)]/10',
                  revealCorrect && 'border-[var(--success)] bg-[var(--success)]/15 text-[var(--success)]',
                  revealWrong && 'border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--danger)]',
                )}
              >
                <span className="mr-1.5">{profile.icon}</span>
                {profile.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 第 2 问：应对策略（类型选定后出现） */}
      {selectedType !== null && (
        <div>
          <p className="text-sm text-[var(--ivory)] font-medium mb-2">{t('drills.opponent.strategyPrompt')}</p>
          <div className="space-y-2">
            {current.strategyOptions.map((option, index) => {
              const isSelected = selectedStrategy === index;
              const revealCorrect = isAnswered && index === current.correctStrategyIndex;
              const revealWrong = isAnswered && isSelected && index !== current.correctStrategyIndex;
              return (
                <button
                  key={option}
                  onClick={() => handleSelectStrategy(index)}
                  disabled={isAnswered}
                  aria-label={option}
                  className={cn(
                    'w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                    'border-[var(--walnut-border)] bg-[var(--walnut-raised)] text-[var(--ivory)]',
                    !isAnswered && 'hover:border-[var(--brass-bright)] hover:bg-[var(--brass-bright)]/10 cursor-pointer',
                    revealCorrect && 'border-[var(--success)] bg-[var(--success)]/15 text-[var(--success)]',
                    revealWrong && 'border-[var(--danger)] bg-[var(--danger)]/15 text-[var(--danger)]',
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 反馈 */}
      {isAnswered && (
        <div
          className={cn(
            'rounded-lg border p-4',
            typeCorrect && strategyCorrect
              ? 'border-[var(--success)]/40 bg-[var(--success)]/10'
              : 'border-[var(--danger)]/40 bg-[var(--danger)]/10',
          )}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold">
              {typeCorrect
                ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                : <XCircle className="w-4 h-4 text-[var(--danger)]" />}
              <span className={typeCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                {t('drills.opponent.typeLabel')}
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold">
              {strategyCorrect
                ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
                : <XCircle className="w-4 h-4 text-[var(--danger)]" />}
              <span className={strategyCorrect ? 'text-[var(--success)]' : 'text-[var(--danger)]'}>
                {t('drills.opponent.strategyLabel')}
              </span>
            </span>
            {!typeCorrect && (
              <span className="text-xs text-[var(--ivory-muted)]">
                {t('drills.common.correctAnswerPrefix', { answer: getOpponentProfile(current.correctType).name })}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--ivory-dim)] leading-relaxed">{current.explanation}</p>
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
