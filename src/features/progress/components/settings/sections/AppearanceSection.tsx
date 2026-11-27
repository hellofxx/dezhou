import { useTranslation } from 'react-i18next';
import { Languages, Monitor, Moon, Palette, Sun } from 'lucide-react';
import { useProgressStore } from '../../../store';
import { switchLanguage } from '@/i18n/preload';
import { SegmentedControl, SettingRow, SettingsSection } from '../primitives';
import type { SegmentOption } from '../primitives';
import type { UserSettings } from '../../../types';

type Theme = UserSettings['theme'];
type Language = UserSettings['language'];

export function AppearanceSection() {
  const { t } = useTranslation();
  const settings = useProgressStore((s) => s.settings);
  const updateSettings = useProgressStore((s) => s.updateSettings);

  const themeLabels: Record<Theme, string> = {
    dark: t('settings.themeDark', { defaultValue: '暗色' }),
    light: t('settings.themeLight', { defaultValue: '亮色' }),
    system: t('settings.themeSystem', { defaultValue: '跟随系统' }),
  };
  const themeOptions: SegmentOption<Theme>[] = [
    { value: 'dark', label: <><Moon className="h-3.5 w-3.5" aria-hidden="true" />{themeLabels.dark}</> },
    { value: 'light', label: <><Sun className="h-3.5 w-3.5" aria-hidden="true" />{themeLabels.light}</> },
    { value: 'system', label: <><Monitor className="h-3.5 w-3.5" aria-hidden="true" />{themeLabels.system}</> },
  ];
  const languageOptions: SegmentOption<Language>[] = [
    { value: 'zh', label: t('settings.languageZh', { defaultValue: '中文' }) },
    { value: 'en', label: t('settings.languageEn', { defaultValue: 'English' }) },
  ];
  const languageLabels: Record<Language, string> = {
    zh: t('settings.languageZh', { defaultValue: '中文' }),
    en: t('settings.languageEn', { defaultValue: 'English' }),
  };

  const languageName = languageLabels[settings.language];

  return (
    <SettingsSection
      id="appearance"
      defaultOpen
      icon={<Palette className="h-4 w-4" />}
      title={t('settings.appearance', { defaultValue: '外观' })}
      hint={t('settings.appearanceHint', { defaultValue: '主题与界面语言' })}
      summary={`${themeLabels[settings.theme]} · ${languageName}`}
    >
      <SettingRow
        label={t('settings.themeLabel', { defaultValue: '主题' })}
        description={t('settings.themeHint', { defaultValue: '选择应用的主题模式' })}
      >
        <SegmentedControl
          value={settings.theme}
          options={themeOptions}
          onChange={(theme) => updateSettings({ theme })}
          ariaLabel={t('settings.themeLabel', { defaultValue: '主题' })}
        />
      </SettingRow>

      <SettingRow
        label={t('settings.languageLabel', { defaultValue: '语言' })}
        description={t('settings.languageHint', { defaultValue: '界面语言，切换后立即生效' })}
        icon={<Languages className="h-4 w-4" />}
      >
        <SegmentedControl
          value={settings.language}
          options={languageOptions}
          onChange={(language) => {
            // 语言偏好事实源：progress store settings.language（persist），同步切换 i18n 实例
            updateSettings({ language });
            // 预加载目标语言资源后再切换，避免"先 fallback 后跳变"闪烁
            void switchLanguage(language);
          }}
          ariaLabel={t('settings.languageLabel', { defaultValue: '语言' })}
        />
      </SettingRow>
    </SettingsSection>
  );
}