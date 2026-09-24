import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import CasinoPlaque from '@/shared/components/business/CasinoPlaque';
import MottoEngraved from '@/shared/components/business/MottoEngraved';
import DailyGoalCard from '@/shared/components/business/DailyGoalCard';
import { CardBack } from '@/shared/components/poker/CardBack';
import { Chip } from '@/shared/components/poker/Chip';
import { getRankForScore } from '@/shared/utils/elo';
import { useProgressStore } from '../../store';
import { useProgress } from '../../hooks/useProgress';
import { getTodayString } from '../../utils/streakCalc';

/**
 * FeltArena — 椭圆牌桌 Hero 区域。
 *
 * 结构（避免绝对定位元素相互重叠）：
 * 1. 顶部栏：左侧 ELO 段位徽章（桌面端展示，移动端 CSS 隐藏）
 * 2. 中央：今日引导 eyebrow + 欢迎语 + 铭文 + 装饰牌堆/筹码
 * 3. 底部：三项核心指标以水平 plaque 呈现（总手数 / 综合正确率 / 今日进度）
 */
export default function FeltArena() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { summary, recentRecords } = useProgress();

  const streak = useProgressStore((s) => s.streak);
  const elo = useProgressStore((s) => s.eloByVariant[s.activeVariant]);
  const emotion = useProgressStore((s) => s.emotion);
  const onboarding = useProgressStore((s) => s.onboarding);
  const currentRank = useMemo(() => getRankForScore(elo.overall), [elo.overall]);

  const currentStreak = streak.currentStreak;

  // P2-C: 使用 onboarding 设定的每日目标题数，替代硬编码 10
  const dailyGoal =
    onboarding.dailyGoalMinutes === 5 || onboarding.dailyGoalMinutes === 20
      ? onboarding.dailyGoalMinutes
      : 10;
  // 今日进度 = 今日已答题数 / 目标题数；跨日时 dailyQuestionsDate 非今日 → 视为 0（防御昨日残留数据）
  const isToday = emotion.dailyQuestionsDate === getTodayString();
  // XMOD-010：当日活跃 = 已记训练日（onboarding 完成已调用 recordTrainingDay，或正式训练）。
  // 当日活跃但无真实答题时（如仅完成引导），今日进度保底为 1，使「今日进度」与 streak（Day N）
  // 展示一致，消除「今日进度 0/N 但 streak Day 1」的观感矛盾；有真实答题时仍按实际计数。
  const isTodayActive = streak.lastTrainingDate === getTodayString();
  const dailyProgress = {
    current: isTodayActive ? Math.max(isToday ? emotion.dailyTotal : 1, 1) : 0,
    total: dailyGoal,
  };
  const progressPercent =
    dailyProgress.total > 0
      ? Math.min(100, Math.round((dailyProgress.current / dailyProgress.total) * 100))
      : 0;

  const weekSessions = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return recentRecords.filter((r) => r.createdAt >= weekAgo).length;
  }, [recentRecords]);

  return (
    <div className="felt-arena-wrap">
      <div className="felt-arena">
        {/* 顶部：ELO 段位徽章 — 静态 flex 居中于椭圆内，避免绝对定位骑椭圆边缘 */}
        <button
          onClick={() => navigate('/progress')}
          className="elo-rank-badge"
          aria-label={`${t(`progress.rank.${currentRank.name}.name`)} ${elo.overall} ELO`}
        >
          <span className="elo-suit">{currentRank.icon}</span>
          <span className="elo-meta">
            <span className="elo-name">{t(`progress.rank.${currentRank.name}.name`)}</span>
            <span className="elo-score">{elo.overall} ELO</span>
          </span>
        </button>

        {/* 中央：欢迎语 */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div>
            <div className="section-eyebrow">
              {t('dashboard.feltArena.todaySession', { day: currentStreak || 1 })}
            </div>
            <h2 className="font-display text-[26px] text-[var(--ivory)] leading-tight mt-1">
              {t('dashboard.feltArena.welcome')}
            </h2>
            <MottoEngraved text={t('dashboard.feltArena.motto')} />
          </div>

          {/* 装饰：四花色行（扑克桌主题点缀） */}
          <div className="felt-suit-row" aria-hidden="true">
            <span className="felt-suit-line" />
            <span className="felt-suit-spade">♠</span>
            <span className="felt-suit-heart">♥</span>
            <span className="felt-suit-diamond">♦</span>
            <span className="felt-suit-club">♣</span>
            <span className="felt-suit-line" />
          </div>

          {/* 装饰：牌堆 + 筹码 */}
          <div className="felt-arena-decor">
            <div className="relative" style={{ width: '88px', height: '66px' }}>
              <div style={{ position: 'absolute', transform: 'rotate(-7deg)', left: 0, top: '3px' }}>
                <CardBack size="sm" />
              </div>
              <div style={{ position: 'absolute', transform: 'rotate(5deg)', left: '20px', top: 0 }}>
                <CardBack size="sm" />
              </div>
            </div>
            <div className="flex flex-col items-center" style={{ gap: '2px' }}>
              <Chip amount={currentStreak} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
              <Chip amount={0} color="brass" size="sm" />
            </div>
          </div>

          <p className="text-[10px] text-[var(--ivory-muted)] relative z-10">
            {t('dashboard.feltArena.ready')}
          </p>
        </div>

        {/* 底部：三项核心指标 plaque（水平排列，非绝对定位） */}
        <div className="felt-arena-stats">
          <CasinoPlaque
            value={String(summary.totalSessions)}
            label={t('dashboard.feltArena.totalHands')}
            sub={t('dashboard.feltArena.totalHandsWeek', { count: weekSessions })}
            size="sm"
          />
          <CasinoPlaque
            value={`${(summary.overallAccuracy * 100).toFixed(1)}%`}
            label={t('dashboard.feltArena.accuracy')}
            sub={t('dashboard.feltArena.accuracyLevel')}
            size="sm"
          />
          <div className="daily-progress-chip">
            <div className="text-[8px] uppercase tracking-[0.15em] text-[var(--brass)] font-semibold">
              {t('dashboard.feltArena.todayProgress')}
            </div>
            <div className="font-numeric text-[12px] text-[var(--ivory)] font-semibold mt-0.5">
              {dailyProgress.current} / {dailyProgress.total}
            </div>
            <div className="progress-track mt-1" style={{ height: '3px', width: '60px' }}>
              <div
                className="progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* §13.2.4：每日目标卡 — 放在 stats 区下方 */}
        <div className="mt-3 px-4 w-full max-w-[400px] mx-auto">
          <DailyGoalCard
            completed={isToday ? emotion.dailyTotal : 0}
            total={dailyGoal}
            goalLabel={t('dashboard.dailyGoal.label')}
          />
        </div>
      </div>
    </div>
  );
}