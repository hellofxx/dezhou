import { useTranslation } from 'react-i18next';
import { Clock, Hash, ShieldAlert, SlidersHorizontal, Volume2, VolumeX } from 'lucide-react';
import { useProgressStore } from '../../../store';
import { SegmentedControl, SettingRow, SettingsSection, SwitchToggle } from '../primitives';
import type { SegmentOption } from '../primitives';

const QUIZ_TIME_OPTIONS = ['10', '15', '30', '0'] as const;
const QUESTION_COUNT_OPTIONS = ['10', '20', '30', '50'] as const;
const DAILY_LIMIT_OPTIONS = ['0', '50', '100', '200'] as const;

export function TrainingSection() {
  const { t } = useTranslation();
  const settings = useProgressStore((s) => s.settings);
  const updateSettings = useProgressStore((s) => s.updateSettings);
  const dailyQuestionLimit = useProgressStore((s) => s.emotion.dailyQuestionLimit);
  const setDailyQuestionLimit = useProgressStore((s) => s.setDailyQuestionLimit);

  const secondUnit = t('settings.unitSecond', { defaultValue: '秒' });
  const questionUnit = t('settings.unitQuestion', { defaultValue: '题' });
  const unlimitedTime = t('settings.unlimited', { defaultValue: '无限时' });

  // 导入的数值可能不在预设档位（白名单允许 1..500）：保留当前值作为一个可见选项，避免控件"无选中"
  const withCurrent = (presets: readonly string[], current: number): string[] => {
    const values = presets.map(String);
    if (!values.includes(String(current))) values.push(String(current));
    return values;
  };

  const timeOptions: SegmentOption<string>[] = withCurrent(QUIZ_TIME_OPTIONS, settings.defaultQuizTime).map((value) => ({
    value,
    label: value === '0' ? '∞' : value,
    ariaLabel: value === '0' ? unlimitedTime : `${value} ${secondUnit}`,
  }));
  const countOptions: SegmentOption<string>[] = withCurrent(QUESTION_COUNT_OPTIONS, settings.defaultQuestionCount).map((value) => ({
    value,
    label: value,
    ariaLabel: `${value} ${questionUnit}`,
  }));
  const limitOptions: SegmentOption<string>[] = withCurrent(DAILY_LIMIT_OPTIONS, dailyQuestionLimit).map((value) => ({
    value,
    label: value === '0' ? '∞' : value,
    ariaLabel: value === '0'
      ? t('sessionLimit.unlimited', { defaultValue: '无限' })
      : `${value} ${questionUnit}`,
  }));

  const timeSummary = settings.defaultQuizTime === 0
    ? unlimitedTime
    : `${settings.defaultQuizTime} ${secondUnit}`;
  const limitSummary = dailyQuestionLimit === 0 ? '' : ` · ≤${dailyQuestionLimit}`;

  return (
    <SettingsSection
      id="training"
      icon={<SlidersHorizontal className="h-4 w-4" />}
      title={t('settings.training', { defaultValue: '训练偏好' })}
      hint={t('settings.trainingHint', { defaultValue: '音效、计时与题量' })}
      summary={`${timeSummary} · ${settings.defaultQuestionCount} ${questionUnit}${limitSummary}`}
    >
      <SettingRow
        label={t('settings.soundLabel', { defaultValue: '音效' })}
        description={t('settings.soundHint', { defaultValue: '训练时播放音效' })}
        icon={settings.soundEnabled ? (
          <Volume2 className="h-4 w-4 text-[var(--success)]" />
        ) : (
          <VolumeX className="h-4 w-4" />
        )}
      >
        <SwitchToggle
          checked={settings.soundEnabled}
          onChange={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          label={t('settings.soundSwitch', { defaultValue: '音效开关' })}
        />
      </SettingRow>

      <SettingRow
        label={t('settings.quizTimeLabel', { defaultValue: '默认测验时间' })}
        description={t('settings.quizTimeHint', { defaultValue: '每题的默认限时' })}
        icon={<Clock className="h-4 w-4" />}
      >
        <SegmentedControl
          value={String(settings.defaultQuizTime)}
          options={timeOptions}
          onChange={(value) => updateSettings({ defaultQuizTime: Number(value) })}
          ariaLabel={t('settings.quizTimeLabel', { defaultValue: '默认测验时间' })}
        />
      </SettingRow>

      <SettingRow
        label={t('settings.questionCountLabel', { defaultValue: '默认题目数量' })}
        description={t('settings.questionCountHint', { defaultValue: '每次测验的默认题数' })}
        icon={<Hash className="h-4 w-4" />}
      >
        <SegmentedControl
          value={String(settings.defaultQuestionCount)}
          options={countOptions}
          onChange={(value) => updateSettings({ defaultQuestionCount: Number(value) })}
          ariaLabel={t('settings.questionCountLabel', { defaultValue: '默认题目数量' })}
        />
      </SettingRow>

      <SettingRow
        label={t('sessionLimit.settingLabel', { defaultValue: '每日题量上限' })}
        description={t('sessionLimit.settingHint', { defaultValue: '达到上限后将禁止继续训练，0 = 无限' })}
        icon={<ShieldAlert className="h-4 w-4" />}
      >
        <SegmentedControl
          value={String(dailyQuestionLimit)}
          options={limitOptions}
          onChange={(value) => setDailyQuestionLimit(Number(value))}
          ariaLabel={t('sessionLimit.settingLabel', { defaultValue: '每日题量上限' })}
        />
      </SettingRow>
    </SettingsSection>
  );
}