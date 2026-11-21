import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AcademyMasteryCard } from '@/shared/components/academy';
import type { MasterySummary } from '@/shared/types/academy';

export interface MasteryBlock {
  summary: MasterySummary;
  weakestId?: string;
  weakestTitle?: string;
}

interface CourseMasteryDualCardProps {
  strategy: MasteryBlock;
  theory?: MasteryBlock;
}

/** 课程枢纽双维掌握：概念掌握 × 实战掌握（首次成绩口径，只展示不门禁）。 */
export default function CourseMasteryDualCard({ strategy, theory }: CourseMasteryDualCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const labels = {
    mastered: t('academy.mastery.mastered'),
    passing: t('academy.mastery.passing'),
    needsReview: t('academy.mastery.needsReview'),
    untested: t('academy.mastery.untested'),
    total: t('academy.mastery.total'),
  };

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <AcademyMasteryCard
        title={t('academy.courseHub.mastery.practiceTitle')}
        subtitle={t('academy.courseHub.mastery.subtitle')}
        summary={strategy.summary}
        labels={labels}
        weakest={
          strategy.weakestId
            ? {
                label: strategy.weakestTitle ?? strategy.weakestId,
                route: `/lesson/${strategy.weakestId}`,
                ctaLabel: t('academy.mastery.weakestCta'),
                onNavigate: navigate,
              }
            : undefined
        }
      />
      {theory ? (
        <AcademyMasteryCard
          title={t('academy.courseHub.mastery.theoryTitle')}
          subtitle={t('academy.courseHub.mastery.subtitle')}
          summary={theory.summary}
          labels={labels}
          weakest={
            theory.weakestId
              ? {
                  label: theory.weakestTitle ?? theory.weakestId,
                  route: `/theory/chapter/${theory.weakestId}`,
                  ctaLabel: t('academy.mastery.weakestCta'),
                  onNavigate: navigate,
                }
              : undefined
          }
        />
      ) : null}
    </div>
  );
}