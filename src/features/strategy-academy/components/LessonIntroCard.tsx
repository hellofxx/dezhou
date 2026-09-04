import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Target } from 'lucide-react';
import type { LessonUnit } from '../types';
import { resolveLessonObjectives } from '../utils/contentKeys';

interface LessonIntroCardProps {
  lessonId: string;
  units: LessonUnit[];
  duration: string;
  /** 学习目标（先行组织者）；未声明或为空时整块不渲染 */
  objectives?: string[];
}

export function LessonIntroCard({
  lessonId,
  units,
  duration,
  objectives,
}: LessonIntroCardProps) {
  const { t } = useTranslation();

  const totalSections = units.length;
  const hasObjectives = objectives !== undefined && objectives.length > 0;

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
      {hasObjectives ? (
        <div data-testid="lesson-objectives">
          <h4 className="text-xs font-semibold text-[var(--brass-bright)] flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            {t('academy.lessonUnit.objectivesTitle')}
          </h4>
          <ul className="space-y-1">
            {resolveLessonObjectives(t, lessonId, objectives).map((obj, i) => (
              <li
                key={i}
                className="text-xs text-[var(--ivory-dim)] leading-relaxed flex items-start gap-2"
              >
                <span className="text-[var(--brass-bright)]/70 mt-0.5 shrink-0">•</span>
                {obj}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
