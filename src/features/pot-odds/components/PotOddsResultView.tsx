import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calculator, Clock, RotateCcw, Target } from 'lucide-react';
import { ResultHeader } from '@/shared/components/feedback/ResultHeader';
import { ResultActions, type ResultAction } from '@/shared/components/feedback/ResultActions';
import { StatCard } from '@/shared/components/data-display/StatCard';
import { transitionSlow } from '@/shared/utils/motion';

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
 * 赔率测验结算页（feature-local）。
 *
 * 结果标题 / 动作组 / 统计卡走 shared 原子件；整页 felt 外壳、性能评语与
 * lastQuestionCorrect 提示保留在本组件。拆出后 PotOddsQuizPage 维持在行数棘轮内。
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

  return (
    <div className="min-h-screen bg-[var(--felt-deep)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={transitionSlow}
        className="w-full max-w-md text-center"
      >
        <ResultHeader
          title={t('potOdds.quiz.doneTitle')}
          subtitle={t('potOdds.quiz.doneSubtitle')}
          tone="success"
          headingLevel="h2"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            accent="gold"
            className="rounded-xl"
            contentClassName="p-5"
            value={`${accuracy}%`}
            label={t('potOdds.quiz.accuracy')}
          />
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            className="rounded-xl"
            contentClassName="p-5"
            value={`${avgTime}s`}
            label={
              <span className="inline-flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" /> {t('potOdds.quiz.avgTime')}
              </span>
            }
          />
          <StatCard
            size="xl"
            surface="solid"
            valueFirst
            className="rounded-xl"
            contentClassName="p-5"
            value={`${correctCount}/${totalQuestions}`}
            label={
              <span className="inline-flex items-center justify-center gap-1">
                <Target className="w-3 h-3" aria-hidden="true" /> {t('potOdds.quiz.correctCount')}
              </span>
            }
          />
        </div>

        <div className="rounded-lg bg-[var(--walnut-raised)] p-4 mb-8">
          <p className="text-sm text-[var(--ivory-dim)]">
            {accuracy >= 90 ? t('potOdds.quiz.gradeExcellent') :
             accuracy >= 70 ? t('potOdds.quiz.gradeGood') :
             accuracy >= 50 ? t('potOdds.quiz.gradeFair') :
             t('potOdds.quiz.gradePoor')}
          </p>
          {lastQuestionCorrect && (
            <p className="text-xs text-[var(--sage-text)] mt-2 font-display">
              {t('potOdds.quiz.lastCorrect')}
            </p>
          )}
        </div>

        <ResultActions
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
          ] satisfies ResultAction[]}
        />
      </motion.div>
    </div>
  );
}
