import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { useProgressStore } from '@/features/progress/store';
import type { OnboardingState } from '@/features/progress/types';

const GOAL_OPTIONS: Array<{ value: OnboardingState['dailyGoalMinutes']; minutes: number }> = [
  { value: 5, minutes: 5 },
  { value: 10, minutes: 10 },
  { value: 20, minutes: 20 },
];

export default function GoalSettingStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);
  const [selected, setSelected] = useState<OnboardingState['dailyGoalMinutes'] | null>(null);

  const handleConfirm = () => {
    if (selected === null) return;
    // 标记 onboarding 完成（step=5），并写入 dailyGoalMinutes 与 completedAt
    completeOnboardingStep(5, {
      dailyGoalMinutes: selected,
      completedAt: Date.now(),
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 max-w-2xl mx-auto">
      <div className="text-4xl mb-3">🎯</div>
      <h2 className="font-display text-2xl md:text-3xl text-[var(--ivory)] text-center mb-2">
        {t('onboarding.goal.title')}
      </h2>
      <p className="text-[var(--ivory-muted)] text-center mb-8 max-w-md">
        {t('onboarding.goal.subtitle')}
      </p>

      <div className="grid grid-cols-3 gap-3 w-full max-w-lg mb-8">
        {GOAL_OPTIONS.map((opt) => {
          const isSelected = selected === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setSelected(opt.value)}
              className={cn(
                'flex flex-col items-center justify-center p-5 rounded-lg border transition-all',
                isSelected
                  ? 'border-[var(--brass-bright)] bg-[var(--brass)]/15 ring-2 ring-[var(--brass)]/30'
                  : 'border-[var(--walnut-border)] bg-[var(--surface)] hover:border-[var(--brass)] hover:bg-[var(--walnut-light)]/40',
              )}
            >
              <Clock
                size={22}
                className={cn(
                  'mb-2',
                  isSelected ? 'text-[var(--brass-bright)]' : 'text-[var(--ivory-dim)]',
                )}
              />
              <span className="font-display text-2xl text-[var(--ivory)] font-numeric">
                {opt.minutes}
              </span>
              <span className="text-xs text-[var(--ivory-muted)] mt-0.5">
                {t('onboarding.goal.minutes')}
              </span>
            </button>
          );
        })}
      </div>

      <div className="text-xs text-[var(--ivory-dim)] mb-6 max-w-md text-center">
        {t('onboarding.goal.hint')}
      </div>

      <Button
        onClick={handleConfirm}
        disabled={selected === null}
        size="lg"
        className="min-w-40"
      >
        {t('onboarding.goal.confirm')}
      </Button>
    </div>
  );
}
