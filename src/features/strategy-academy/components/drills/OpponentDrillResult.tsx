// P2-1.8: OpponentDrillResult — 对手画像 Drill 完成结果页
// 展示正确率/用时/正确题数，并说明「两问全对才计为答对」的计分口径。
// W2：结果页骨架收编到 feature-local DrillResultView，口径说明走 note 槽。

import { useTranslation } from 'react-i18next';
import { DrillResultView } from './DrillResultView';

interface OpponentDrillResultProps {
  correctCount: number;
  total: number;
  startTime: number;
  onFinish: () => void;
}

export function OpponentDrillResult({ correctCount, total, startTime, onFinish }: OpponentDrillResultProps) {
  const { t } = useTranslation();
  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  return (
    <DrillResultView
      correct={correctCount}
      total={total}
      timeText={`${seconds}s`}
      titleKey="drills.common.complete"
      note={t('drills.opponent.scoringNote')}
      accuracyLabelKey="drills.common.accuracyLabel"
      timeLabelKey="drills.common.timeLabel"
      correctLabelKey="drills.common.correctLabel"
      ctaLabelKey="drills.common.finish"
      onFinish={onFinish}
    />
  );
}
