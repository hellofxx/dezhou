import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import { useProgressStore } from '@/features/progress/store';
import WelcomeStep from './WelcomeStep';
import PlacementTestStep from './PlacementTestStep';
import FirstDrillStep from './FirstDrillStep';
import CelebrationStep from './CelebrationStep';
import GoalSettingStep from './GoalSettingStep';

// 步骤索引 → i18n key
const STEP_LABEL_KEYS = [
  'onboarding.steps.welcome',
  'onboarding.steps.placement',
  'onboarding.steps.drill',
  'onboarding.steps.celebration',
  'onboarding.steps.goal',
] as const;

export default function OnboardingFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const currentStep = useProgressStore((s) => s.onboarding.currentStep);
  // 当前步骤的 i18n key（currentStep 在 0-4 范围内必然存在）
  const currentLabelKey = STEP_LABEL_KEYS[currentStep];

  // 完成全部步骤（currentStep >= 5）后跳回首页
  useEffect(() => {
    if (currentStep >= 5) {
      navigate('/', { replace: true });
    }
  }, [currentStep, navigate]);

  return (
    <div className="flex flex-col h-full min-h-screen bg-[var(--background)]">
      {/* 步骤指示器 */}
      <div className="flex items-center justify-center gap-1 px-4 py-5 max-w-2xl mx-auto w-full">
        {STEP_LABEL_KEYS.map((labelKey, i) => (
          <div
            key={labelKey}
            className={cn('flex items-center', i < STEP_LABEL_KEYS.length - 1 && 'flex-1')}
          >
            <div
              className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0 transition-colors',
                i < currentStep && 'bg-[var(--brass)] text-[var(--primary-foreground)]',
                i === currentStep && 'bg-[var(--brass-bright)] text-[var(--primary-foreground)] ring-2 ring-[var(--brass)]/40',
                i > currentStep && 'bg-[var(--walnut-light)] text-[var(--ivory-dim)]'
              )}
            >
              {i < currentStep ? '✓' : i + 1}
            </div>
            {i < STEP_LABEL_KEYS.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-1 transition-colors',
                  i < currentStep ? 'bg-[var(--brass)]' : 'bg-[var(--walnut-light)]'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* 步骤内容 */}
      <div className="flex-1 overflow-auto">
        {currentStep === 0 && <WelcomeStep />}
        {currentStep === 1 && <PlacementTestStep />}
        {currentStep === 2 && <FirstDrillStep />}
        {currentStep === 3 && <CelebrationStep />}
        {currentStep === 4 && <GoalSettingStep />}
        {/* OB-04：currentStep >= 5（已完成）在 effect 跳转前的过渡帧渲染完成占位，避免空白闪烁 */}
        {currentStep >= 5 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-4">
            <div className="w-10 h-10 rounded-full bg-[var(--brass)]/20 flex items-center justify-center">
              <span className="text-[var(--brass-bright)] text-xl">✓</span>
            </div>
            <div className="text-sm font-display text-[var(--ivory)]">{t('onboarding.complete.title')}</div>
            <div className="text-xs text-[var(--ivory-dim)]">{t('onboarding.complete.redirecting')}</div>
          </div>
        )}
      </div>

      {/* 底部圆点进度指示器 + 步骤标题 */}
      <div className="px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-[6px] mb-1.5">
          {STEP_LABEL_KEYS.map((labelKey, i) => (
            <div
              key={labelKey}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                i < currentStep && 'bg-[var(--brass-bright)]',
                i === currentStep && 'bg-[var(--brass)] ring-2 ring-[var(--brass)]/40',
                i > currentStep && 'border-2 border-[var(--walnut-light)] bg-transparent'
              )}
            />
          ))}
        </div>
        <div className="text-xs text-[var(--ivory-dim)]">
          {currentLabelKey && t(currentLabelKey)}
        </div>
      </div>
    </div>
  );
}
