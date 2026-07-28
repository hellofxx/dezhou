import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/ui/button';
import { QuizCard } from '@/features/range-trainer/components/QuizCard';
import { Position } from '@/shared/types/position';
import type { RangeAction } from '@/shared/types/poker';
import type { QuizQuestion, QuestionFeedback } from '@/features/range-trainer/types';
import { useProgressStore } from '@/features/progress/store';

// 首次微训练题目（从简单到稍难，最后一题必须是最简单的"必对题"）
const DRILL_QUESTIONS: QuizQuestion[] = [
  { hand: 'AA', position: Position.BTN, correctAction: 'raise', context: 'BTN Open' },
  { hand: '72o', position: Position.UTG, correctAction: 'fold', context: 'UTG Open' },
  { hand: 'KK', position: Position.UTG, correctAction: 'raise', context: 'UTG Open' },
  // 最后一题：超级简单，确保用户以正确收尾
  { hand: 'AA', position: Position.CO, correctAction: 'raise', context: 'CO Open' },
];

// 补救题：如果用户最后一题答错，追加这道更简单的题
const RESCUE_QUESTION: QuizQuestion = {
  hand: 'AA',
  position: Position.BTN,
  correctAction: 'raise',
  context: 'BTN Open',
};

export default function FirstDrillStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);

  const [questions, setQuestions] = useState<QuizQuestion[]>(DRILL_QUESTIONS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [feedback, setFeedback] = useState<QuestionFeedback | null>(null);
  // 最后一题是否答错，决定是否追加补救题
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const currentQuestion = questions[currentIdx]!;
  const isLast = currentIdx === questions.length - 1;

  // QuizCard 不使用 timeRemaining / timeLimit，传 0 满足类型
  const timeProps = useMemo(() => ({ timeRemaining: 0, timeLimit: 0 }), []);

  const handleAnswer = (action: RangeAction) => {
    if (feedback) return;
    const isCorrect = action === currentQuestion.correctAction;
    setFeedback({
      isCorrect,
      correctAction: currentQuestion.correctAction,
      userAction: action,
    });

    if (isLast) {
      setLastAnswerCorrect(isCorrect);
      // 最后一题答错 → 追加一道补救题
      if (!isCorrect) {
        setQuestions((prev) => [...prev, RESCUE_QUESTION]);
      }
    }
  };

  const handleNext = () => {
    if (isLast && lastAnswerCorrect) {
      // 真正完成（最后一题答对，或补救题已答对）
      completeOnboardingStep(3);
      return;
    }
    if (isLast && !lastAnswerCorrect) {
      // 已追加补救题，继续到补救题
      setCurrentIdx((i) => i + 1);
      setFeedback(null);
      setLastAnswerCorrect(null);
      return;
    }
    // 普通下一题
    setCurrentIdx((i) => i + 1);
    setFeedback(null);
  };

  // 补救题答对后也完成
  const handleRescueNext = () => {
    completeOnboardingStep(3);
  };

  const isRescue = currentIdx >= DRILL_QUESTIONS.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-6 max-w-2xl mx-auto">
      <div className="text-xs text-[var(--brass)] font-numeric tracking-wider mb-1">
        {t('onboarding.drill.questionOf', { current: currentIdx + 1, total: questions.length })}
      </div>
      <h2 className="font-display text-xl text-[var(--ivory)] text-center mb-6">
        {t('onboarding.drill.title')}
      </h2>

      <div className="w-full flex justify-center mb-6">
        <QuizCard
          question={currentQuestion}
          onAnswer={handleAnswer}
          feedback={feedback}
          disabled={!!feedback}
          {...timeProps}
        />
      </div>

      {feedback && (
        <div className="flex flex-col items-center gap-3">
          {!feedback.isCorrect && isLast && !isRescue && (
            <p className="text-xs text-[var(--ivory-dim)] text-center max-w-sm">
              {t('onboarding.drill.rescueHint')}
            </p>
          )}
          <Button
            onClick={isRescue ? handleRescueNext : handleNext}
            className="min-w-32"
          >
            {isLast || isRescue
              ? t('onboarding.drill.finish')
              : t('onboarding.drill.next')}
          </Button>
        </div>
      )}
    </div>
  );
}
