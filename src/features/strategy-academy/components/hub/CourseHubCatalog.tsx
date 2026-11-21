import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, Route } from 'lucide-react';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

const ITEMS = [
  { to: '/academy', key: 'academy.courseHub.catalog.allCourses', icon: GraduationCap },
  { to: '/theory', key: 'academy.courseHub.catalog.theory', icon: BookOpen },
  { to: '/academy/tracks', key: 'academy.courseHub.catalog.tracks', icon: Route },
] as const;

export default function CourseHubCatalog() {
  const { t } = useTranslation();

  return (
    <section aria-labelledby="course-hub-catalog-title">
      <SectionLabel as="h2" id="course-hub-catalog-title" className="mb-2">
        {t('academy.courseHub.catalog.title')}
      </SectionLabel>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-md border border-[var(--walnut-border)] bg-[var(--walnut-raised)]/40 px-3 py-2 text-sm text-[var(--ivory-dim)] transition-colors hover:border-[var(--brass)]/40 hover:text-[var(--ivory)]',
                FOCUS_RING,
              )}
            >
              <Icon className="w-4 h-4 text-[var(--brass-text)]" aria-hidden="true" />
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </section>
  );
}