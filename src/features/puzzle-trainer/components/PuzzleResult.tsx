/**
 * 结果纸条：显示分数、正确率、用时、Best Record、答错的题目列表与正确答案。
 *
 * - "再试一次"会重置引擎
 * - "返回首页"/关闭会回到谜题站
 * - 纸张、指标、徽章与动作统一走 shared ResultSlip（标题 h2）
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Home, RefreshCw, Target, TrendingUp, Trophy } from 'lucide-react';
import { ResultSlip } from '@/shared/components/feedback/ResultSlip';
import { WrongAnswerList, type WrongAnswerEntry } from './PuzzleResultParts';
import type { PuzzleResult } from '../types';

interface PuzzleResultProps {
  result: PuzzleResult;
  /** 是否破纪录 */
  isNewRecord: boolean;
  /** "再试一次"回调 */
  onRetry: () => void;
  /** "返回首页"回调 */
  onBackHome: () => void;
}

export function PuzzleResult({ result, isNewRecord, onRetry, onBackHome }: PuzzleResultProps) {
  const { t } = useTranslation();

  const accuracyPercent = Math.round(result.accuracy * 100);
  const durationSec = Math.round(result.duration / 1000);
  const avgTimeSec = (result.averageTime / 1000).toFixed(1);

  // 答错的题目
  const wrongAnswers = useMemo(() => {
    return result.answers
      .map((a) => {
        const question = result.questions.find((q) => q.id === a.questionId);
        if (!question || a.isCorrect) return null;
        const correctOption = question.options.find((o) => o.isCorrect);
        const selectedOption = question.options.find((o) => o.id === a.selectedOptionId);
        return { question, correctOption, selectedOption };
      })
      .filter(Boolean) as WrongAnswerEntry[];
  }, [result.answers, result.questions]);

  const isRush = result.mode === 'rush';
  const metrics = [
    ...(isRush
      ? [{ label: t('puzzle.result.score'), value: `${result.score}`, icon: <Trophy className="w-4 h-4" />, accent: 'brass' as const }]
      : []),
    { label: t('puzzle.result.correctRate'), value: `${accuracyPercent}%`, icon: <Target className="w-4 h-4" />, accent: 'brass' as const },
    { label: t('puzzle.result.correctCount'), value: `${result.correctCount}/${result.totalQuestions}`, icon: <Target className="w-4 h-4" />, accent: 'success' as const },
    {
      label: t('puzzle.result.duration'),
      value: isRush
        ? t('puzzle.result.minutes', { min: Math.floor(durationSec / 60), sec: durationSec % 60 })
        : `${durationSec}s`,
      icon: <Target className="w-4 h-4" />,
    },
    ...(!isRush
      ? [{ label: t('puzzle.result.avgTime'), value: `${avgTimeSec}s`, icon: <TrendingUp className="w-4 h-4" /> }]
      : []),
  ];

  return (
    <ResultSlip
      open
      onClose={onBackHome}
      title={isRush ? t('puzzle.result.rushTitle') : t('puzzle.result.title')}
      tone={accuracyPercent >= 70 ? 'success' : 'warning'}
      metrics={metrics}
      badges={
        isNewRecord
          ? [{ label: t('puzzle.result.newRecord'), icon: <Trophy className="w-3.5 h-3.5" />, tone: 'brass' }]
          : undefined
      }
      detail={wrongAnswers.length > 0 ? <WrongAnswerList entries={wrongAnswers} /> : undefined}
      actions={[
        {
          label: t('puzzle.result.retry'),
          onClick: onRetry,
          icon: <RefreshCw className="w-4 h-4" />,
          variant: 'primary',
        },
        {
          label: t('puzzle.result.backHome'),
          onClick: onBackHome,
          icon: <Home className="w-4 h-4" />,
          variant: 'outline',
        },
      ]}
    />
  );
}
