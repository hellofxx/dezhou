// P2-1.8: OpponentDrillResult — 对手画像 Drill 完成结果页
// 展示正确率/用时/正确题数，并说明"两问全对才计为答对"的计分口径

import { useTranslation } from 'react-i18next';
import { ArrowRight, Trophy, Clock, Target } from 'lucide-react';

interface OpponentDrillResultProps {
  correctCount: number;
  total: number;
  startTime: number;
  onFinish: () => void;
}

export function OpponentDrillResult({ correctCount, total, startTime, onFinish }: OpponentDrillResultProps) {
  const { t } = useTranslation();
  const accuracy = Math.round((correctCount / total) * 100);
  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  return (
    <div className="text-center py-8">
      <Trophy className="w-14 h-14 text-[var(--brass-bright)] mx-auto mb-4" />
      <h3 className="font-display text-2xl text-[var(--ivory)] mb-2">
        {t('drills.common.complete')}
      </h3>
      <p className="text-xs text-[var(--ivory-muted)] mb-6">{t('drills.opponent.scoringNote')}</p>
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
        <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
          <p className="font-numeric text-3xl text-[var(--brass-bright)]">{accuracy}%</p>
          <p className="text-xs text-[var(--ivory-muted)] mt-1">{t('drills.common.accuracyLabel')}</p>
        </div>
        <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
          <p className="font-numeric text-3xl text-[var(--ivory)]">{seconds}s</p>
          <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> {t('drills.common.timeLabel')}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--walnut-raised)] p-4">
          <p className="font-numeric text-3xl text-[var(--ivory)]">{correctCount}/{total}</p>
          <p className="text-xs text-[var(--ivory-muted)] mt-1 flex items-center justify-center gap-1">
            <Target className="w-3 h-3" /> {t('drills.common.correctLabel')}
          </p>
        </div>
      </div>
      <button
        onClick={onFinish}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--brass-bright)] text-[var(--felt-deep)] font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        {t('drills.common.finish')}
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
