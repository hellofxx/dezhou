import { useTranslation } from 'react-i18next';
import { GraduationCap } from 'lucide-react';
import { useProgressStore } from '../../../store';
import { MENTOR_PROFILES } from '@/shared/types/mentor';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';
import { SettingsSection } from '../primitives';
import MentorIcon from '../mentorIcons';

export function CoachSection() {
  const { t } = useTranslation();
  const mentorStyle = useProgressStore((s) => s.mentorStyle);
  const setMentorStyle = useProgressStore((s) => s.setMentorStyle);

  const current = MENTOR_PROFILES.find((profile) => profile.id === mentorStyle);
  const summary = current
    ? t(`mentor.profiles.${current.id}.name`, { defaultValue: current.name })
    : undefined;

  return (
    <SettingsSection
      id="coach"
      icon={<GraduationCap className="h-4 w-4" />}
      title={t('mentor.settings.title')}
      hint={t('mentor.settings.hint')}
      summary={summary}
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MENTOR_PROFILES.map((profile) => {
          const selected = profile.id === mentorStyle;
          return (
            <button
              key={profile.id}
              type="button"
              onClick={() => setMentorStyle(profile.id)}
              aria-pressed={selected}
              className={cn(
                'flex items-start gap-3 rounded-md border p-3 text-left transition-all sm:flex-col sm:items-center sm:text-center',
                'min-h-[44px]',
                selected
                  ? 'border-[var(--brass)] bg-[var(--brass-glow)] ring-1 ring-[var(--brass)]/40'
                  : 'border-[var(--walnut-border)] bg-[var(--background)] hover:border-[var(--brass)]/50',
                FOCUS_RING,
              )}
            >
              <span className="mt-0.5 inline-flex leading-none sm:mt-0">
                <MentorIcon iconId={profile.iconId} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 sm:justify-center">
                  <span className="font-display text-sm font-semibold text-[var(--ivory)]">
                    {t(`mentor.profiles.${profile.id}.name`, { defaultValue: profile.name })}
                  </span>
                  {selected && (
                    <span className="font-numeric text-[11px] uppercase tracking-wider text-[var(--brass-text)]">
                      {t('mentor.settings.selected')}
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-[var(--ivory-muted)]">
                  {t(`mentor.profiles.${profile.id}.description`, { defaultValue: profile.description })}
                </div>
                <div className="mt-1 text-[11px] text-[var(--ivory-dim)]">
                  {t('mentor.settings.voiceToneLabel')}:{' '}
                  {t(`mentor.profiles.${profile.id}.voiceTone`, { defaultValue: profile.voiceTone })}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </SettingsSection>
  );
}