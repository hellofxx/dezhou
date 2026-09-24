import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, X } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { useProgressStore } from '@/features/progress/store';
import { placementQuestions } from '../data/placementQuestions';
import { orderPlacementOptions } from '../utils/optionOrder';
import type { PlacementDimension } from '../types';

// 正确率（0-1）映射到 30-70 区间
function scoreFromAccuracy(correct: number, total: number): number {
  if (total === 0) return 50;
  return Math.round((correct / total) * 40 + 30);
}

export default function PlacementTestStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  // 按维度累计正确数
  const [dimensionStats, setDimensionStats] = useState<Record<PlacementDimension, { correct: number; total: number }>>({
    handRanking: { correct: 0, total: 0 },
    position: { correct: 0, total: 0 },
    odds: { correct: 0, total: 0 },
    range: { correct: 0, total: 0 },
  });

  const question = placementQuestions[currentIdx]!;
  const isLast = currentIdx === placementQuestions.length - 1;

  // 答案位置偏差治理：t() 解析后、渲染前对选项重排（数值升序 / hash(id) 种子洗牌）
  const orderedOptions = useMemo(
    () => orderPlacementOptions(question, (o) => t(o.text)),
    [question, t],
  );

  const handleSelect = (optionId: string) => {
    if (answered) return;
    setSelectedOption(optionId);
    setAnswered(true);

    const option = question.options.find((o) => o.id === optionId);
    const isCorrect = option?.isCorrect ?? false;
    setDimensionStats((prev) => ({
      ...prev,
      [question.dimension]: {
        correct: prev[question.dimension].correct + (isCorrect ? 1 : 0),
        total: prev[question.dimension].total + 1,
      },
    }));
  };

  const handleNext = () => {
    if (isLast) {
      // 计算各维度得分（30-70 区间）
      const initialAbility = {
        rangeKnowledge: scoreFromAccuracy(
          dimensionStats.handRanking.correct + dimensionStats.range.correct,
          dimensionStats.handRanking.total + dimensionStats.range.total,
        ),
        oddsCalculation: scoreFromAccuracy(
          dimensionStats.odds.correct,
          dimensionStats.odds.total,
        ),
        positionalPlay: scoreFromAccuracy(
          dimensionStats.position.correct,
          dimensionStats.position.total,
        ),
        gtoUnderstanding: 50, // 定位测试无 GTO 直接题目，使用中性默认值
      };

      const totalCorrect = Object.values(dimensionStats).reduce((sum, s) => sum + s.correct, 0);
      const placementTestScore = Math.round((totalCorrect / placementQuestions.length) * 100);

      completeOnboardingStep(2, { placementTestScore, initialAbility });
    } else {
      setCurrentIdx((i) => i + 1);
      setSelectedOption(null);
      setAnswered(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-8 max-w-2xl mx-auto">
      <div className="text-xs text-[var(--brass)] font-numeric tracking-wider mb-2">
        {t('onboarding.placement.questionOf', { current: currentIdx + 1, total: placementQuestions.length })}
      </div>
      <h2 className="font-display text-2xl text-[var(--ivory)] text-center mb-8">
        {t(question.question)}
      </h2>

      <div className="w-full space-y-3 mb-6">
        {orderedOptions.map((option) => {
          const isSelected = selectedOption === option.id;
          const showCorrect = answered && option.isCorrect;
          const showWrong = answered && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={answered}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-md border text-left transition-all',
                !answered && 'border-[var(--walnut-border)] bg-[var(--surface)] hover:border-[var(--brass)] hover:bg-[var(--walnut-light)]/40',
                showCorrect && 'border-[var(--sage)] bg-[var(--sage)]/12',
                showWrong && 'border-[var(--clay)] bg-[var(--clay)]/12',
                answered && !showCorrect && !showWrong && 'border-[var(--walnut-border)] bg-[var(--surface)] opacity-60',
              )}
            >
              <span className="text-sm text-[var(--ivory)]">{t(option.text)}</span>
              {showCorrect && <Check size={18} className="text-[var(--sage)] shrink-0" />}
              {showWrong && <X size={18} className="text-[var(--clay)] shrink-0" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="w-full p-4 rounded-md bg-[var(--walnut-light)]/30 border border-[var(--walnut-border)] mb-6">
          <p className="text-xs text-[var(--brass)] font-medium mb-1">
            {t('onboarding.placement.explanation')}
          </p>
          <p className="text-sm text-[var(--ivory-muted)]">{t(question.explanation)}</p>
        </div>
      )}

      <Button
        onClick={handleNext}
        disabled={!answered}
        className="min-w-32"
      >
        {isLast ? t('onboarding.placement.finish') : t('onboarding.placement.next')}
      </Button>
    </div>
  );
}
