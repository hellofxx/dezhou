import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AcademyMasteryCard } from '@/shared/components/academy';
import { summarizeMastery } from '@/shared/utils/academyMastery';
import { useAcademyStore } from '../store';
import { findLessonSummaryById, getVariantLessonSummaries } from '../utils/academyMeta';
import { resolveLessonTitle } from '../utils/titleKeys';

/** 策略课时掌握度卡：首次成绩口径（无记录回退 quizScores 历史最高分）。 */
export function StrategyMasteryCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const activeVariant = useAcademyStore((s) => s.activeVariant);
  const progress = useAcademyStore((s) => s.progress);
  const lessonAttempts = useAcademyStore((s) => s.lessonAttempts);

  const lessons = getVariantLessonSummaries(activeVariant).filter(
    (lesson) => lesson.type !== 'drill',
  );
  const scores: Record<string, number | undefined> = {};
  for (const lesson of lessons) {
    scores[lesson.id] = lessonAttempts[lesson.id]?.firstScore ?? progress.quizScores[lesson.id];
  }
  const summary = summarizeMastery(lessons, scores);
  const weakest = summary.weakestId ? findLessonSummaryById(summary.weakestId) : undefined;

  return (
    <AcademyMasteryCard
      title={t('academy.mastery.title')}
      subtitle={t('academy.mastery.subtitle')}
      summary={summary}
      labels={{
        mastered: t('academy.mastery.mastered'),
        passing: t('academy.mastery.passing'),
        needsReview: t('academy.mastery.needsReview'),
        untested: t('academy.mastery.untested'),
        total: t('academy.mastery.total'),
      }}
      weakest={
        weakest
          ? {
              label: resolveLessonTitle(t, weakest),
              route: `/academy/lesson/${weakest.id}`,
              ctaLabel: t('academy.mastery.weakestCta'),
              onNavigate: (route) => navigate(route),
            }
          : undefined
      }
    />
  );
}
