import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bug, Lock, Unlock } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useDebugModeStore } from '@/shared/stores/debugMode';
import { SettingsSection } from '../primitives';

export function DeveloperSection() {
  const { t } = useTranslation();
  const debugUnlockAll = useDebugModeStore((s) => s.unlockAll);
  const activateDebug = useDebugModeStore((s) => s.activateWithCode);
  const deactivateDebug = useDebugModeStore((s) => s.deactivate);

  const [debugCodeInput, setDebugCodeInput] = useState('');
  const [debugError, setDebugError] = useState(false);

  const handleDebugActivate = () => {
    const ok = activateDebug(debugCodeInput);
    setDebugError(!ok);
    if (ok) setDebugCodeInput('');
  };

  return (
    <SettingsSection
      id="developer"
      icon={<Bug className="h-4 w-4" />}
      title={t('settings.developer', { defaultValue: '开发者选项' })}
      hint={t('settings.developerHint', { defaultValue: '调试解锁全部功能' })}
      summary={debugUnlockAll ? t('settings.debugOn', { defaultValue: '已解锁' }) : undefined}
    >
      {debugUnlockAll ? (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-[var(--brass-glow)] px-3 py-2 text-sm text-[var(--brass-text)]">
            <Unlock className="h-4 w-4" aria-hidden="true" />
            {t('settings.debugUnlocked', { defaultValue: '调试解锁已开启 · 全部功能已解锁' })}
          </div>
          <Button variant="outline" size="sm" onClick={deactivateDebug} className="gap-1">
            <Lock className="h-4 w-4" aria-hidden="true" />
            {t('settings.closeDebugUnlock', { defaultValue: '关闭调试解锁' })}
          </Button>
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="text"
              inputMode="numeric"
              value={debugCodeInput}
              onChange={(event) => {
                setDebugCodeInput(event.target.value);
                if (debugError) setDebugError(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') handleDebugActivate();
              }}
              placeholder={t('settings.debugCodePlaceholder', { defaultValue: '输入调试码' })}
              aria-label={t('settings.debugCodePlaceholder', { defaultValue: '输入调试码' })}
              aria-invalid={debugError}
              aria-describedby={debugError ? 'settings-debug-error' : undefined}
              autoComplete="off"
              className="w-[140px]"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDebugActivate}
              disabled={!debugCodeInput.trim()}
              className="gap-1"
            >
              <Unlock className="h-4 w-4" aria-hidden="true" />
              {t('settings.activate', { defaultValue: '激活' })}
            </Button>
          </div>
          {debugError && (
            <p id="settings-debug-error" className="text-xs text-[var(--danger-text)]">
              {t('settings.debugCodeError', { defaultValue: '调试码不正确' })}
            </p>
          )}
        </>
      )}
    </SettingsSection>
  );
}