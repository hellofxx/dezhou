import { useTranslation } from 'react-i18next';
import type { LessonUnit } from '../types';
import { resolveUnitTitle } from '../utils/lessonUnits';
import { unitTitleKey } from '../utils/contentKeys';

interface SectionNavProps {
  units: LessonUnit[];
  activeId: string;
  completedIds: string[];
  onNavigate: (unitId: string) => void;
  /** 所属课程 id（传入时 unit 标题走 key 优先覆盖，fallback 数据原文） */
  lessonId?: string;
}

export function SectionNav({ units, activeId, completedIds, onNavigate, lessonId }: SectionNavProps) {
  const { t } = useTranslation();

  return (
    <div className="sticky top-0 z-20 w-full bg-[var(--walnut-raised)] border border-[var(--walnut-border)] rounded-lg p-2">
      {/* DEBT-3: WAI-ARIA 导航列表语义（ol > li），胶囊按钮为列表项内单一可点元素 */}
      <nav className="w-full" aria-label={t('academy.sectionNav.label')}>
        <ol className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin list-none m-0 p-0">
          {units.map((unit, i) => {
            const isActive = unit.id === activeId;
            const isCompleted = completedIds.includes(unit.id);
            const displayTitle = lessonId
              ? t(unitTitleKey(lessonId, unit.id), {
                  defaultValue: resolveUnitTitle(unit, (key) => t(key)),
                })
              : resolveUnitTitle(unit, (key) => t(key));

            let className = 'px-3 py-2.5 rounded-md text-xs transition-colors whitespace-nowrap ';
            if (isActive) {
              className += 'bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold';
            } else if (isCompleted) {
              className += 'text-[var(--poker-success)]';
            } else {
              className += 'text-[var(--ivory-muted)]';
            }

            return (
              <li key={unit.id} className="shrink-0">
                <button
                  onClick={() => onNavigate(unit.id)}
                  className={className}
                  aria-current={isActive ? 'true' : undefined}
                  aria-label={t('academy.sectionNav.goTo', { n: i + 1, title: displayTitle })}
                >
                  {isCompleted && <span className="mr-1">✓</span>}
                  <span className="sm:hidden">{i + 1}. {displayTitle.length > 6 ? displayTitle.slice(0, 6) + '…' : displayTitle}</span>
                  <span className="hidden sm:inline">{i + 1}. {displayTitle}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}