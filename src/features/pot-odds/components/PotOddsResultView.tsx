import { useTranslation } from 'react-i18next';
import { Calculator, Clock, RotateCcw, Target } from 'lucide-react';
import { ResultSlip } from '@/shared/components/feedback/ResultSlip';

interface PotOddsResultViewProps {
  accuracy: number;
  avgTime: string;
  correctCount: number;
  totalQuestions: number;
  lastQuestionCorrect: boolean;
  onRestart: () => void;
  onBack: () => void;
}

/**
 * 赔率测验结算纸条（feature-local）。
 *
 * 纸张、指标、评语与动作统一走 shared `ResultSlip`；关闭（X / Escape / 遮罩）
 * 与"返回计算器"同出口，回到赔率站。
 */
export function PotOddsResultView({
  accuracy,
  avgTime,
  correctCount,
  totalQuestions,
  lastQuestionCorrect,
  onRestart,
  onBack,
}: PotOddsResultViewProps) {
  const { t } = useTranslation();
  const grade =
    accuracy >= 90
      ? t('potOdds.quiz.gradeExcellent')
      : accuracy >= 70
        ? t('potOdds.quiz.gradeGood')
        : accuracy >= 50
          ? t('potOdds.quiz.gradeFair')
          : t('potOdds.quiz.gradePoor');

  return (
    <ResultSlip
      open
      onClose={onBack}
      title={t('potOdds.quiz.doneTitle')}
      subtitle={t('potOdds.quiz.doneSubtitle')}
      tone="success"
      metrics={[
        { label: t('potOdds.quiz.accuracy'), value: `${accuracy}%`, accent: 'brass' },
        { label: t('potOdds.quiz.avgTime'), value: `${avgTime}s`, icon: <Clock className="w-4 h-4" /> },
        {
          label: t('potOdds.quiz.correctCount'),
          value: `${correctCount}/${totalQuestions}`,
          icon: <Target className="w-4 h-4" />,
          accent: 'success',
        },
      ]}
      detail={
        <div className="rounded-lg border border-[var(--paper-rule)] bg-[var(--paper-raised)] p-4">
          <p className="m-0 text-sm text-[var(--ivory-dim)]">{grade}</p>
          {lastQuestionCorrect ? (
            <p className="m-0 mt-2 text-xs font-display text-[var(--sage-text)]">
              {t('potOdds.quiz.lastCorrect')}
            </p>
          ) : null}
        </div>
      }
      actions={[
        {
          label: t('potOdds.quiz.restart'),
          onClick: onRestart,
          variant: 'primary',
          icon: <RotateCcw className="w-4 h-4" />,
        },
        {
          label: t('potOdds.quiz.backToCalc'),
          onClick: onBack,
          variant: 'outline',
          icon: <Calculator className="w-4 h-4" />,
        },
      ]}
    />
  );
}
