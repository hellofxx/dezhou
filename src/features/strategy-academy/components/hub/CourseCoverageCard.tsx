import { useTranslation } from 'react-i18next';
import { SectionLabel } from '@/shared/components/layout/SectionLabel';
import { StatPair } from '@/shared/components/data-display/StatPair';

export interface CourseCoverageCardProps {
  /** 已关联实战课程的理论章节数（去重） */
  mappedChapters: number;
  /** 仅有补充阅读、未关联实战的理论章节数（去重） */
  supplementalChapters: number;
  /** 带理论锚点的课时数 */
  anchoredLessons: number;
  /** 枢纽内课时总数（去重） */
  totalLessons: number;
  /** 当前变体无概念映射（短牌等）时只给占位说明 */
  unavailable: boolean;
}

/** 课程枢纽覆盖报告：理论章节与实战课时的双向映射概览（只展示，不门禁）。 */
export default function CourseCoverageCard({
  mappedChapters,
  supplementalChapters,
  anchoredLessons,
  totalLessons,
  unavailable,
}: CourseCoverageCardProps) {
  const { t } = useTranslation();

  return (
    <section className="panel" aria-labelledby="course-hub-coverage-title">
      <SectionLabel as="h2" id="course-hub-coverage-title" className="mb-2">
        {t('academy.courseCoverage.title')}
      </SectionLabel>
      {unavailable ? (
        <p className="m-0 text-xs leading-relaxed text-[var(--ivory-muted)]">
          {t('academy.courseCoverage.unavailable')}
        </p>
      ) : (
        <StatPair
          className="flex flex-wrap gap-x-5 gap-y-1.5"
          items={[
            { value: mappedChapters, label: t('academy.courseCoverage.mappedLabel') },
            { value: supplementalChapters, label: t('academy.courseCoverage.supplementalLabel') },
            {
              value: `${anchoredLessons}/${totalLessons}`,
              label: t('academy.courseCoverage.practiceLabel'),
            },
          ]}
        />
      )}
    </section>
  );
}
