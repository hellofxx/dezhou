import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Info } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { APP_VERSION } from '@/shared/constants/app';
import { SettingsSection } from '../primitives';

export function AboutSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <SettingsSection
      id="about"
      icon={<Info className="h-4 w-4" />}
      title={t('settings.about', { defaultValue: '关于' })}
      summary={`v${APP_VERSION}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-[var(--ivory)]">
            {t('settings.aboutVersion', { defaultValue: '德州扑克训练平台 v{{version}}', version: APP_VERSION })}
          </div>
          <p className="mt-0.5 text-xs text-[var(--ivory-muted)]">
            {t('settings.aboutLocalFirst', {
              defaultValue: '纯本地训练工具：进度与牌局只保存在这台设备上。',
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/help')} className="gap-1">
          <HelpCircle className="h-4 w-4" aria-hidden="true" />
          {t('settings.helpCenter', { defaultValue: '帮助中心' })}
        </Button>
      </div>
    </SettingsSection>
  );
}