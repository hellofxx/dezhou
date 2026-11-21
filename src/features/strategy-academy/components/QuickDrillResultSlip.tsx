import { useTranslation } from 'react-i18next';
import { Award, Clock, Home, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react';
import { ResultSlip, type ResultSlipBadge } from '@/shared/components/feedback/ResultSlip';
import type { PracticeResult } from '../types';

interface QuickDrillResultSlipProps {
  open: boolean;
  result: PracticeResult;
  earnedXp: number;
  reviewCount: number;
  isNewRecord: boolean;
  freezeRewarded: boolean;
  quickDrillStreak: number;
  onRetry: () => void;
  onClose: () => void;
}

/** 速训结算纸条：指标 / 徽章 / 动作统一由 ResultSlip 承载。 */
export default function QuickDrillResultSlip({
  open,
  result,
  earnedXp,
  reviewCount,
  isNewRecord,
  freezeRewarded,
  quickDrillStreak,
  onRetry,
  onClose,
}: QuickDrillResultSlipProps) {
  const { t } = useTranslation();
  const accuracy = Math.round(result.accuracy * 100);
  const isAllCorrect = result.correctAnswers === result.totalQuestions;

  const badges: ResultSlipBadge[] = [];
  if (isNewRecord) {
    badges.push({
      label: t('quickDrill.newRecord', { defaultValue: '快速训练新纪录！' }),
      icon: <Trophy className="w-3.5 h-3.5" />,
    });
  }
  if (reviewCount > 0) {
    badges.push({
      label: t('quickDrill.result.reviewIncluded', {
        defaultValue: '本次包含 {{count}} 道复习题',
        count: reviewCount,
      }),
      icon: <Sparkles className="w-3.5 h-3.5" />,
      tone: 'info',
    });
  }
  if (isAllCorrect) {
    badges.push({
      label: t('quickDrill.result.allCorrectBonus', { defaultValue: '全对 +20 XP 奖励' }),
      icon: <Award className="w-3.5 h-3.5" />,
    });
  }
  if (freezeRewarded) {
    badges.push({
      label: t('quickDrill.freezeReward', {
        defaultValue: '连续 {{count}} 天快速训练奖励 1 张冻结卡！',
        count: quickDrillStreak > 0 ? quickDrillStreak : 7,
      }),
      icon: <Award className="w-3.5 h-3.5" />,
      tone: 'success',
    });
  }
  badges.push({
    label: t('quickDrill.result.streakRecorded', { defaultValue: '已计入连续训练 ✓' }),
    icon: <Award className="w-3.5 h-3.5" />,
    tone: 'success',
  });

  const subtitle = quickDrillStreak > 0
    ? t('quickDrill.streak.current', {
        defaultValue: '快速训练连续 {{count}} 天',
        count: quickDrillStreak,
      })
    : t('quickDrill.result.streakRecorded', { defaultValue: '已计入连续训练 ✓' });

  return (
    <ResultSlip
      open={open}
      onClose={onClose}
      title={t('quickDrill.result.title', { defaultValue: '训练完成' })}
      subtitle={subtitle}
      tone={accuracy >= 90 ? 'success' : accuracy >= 70 ? 'neutral' : 'warning'}
      metrics={[
        { label: t('quickDrill.result.accuracy', { defaultValue: '正确率' }), value: `${accuracy}%`, icon: <Target className="w-4 h-4" />, accent: 'brass' },
        { label: t('quickDrill.result.time', { defaultValue: '平均用时' }), value: `${result.averageTime.toFixed(1)}s`, icon: <Clock className="w-4 h-4" /> },
        { label: t('quickDrill.result.xp', { defaultValue: 'XP 获得' }), value: `+${earnedXp}`, icon: <Award className="w-4 h-4" />, accent: 'success' },
      ]}
      badges={badges}
      actions={[
        {
          label: t('quickDrill.again', { defaultValue: '再来一轮' }),
          onClick: onRetry,
          variant: 'primary',
          icon: <RotateCcw className="w-4 h-4" />,
        },
        {
          label: t('quickDrill.backHome', { defaultValue: '返回首页' }),
          onClick: onClose,
          variant: 'outline',
          icon: <Home className="w-4 h-4" />,
        },
      ]}
    />
  );
}
