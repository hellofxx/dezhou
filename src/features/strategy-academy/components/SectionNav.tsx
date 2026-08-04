import { useTranslation } from 'react-i18next';
import type { LessonUnit } from '../types';

interface SectionNavProps {
  units: LessonUnit[];
  activeId: string;
  completedIds: string[];
  onNavigate: (unitId: string) => void;
}

export function SectionNav({ units, activeId, completedIds, onNavigate }: SectionNavProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 w-full bg-[var(--walnut-raised)] border border-[var(--walnut-border)] rounded-lg p-2">
      <nav className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin" aria-label={t('academy.sectionNav.label')}>
        {units.map((unit, i) => {
          const isActive = unit.id === activeId;
          const isCompleted = completedIds.includes(unit.id);

          let className = 'shrink-0 px-3 py-1.5 rounded-md text-xs transition-colors whitespace-nowrap ';
          if (isActive) {
            className += 'bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold';
          } else if (isCompleted) {
            className += 'text-[var(--poker-success)]';
          } else {
            className += 'text-[var(--ivory-muted)]';
          }

          return (
            <button
              key={unit.id}
              onClick={() => onNavigate(unit.id)}
              className={className}
              aria-current={isActive ? 'true' : undefined}
            >
              {isCompleted && <span className="mr-1">✓</span>}
              <span className="sm:hidden">{i + 1}. {unit.title.length > 6 ? unit.title.slice(0, 6) + '…' : unit.title}</span>
              <span className="hidden sm:inline">{i + 1}. {unit.title}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}