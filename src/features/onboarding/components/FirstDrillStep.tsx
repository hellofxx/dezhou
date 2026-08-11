import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { QuizCard } from '@/features/range-trainer/components/QuizCard';
import type { RangeAction } from '@/shared/types/poker';
import { useProgressStore } from '@/features/progress/store';
import {
  createDrillState,
  answerCurrentQuestion,
  advanceDrill,
  shouldShowRescueHint,
  isOnFinalQuestion,
} from '../utils/drillFlow';

// 首次微训练：题目编排与补救状态机见 ../utils/drillFlow.ts（P2A-03/04/05 纯函数化）
export default function FirstDrillStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);
  const recordTrainingDay = useProgressStore((s) => s.recordTrainingDay);

  const [drill, setDrill] = useState(createDrillState);
  // OB-05：防止「完成」按钮快速双击触发两次 completeOnboardingStep（加锁防抖）
  const completingRef = useRef(false);

  const currentQuestion = drill.questions[drill.currentIdx]!;
  const isFinal = isOnFinalQuestion(drill);

  // QuizCard 不使用 timeRemaining / timeLimit，传 0 满足类型
  const timeProps = useMemo(() => ({ timeRemaining: 0, timeLimit: 0 }), []);

  const handleAnswer = (action: RangeAction) => {
    setDrill((prev) => answerCurrentQuestion(prev, action));
  };

  const handleNext = () => {
    if (completingRef.current) return;
    const result = advanceDrill(drill);
    if (result.done) {
      // P2A-02：首胜达成时刻（微训练完成、进入庆祝页之前）记 Day 1 训练日。
      // recordTrainingDay 幂等防同日重复；庆祝页只做展示，
      // 跨日卡在庆祝页重新挂载不会再触发本回调 → 不再重复记训练日
      completingRef.current = true;
      recordTrainingDay();
      completeOnboardingStep(3);
      return;
    }
    setDrill(result.state);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-6 max-w-2xl mx-auto">
      <div className="text-xs text-[var(--brass)] font-numeric tracking-wider mb-1">
        {t('onboarding.drill.questionOf', {
          current: drill.currentIdx + 1,
          total: drill.questions.length,
        })}
      </div>
      <h2 className="font-display text-xl text-[var(--ivory)] text-center mb-6">
        {t('onboarding.drill.title')}
      </h2>

      <div className="w-full flex justify-center mb-6">
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          feedback={drill.feedback}
          disabled={!!drill.feedback}
          {...timeProps}
        />
      </div>

      {drill.feedback && (
        <div className="flex flex-col items-center gap-3">
          {shouldShowRescueHint(drill) && (
            <p className="text-xs text-[var(--ivory-dim)] text-center max-w-sm">
              {t('onboarding.drill.rescueHint')}
            </p>
          )}
          <Button onClick={handleNext} className="min-w-32">
            {isFinal ? t('onboarding.drill.finish') : t('onboarding.drill.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
