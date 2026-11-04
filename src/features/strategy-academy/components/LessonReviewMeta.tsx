import { useTranslation } from 'react-i18next';
import { CalendarCheck } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { getLessonContentMeta } from '../data/contentOps';
import { StrategyContentIssueReport } from './StrategyContentIssueReport';

export interface LessonReviewMetaProps {
  lessonId: string;
  /** 可选：正文段落下标，带入纠错报告便于定位（不影响展示） */
  sectionIndex?: number;
  className?: string;
}

/**
 * 课时「最近校对 + 内容纠错」脚注（只读）。
 *
 * 数据来自 `data/contentOps.ts`；未登记校对的课时直接不渲染（不占位、不显示空态）。
 * 不读写 store、不参与门禁 / 解锁 / 计分，也不上报任何遥测。
 */
export function LessonReviewMeta({ lessonId, sectionIndex, className }: LessonReviewMetaProps) {
  const { t } = useTranslation();
  const meta = getLessonContentMeta(lessonId);
  if (!meta) return null;

  return (
    <div
      data-testid="lesson-review-meta"
      className={cn(
        'flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--ivory-muted)]',
        className,
      )}
    >
      <span className="inline-flex items-center gap-1.5">
        <CalendarCheck className="h-3.5 w-3.5 text-[var(--brass-text)]" aria-hidden="true" />
        {t('academy.contentMeta.lastReviewed', { date: meta.lastReviewed })}
      </span>
      <StrategyContentIssueReport lessonId={lessonId} sectionIndex={sectionIndex} />
    </div>
  );
}
