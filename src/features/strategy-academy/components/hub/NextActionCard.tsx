import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import type { HubNextAction } from '../../utils/hubNextAction';

interface NextActionCardProps {
  action: HubNextAction;
}

export default function NextActionCard({ action }: NextActionCardProps) {
  const { t } = useTranslation();
  if (action.kind === 'blocked') return null;

  const reason = t(action.reasonKey, {
    count: action.dueCount ?? 0,
    stage: action.stageTitleKey ? t(action.stageTitleKey) : '',
    chapter: action.chapterId
      ? t(`theory.chapterTitle.${action.chapterId}`, { defaultValue: action.chapterId })
      : '',
  });
  const ctaKey =
    action.kind === 'basics'
      ? 'academy.courseHub.next.ctaBasics'
      : action.kind === 'done'
        ? 'academy.courseHub.next.ctaDone'
        : 'academy.courseHub.next.cta';

  return (
    <section
      className="panel relative overflow-hidden"
      aria-labelledby="course-hub-next-title"
      data-hub-kind={action.kind}
      data-hub-target={action.targetId ?? ''}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-[linear-gradient(180deg,var(--brass-bright),var(--brass-deep))]"
      />
      <div className="flex flex-wrap items-center justify-between gap-4 pl-2">
        <div className="min-w-0">
          <h2 id="course-hub-next-title" className="panel-title mb-1">
            {t('academy.courseHub.next.title')}
          </h2>
          <p className="m-0 text-sm leading-relaxed text-[var(--ivory-dim)]">{reason}</p>
        </div>
        <Button asChild data-hub-action="next">
          <Link to={action.route}>
            {t(ctaKey)}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </section>
  );
}