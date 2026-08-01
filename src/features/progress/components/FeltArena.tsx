import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CasinoPlaque from '@/shared/components/CasinoPlaque';
import MottoEngraved from '@/shared/components/MottoEngraved';
import { CardBack } from '@/shared/components/CardBack';
import { Chip } from '@/shared/components/Chip';
import { getRankForScore } from '@/shared/utils/elo';
import { useProgressStore } from '../store';
import { useProgress } from '../hooks/useProgress';

/**
 * FeltArena — 椭圆牌桌 Hero 区域。
 * 展示 ELO 段位、欢迎语、铭文、装饰卡牌/筹码、数据铭牌。
 */
export default function FeltArena() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { summary, recentRecords } = useProgress();

  const streak = useProgressStore((s) => s.streak);
  const elo = useProgressStore((s) => s.elo);
  const emotion = useProgressStore((s) => s.emotion);
  const onboarding = useProgressStore((s) => s.onboarding);
  const currentRank = useMemo(() => getRankForScore(elo.overall), [elo.overall]);

  const currentStreak = streak.currentStreak;

  // P2-C: 使用 onboarding 设定的每日目标题数，替代硬编码 10
  const dailyGoal = onboarding.dailyGoalMinutes === 5 ? 5 : onboarding.dailyGoalMinutes === 20 ? 20 : 10;
  const dailyProgress = {
    current: emotion.dailyCorrect,
    total: emotion.dailyTotal || dailyGoal,
  };

  const weekSessions = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentRecords.filter((r) => r.createdAt >= weekAgo).length;
  }, [recentRecords]);

  return (
    <div className="felt-arena-wrap">
      <div className="felt-arena">
        <div
          className="relative z-10 flex flex-col items-center justify-start text-center"
          style={{ minHeight: '200px', paddingTop: '10px' }}
        >
          {/* ELO rank badge - top right */}
          <button
            onClick={() => navigate('/progress')}
            className="elo-rank-badge"
            style={{ position: 'absolute', top: '-4px', right: '18%', zIndex: 5 }}
            aria-label={`${currentRank.name} ${elo.overall} ELO`}
          >
            <span style={{ fontSize: '22px' }}>{currentRank.icon}</span>
            <div>
              <div className="font-display text-[15px] font-semibold text-[var(--ivory)]">
                {currentRank.name}
              </div>
              <div className="font-numeric text-[12px] text-[var(--brass)] font-semibold">
                {elo.overall} ELO
              </div>
            </div>
          </button>

          {/* Top greeting */}
          <div className="mb-2">
            <div className="section-eyebrow">
              {t('dashboard.feltArena.todaySession', { day: currentStreak || 1 })}
            </div>
            <h2 className="font-display text-[26px] text-[var(--ivory)] leading-tight mt-1">
              {t('dashboard.feltArena.welcome')}
            </h2>
            <MottoEngraved text={t('dashboard.feltArena.motto')} />
          </div>

          {/* Center: cards + chips + challenge card */}
          <div className="flex items-center justify-center gap-5 mt-1">
            {/* Card stack */}
            <div className="relative" style={{ width: '88px', height: '66px' }}>
              <div style={{ position: 'absolute', transform: 'rotate(-7deg)', left: 0, top: '3px' }}>
                <CardBack size="sm" />
              </div>
              <div style={{ position: 'absolute', transform: 'rotate(5deg)', left: '20px', top: 0 }}>
                <CardBack size="sm" />
              </div>
            </div>

            {/* Chip stack */}
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <Chip amount={currentStreak} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
            </div>

            {/* Today challenge card - A♠ */}
            <div className="flex flex-col items-center gap-1">
              <div className="text-[8px] uppercase tracking-[0.2em] text-[var(--brass)] font-semibold">
                {t('dashboard.feltArena.todayChallenge')}
              </div>
              <div className="text-2xl text-[var(--ivory)]">♠</div>
            </div>
          </div>

          <p className="text-[10px] text-[var(--ivory-muted)] mt-2 relative z-10">
            {t('dashboard.feltArena.ready')}
          </p>

          {/* Left plaque - total hands */}
          <div style={{ position: 'absolute', top: '18%', left: '6%' }}>
            <CasinoPlaque
              value={String(summary.totalSessions)}
              label={t('dashboard.feltArena.totalHands')}
              sub={t('dashboard.feltArena.totalHandsWeek', { count: weekSessions })}
              size="sm"
            />
          </div>

          {/* Right plaque - accuracy */}
          <div style={{ position: 'absolute', bottom: '18%', left: '10%' }}>
            <CasinoPlaque
              value={`${(summary.overallAccuracy * 100).toFixed(1)}%`}
              label={t('dashboard.feltArena.accuracy')}
              sub={t('dashboard.feltArena.accuracyLevel')}
              size="sm"
            />
          </div>

          {/* Daily progress chip - brass styled */}
          <div className="daily-progress-chip" style={{ position: 'absolute', bottom: '22%', right: '14%' }}>
            <div className="text-[8px] uppercase tracking-[0.15em] text-[var(--brass)] font-semibold">
              {t('dashboard.feltArena.todayProgress', '今日')}
            </div>
            <div className="font-numeric text-[12px] text-[var(--ivory)] font-semibold mt-0.5">
              {dailyProgress.current} / {dailyProgress.total}
            </div>
            <div className="progress-track mt-1" style={{ height: '3px', width: '60px' }}>
              <div className="progress-fill" style={{ width: `${dailyProgress.total > 0 ? (dailyProgress.current / dailyProgress.total) * 100 : 0}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
