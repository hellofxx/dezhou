import { useTranslation } from 'react-i18next';
import { Flame } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '@/features/progress/store';

// 首胜庆祝动画 — 纯 CSS，不引入 framer-motion。
// P2A-02：Day 1 Streak 的 recordTrainingDay 已移至 FirstDrillStep 完成动作
// （首胜达成时刻记一次）；本页只做展示——跨日卡在庆祝页重新挂载不会重复记训练日。
export default function CelebrationStep() {
  const { t } = useTranslation();
  const completeOnboardingStep = useProgressStore((s) => s.completeOnboardingStep);

  const handleContinue = () => completeOnboardingStep(4);

  return (
    <div className="relative flex flex-col items-center justify-center min-h-full px-6 py-10 max-w-2xl mx-auto overflow-hidden">
      {/* 背景光晕（pulse 动画） */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[var(--brass)]/20 blur-3xl animate-pulse pointer-events-none"
        aria-hidden
      />

      {/* 撒花粒子（CSS keyframe 动画，keyframes 定义于 globals.css） */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className="absolute text-2xl"
            style={{
              left: `${(i * 8 + 5) % 100}%`,
              top: '-10%',
              animation: `onboarding-fall ${2 + (i % 3) * 0.4}s linear ${i * 0.15}s infinite`,
            }}
          >
            {['🎉', '✨', '⭐', '🎊'][i % 4]}
          </span>
        ))}
      </div>

      {/* 主体内容 */}
      <div
        className="relative z-10 flex flex-col items-center text-center"
        style={{ animation: 'onboarding-pop 0.6s ease-out' }}
      >
        <div className="text-6xl mb-4 animate-bounce">🏆</div>

        <h2 className="font-display text-3xl md:text-4xl text-[var(--ivory)] mb-3">
          {t('onboarding.celebration.title')}
        </h2>
        <p className="text-[var(--ivory-muted)] mb-6 max-w-md">
          {t('onboarding.celebration.subtitle')}
        </p>

        {/* Day 1 Streak 徽章 */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--clay)]/15 border border-[var(--clay)]/40 mb-8">
          <Flame size={18} className="text-[var(--clay)] animate-pulse" />
          <span className="text-sm text-[var(--ivory)] font-medium">
            {t('onboarding.celebration.streakStarted')}
          </span>
        </div>

        <Button onClick={handleContinue} size="lg" className="min-w-40">
          {t('onboarding.celebration.continue')}
        </Button>
      </div>
    </div>
  );
}
