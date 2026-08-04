import { useTranslation } from 'react-i18next';
import { Clock, MapPin } from 'lucide-react';
import type { LessonUnit } from '../types';

interface LessonIntroCardProps {
  units: LessonUnit[];
  duration: string;
}

export function LessonIntroCard({ units, duration }: LessonIntroCardProps) {
  const { t } = useTranslation();

  const totalSections = units.length;

  return (
    <div className="rounded-lg border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/50 p-4 space-y-3">
      <h3 className="font-display text-[15px] text-[var(--ivory)] flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[var(--brass-bright)]" />
        {t('academy.lessonUnit.introTitle')}
      </h3>
      <div className="flex flex-wrap gap-3 text-xs text-[var(--ivory-muted)]">
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          {t('academy.lessonUnit.introDuration', { duration })}
        </span>
        <span className="flex items-center gap-1">
          {t('academy.lessonUnit.sectionCount', { count: totalSections })}
        </span>
      </div>
      <div className="flex gap-1.5">
        {units.map((unit, i) => (
          <span
            key={unit.id}
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-semibold bg-[var(--walnut-border)] text-[var(--ivory-muted)]"
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}