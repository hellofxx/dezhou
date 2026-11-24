import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Puzzle, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../../store';
import { getTodayString } from '@/shared/utils/spacedRepetition';
import { toLocalDateKey } from '@/shared/utils/toLocalDateKey';

/**
 * DailyHabitBanner — 首页今日习惯横幅（5 题速训 / 8 题每日谜题二选一）。
 *
 * 完成态只认速训独立完成日期或当日 puzzle-trainer daily 训练记录；
 * 全站 streak.lastTrainingDate 仅表示任意训练，不作为习惯完成依据。
 */
export default function DailyHabitBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const lastQuickDrillDate = useProgressStore((s) => s.lastQuickDrillDate);
  const records = useProgressStore((s) => s.records);

  const startQuickDrill = useCallback(() => {
    navigate('/quick?mode=mixed&quick=true');
  }, [navigate]);

  const startDailyPuzzle = useCallback(() => {
    navigate('/puzzle/daily');
  }, [navigate]);

  const today = getTodayString();
  const quickCompleted = lastQuickDrillDate === today;
  const puzzleCompleted = records.some(
    (record) =>
      record.module === 'puzzle-trainer' &&
      record.mode === 'daily' &&
      toLocalDateKey(record.createdAt) === today,
  );
  const habitCompleted = quickCompleted || puzzleCompleted;

  return (
    <div className="quick-drill-card home-brass-banner">
      <div className="quick-drill-left">
        <div className="quick-drill-title">{t('dashboard.habit.title')}</div>
        <div className="quick-drill-pills">
          <span>{t('dashboard.habit.quickOption')}</span>
          <span>{t('dashboard.habit.puzzleOption')}</span>
        </div>
      </div>
      <div className="quick-drill-right">
        <Button
          type="button"
          size="sm"
          onClick={startQuickDrill}
          className="ml-1 min-h-[44px] md:min-h-9"
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          {quickCompleted ? t('dashboard.habit.quickAgain') : t('dashboard.habit.quickStart')}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={startDailyPuzzle}
          className="ml-1 min-h-[44px] md:min-h-9"
        >
          <Puzzle className="w-4 h-4" aria-hidden="true" />
          {puzzleCompleted ? t('dashboard.habit.puzzleView') : t('dashboard.habit.puzzleStart')}
        </Button>
        {habitCompleted && (
          <span className="quick-drill-done">{t('dashboard.habit.completed')}</span>
        )}
      </div>
    </div>
  );
}
