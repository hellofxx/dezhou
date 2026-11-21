import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Target, Calculator, Zap } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { useProgressStore } from '../../store';
import { getTodayString } from '@/shared/utils/spacedRepetition';

/**
 * QuickDrillBanner — 黄铜速训横幅（原 Dashboard Section 3 抽出，视觉与文案不变）。
 *
 * 三个模式入口共用 quick-drill 路由；todayCompleted 取自 streak.lastTrainingDate，
 * 与 StreakRail 的「今日已训」同一事实源。
 */
export default function QuickDrillBanner() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const streak = useProgressStore((s) => s.streak);

  const startQuickDrill = useCallback(
    (mode: 'range' | 'odds' | 'mixed') => {
      navigate(`/academy/quick-drill?mode=${mode}&quick=true`);
    },
    [navigate],
  );

  const todayCompleted = streak.lastTrainingDate === getTodayString();

  return (
    <div className="quick-drill-card">
      <div className="quick-drill-left">
        <div className="quick-drill-icon">
          <Zap className="w-5 h-5" />
        </div>
        <div>
          <div className="quick-drill-title">{t('dashboard.quickDrill.title')}</div>
          <div className="quick-drill-sub">{t('dashboard.quickDrill.subtitle')}</div>
        </div>
      </div>
      <div className="quick-drill-right">
        <button type="button" onClick={() => startQuickDrill('range')} className="quick-drill-mode">
          <Target className="w-3 h-3" />
          {t('dashboard.quickDrill.range')}
        </button>
        <button type="button" onClick={() => startQuickDrill('odds')} className="quick-drill-mode">
          <Calculator className="w-3 h-3" />
          {t('dashboard.quickDrill.odds')}
        </button>
        <button type="button" onClick={() => startQuickDrill('mixed')} className="quick-drill-mode">
          <Zap className="w-3 h-3" />
          {t('dashboard.quickDrill.mixed')}
        </button>
        <Button
          type="button"
          size="sm"
          onClick={() => startQuickDrill('mixed')}
          className="ml-1 min-h-[44px] md:min-h-9"
        >
          <Zap className="w-4 h-4" aria-hidden="true" />
          {t('dashboard.path.startQuick')}
        </Button>
        {todayCompleted && (
          <span className="quick-drill-done">{t('dashboard.quickDrill.completed')}</span>
        )}
      </div>
    </div>
  );
}
