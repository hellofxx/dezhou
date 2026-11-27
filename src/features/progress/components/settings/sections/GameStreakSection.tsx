import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import { Gamepad2, Snowflake } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/utils/cn';
import { MOTION_DURATION } from '@/shared/utils/motion';
import { useProgressStore } from '../../../store';
import { getTodayString } from '../../../utils/streakCalc';
import { GameVariantSelector } from '../GameVariantSelector';
import { SettingRow, SettingsSection } from '../primitives';

const VARIANT_NAME_DEFAULTS = {
  standard: '标准德州',
  'short-deck': '短牌德州',
  'heads-up': '单挑',
} as const;

export function GameStreakSection() {
  const { t } = useTranslation();
  const currentGameVariant = useProgressStore((s) => s.currentGameVariant);
  const setGameVariant = useProgressStore((s) => s.setGameVariant);
  const streakFreezes = useProgressStore((s) => s.streak.streakFreezes);
  const streakFreezeUsedToday = useProgressStore((s) => s.streak.streakFreezeUsedToday);
  const lastTrainingDate = useProgressStore((s) => s.streak.lastTrainingDate);
  const useStreakFreeze = useProgressStore((s) => s.useStreakFreeze);

  const [freezeStatus, setFreezeStatus] = useState<'success' | 'fail' | null>(null);
  // 状态自动复位定时器：组件卸载时统一清理，避免卸载后 setState 告警
  const statusTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = statusTimersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  const trainedToday = lastTrainingDate === getTodayString();
  const freezeDisabled = streakFreezes <= 0 || streakFreezeUsedToday || trainedToday;

  const handleUseFreeze = () => {
    const ok = useStreakFreeze();
    setFreezeStatus(ok ? 'success' : 'fail');
    statusTimersRef.current.push(setTimeout(() => setFreezeStatus(null), 3000));
  };

  const variantName = t(`variant.name.${currentGameVariant}`, {
    defaultValue: VARIANT_NAME_DEFAULTS[currentGameVariant],
  });

  return (
    <SettingsSection
      id="game-streak"
      icon={<Gamepad2 className="h-4 w-4" />}
      title={t('variant.title', { defaultValue: '游戏变体' })}
      hint={t('variant.switchHint')}
      summary={`${variantName} · ${t('streak.freeze.settingLabel', { defaultValue: '冻结卡' })} ×${streakFreezes}`}
    >
      <GameVariantSelector currentVariant={currentGameVariant} onChange={setGameVariant} />
      <div className="hairline-brass" />
      <SettingRow
        label={t('streak.freeze.settingLabel', { defaultValue: '冻结卡' })}
        description={t('streak.freeze.settingHint', {
          defaultValue: '今天没空训练？用 1 张冻结卡为今天请假，保住连续训练（每日限 1 张），当前剩余 {{count}} 张',
          count: streakFreezes,
        })}
        icon={<Snowflake className="h-4 w-4 text-[var(--info)]" />}
      >
        <AnimatePresence>
          {freezeStatus && (
            <motion.span
              key={freezeStatus}
              role="status"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: MOTION_DURATION.fast }}
              className={cn(
                'max-w-[180px] text-right text-xs',
                freezeStatus === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger-text)]',
              )}
            >
              {freezeStatus === 'success'
                ? t('streak.freeze.useSuccess', { defaultValue: '已使用 1 张，今日连续性已保护 ✓' })
                : t('streak.freeze.useFail', { defaultValue: '不可用（今日已训/已用、无卡或无可保护连续）' })}
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          variant="outline"
          size="sm"
          onClick={handleUseFreeze}
          disabled={freezeDisabled}
          className="gap-1"
        >
          <Snowflake className="h-4 w-4" aria-hidden="true" />
          {t('streak.freeze.useNow', { defaultValue: '使用冻结卡' })}
        </Button>
      </SettingRow>
    </SettingsSection>
  );
}