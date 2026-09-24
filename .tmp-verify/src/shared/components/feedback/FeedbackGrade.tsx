import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/utils/cn';
import type { DecisionGrade } from '@/shared/types/decisionFeedback';

export interface FeedbackGradeProps {
  grade: DecisionGrade;
  /** EV 损失（BB/100） */
  evLoss?: number;
  description?: string;
  className?: string;
}

const GRADE_EMOJI: Record<DecisionGrade, string> = {
  best: '✓',
  correct: '✓',
  inaccuracy: '~',
  wrong: '✗',
  blunder: '✗✗',
};

const GRADE_FALLBACK: Record<DecisionGrade, string> = {
  best: 'Best',
  correct: 'Correct',
  inaccuracy: 'Inaccuracy',
  wrong: 'Wrong',
  blunder: 'Blunder',
};

/**
 * FeedbackGrade — 五级决策反馈展示组件。
 */
export default function FeedbackGrade({ grade, evLoss, description, className }: FeedbackGradeProps) {
  const { t } = useTranslation();
  const label = t(`feedback.grade.${grade}`, { defaultValue: GRADE_FALLBACK[grade] });

  return (
    <div className={cn('feedback-grade', `grade-${grade}`, className)} role="status">
      <span className="grade-emoji" aria-hidden="true">{GRADE_EMOJI[grade]}</span>
      <span className="grade-label">{label}</span>
      {evLoss != null && (
        <span className="grade-ev font-numeric">
          EV {evLoss > 0 ? '-' : ''}{evLoss.toFixed(1)} BB
        </span>
      )}
      {description && <span className="grade-desc">{description}</span>}
    </div>
  );
}
