import { useTranslation } from 'react-i18next';
import { Sparkles, GraduationCap, SkipForward } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '@/features/progress/store';

export default function WelcomeStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);
  const skipOnboarding = useProgressStore((s) => s.skipOnboarding);

  // 新手 → 进入定位测试（步骤 1）
  const handleBeginner = () => completeOnboardingStep(1);

  // 有基础 → 跳过定位测试，直接进入首次微训练（步骤 2）
  const handleExperienced = () => completeOnboardingStep(2);

  return (
    <div className="flex flex-col items-center justify-center min-h-full px-6 py-10 max-w-3xl mx-auto">
      <div className="text-5xl mb-4">♠️</div>
      <h1 className="font-display text-3xl md:text-4xl text-[var(--ivory)] text-center mb-3">
        {t('onboarding.welcome.valueProp')}
      </h1>
      <p className="font-display text-lg text-[var(--brass-bright)] text-center mb-2">
        {t('onboarding.welcome.title')}
      </p>
      <p className="text-[var(--ivory-muted)] text-center mb-10 max-w-md">
        {t('onboarding.welcome.subtitle')}
      </p>

      <div className="grid md:grid-cols-2 gap-4 w-full">
        {/* 新手 */}
        <button
          onClick={handleBeginner}
          className="group flex flex-col items-start p-6 rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] hover:border-[var(--brass)] hover:bg-[var(--walnut-light)]/40 transition-all text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap size={24} className="text-[var(--brass-bright)]" />
            <span className="font-display text-xl text-[var(--ivory)]">
              {t('onboarding.welcome.beginnerTitle')}
            </span>
          </div>
          <p className="text-sm text-[var(--ivory-muted)] mb-4">
            {t('onboarding.welcome.beginnerDesc')}
          </p>
          <span className="text-xs text-[var(--brass)] group-hover:translate-x-1 transition-transform">
            {t('onboarding.welcome.beginnerCta')} →
          </span>
        </button>

        {/* 有基础 */}
        <button
          onClick={handleExperienced}
          className="group flex flex-col items-start p-6 rounded-lg border border-[var(--walnut-border)] bg-[var(--surface)] hover:border-[var(--brass)] hover:bg-[var(--walnut-light)]/40 transition-all text-left"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={24} className="text-[var(--brass-bright)]" />
            <span className="font-display text-xl text-[var(--ivory)]">
              {t('onboarding.welcome.experiencedTitle')}
            </span>
          </div>
          <p className="text-sm text-[var(--ivory-muted)] mb-4">
            {t('onboarding.welcome.experiencedDesc')}
          </p>
          <span className="text-xs text-[var(--brass)] group-hover:translate-x-1 transition-transform">
            {t('onboarding.welcome.experiencedCta')} →
          </span>
        </button>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={skipOnboarding}
        className="mt-8 text-[var(--ivory-dim)] hover:text-[var(--ivory-muted)]"
      >
        <SkipForward size={14} className="mr-1" />
        {t('onboarding.welcome.skip')}
      </Button>
    </div>
  );
}
