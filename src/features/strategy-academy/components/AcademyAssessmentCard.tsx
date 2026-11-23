import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Compass, ShieldCheck } from 'lucide-react';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { FOCUS_RING } from '@/shared/components/ui/focusRing';
import { cn } from '@/shared/utils/cn';

export interface AcademyAssessmentCardProps {
  /** 评估区锚定的 Level；非标准变体或无可用 Level 时为 null（只保留定位测评） */
  level: number | null;
}

interface AssessmentEntry {
  to: string;
  label: string;
  icon: ReactNode;
}

/**
 * 实战地图评估区：检查点 / 认证 / 定位测评三个评估入口。
 * 只做导航，不发证、不解锁、不写状态；Level 不可用时降级为仅定位测评。
 */
export default function AcademyAssessmentCard({ level }: AcademyAssessmentCardProps) {
  const { t } = useTranslation();
  const label = t('nav.assessment');

  const entries: AssessmentEntry[] = [
    ...(level === null
      ? []
      : [
          {
            to: `/academy/checkpoint/${level}`,
            label: t('academy.checkpointHome.title'),
            icon: <ClipboardCheck className="h-4 w-4" />,
          },
          {
            to: `/academy/certification/${level}`,
            label: t('nav.academyCertification'),
            icon: <ShieldCheck className="h-4 w-4" />,
          },
        ]),
    {
      to: '/academy/placement',
      label: t('nav.academyPlacement'),
      icon: <Compass className="h-4 w-4" />,
    },
  ];

  return (
    <section aria-label={label}>
      <SectionLabel as="h2" className="mb-2.5 px-1">
        {label}
      </SectionLabel>
      <ul className="m-0 list-none space-y-2 p-0">
        {entries.map((entry) => (
          <li key={entry.to}>
            <Link
              to={entry.to}
              className={cn(
                'flex min-h-11 items-center gap-2 rounded-md border border-[var(--walnut-border)] px-3',
                'text-xs font-semibold text-[var(--ivory)] transition-colors',
                'hover:border-[var(--brass)]/40 hover:text-[var(--brass-bright)]',
                FOCUS_RING,
              )}
            >
              <span className="shrink-0 text-[var(--ivory-muted)]" aria-hidden="true">
                {entry.icon}
              </span>
              <span className="min-w-0 truncate">{entry.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}