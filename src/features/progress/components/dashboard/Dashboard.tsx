import { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Calculator,
  Gamepad2,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  ClipboardList,
  Zap,
  Puzzle,
} from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useProgressStore } from '../../store';
import { useAcademyStore } from '@/features/strategy-academy/store';
import DailyChallenge from '../achievement/DailyChallenge';
import DailyTrainingPlan from '../training/DailyTrainingPlan';
import SpacedRepetitionPanel from '../srs/SpacedRepetitionPanel';
import ReviewSession from '../srs/ReviewSession';
import { generateDailyPlan } from '../../utils/dailyTrainingPlan';
import { getTodayReviewItems, getTodayString } from '../../utils/spacedRepetition';
import RankUpCelebration from '../celebration/RankUpCelebration';
import DownswingAlert from '../gate/DownswingAlert';
import MoodTracker from '../settings/MoodTracker';
import FeltArena from '../training/FeltArena';
import StreakRail from '../streak/StreakRail';
import AchievementWall from '../achievement/AchievementWall';
import ProgressReplay from '../replay/ProgressReplay';
import { ACHIEVEMENTS } from '../../data/achievements';

const MODULE_LABELS: Record<string, string> = {
  'range-trainer': '手牌范围训练',
  'pot-odds': '赔率计算器',
  'gto-simulator': 'GTO 模拟器',
  'hand-history': '牌局复盘',
  'strategy-academy': '策略学院',
  'theory-academy': '理论学院',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { summary, recentRecords, records } = useProgress();
  const academyProgress = useAcademyStore((s) => s.progress);

  // 复习状态
  const reviewItems = useProgressStore((s) => s.reviewItems);
  const dismissedRecommendations = useProgressStore((s) => s.dismissedRecommendations);
  const lastDismissalDate = useProgressStore((s) => s.lastDismissalDate);
  const dismissRecommendation = useProgressStore((s) => s.dismissRecommendation);
  const clearDailyDismissals = useProgressStore((s) => s.clearDailyDismissals);

  // P0-5: Streak 状态，用于判断今日是否已完成快速训练
  const streak = useProgressStore((s) => s.streak);

  // P1-2.5 / P1-2.7: ELO 状态与段位徽章
  const eloRankUp = useProgressStore((s) => s.eloRankUp);
  const clearEloRankUp = useProgressStore((s) => s.clearEloRankUp);

  // P1-3: 成就系统
  const [achievementWallOpen, setAchievementWallOpen] = useState(false);
  const unlockedAchievements = useProgressStore((s) => s.unlockedAchievements);
  const achievementUnlockDates = useProgressStore((s) => s.achievementUnlockDates);

  // 最近解锁的成就
  const latestAchievement = useMemo(() => {
    if (unlockedAchievements.length === 0) return null;
    const sorted = [...unlockedAchievements].sort(
      (a, b) => (achievementUnlockDates[b] ?? 0) - (achievementUnlockDates[a] ?? 0)
    );
    const id = sorted[0];
    return id ? ACHIEVEMENTS.find((ach) => ach.id === id) ?? null : null;
  }, [unlockedAchievements, achievementUnlockDates]);

  // P1-3.4 / P1-3.5: 复习模式 Dialog 开关状态
  const [reviewSessionOpen, setReviewSessionOpen] = useState(false);
  const openReviewSession = useCallback(() => setReviewSessionOpen(true), []);

  // 每日重置跳过的推荐
  useEffect(() => {
    const today = getTodayString();
    if (lastDismissalDate !== today) {
      clearDailyDismissals();
    }
  }, [lastDismissalDate, clearDailyDismissals]);

  // P0-5: 3 分钟快速训练入口
  const startQuickDrill = useCallback(
    (mode: 'range' | 'odds' | 'mixed') => {
      navigate(`/academy/quick-drill?mode=${mode}&quick=true`);
    },
    [navigate]
  );

  const todayCompleted = streak.lastTrainingDate === getTodayString();

  // 今日待复习项
  const todayReviewItems = useMemo(
    () => getTodayReviewItems(reviewItems),
    [reviewItems]
  );

  // 生成每日推荐
  const recommendations = useMemo(() => {
    const allRecommendations = generateDailyPlan(
      academyProgress,
      records,
      reviewItems,
      summary.currentStreak
    );
    return allRecommendations.filter((r) => !dismissedRecommendations.includes(r.id));
  }, [academyProgress, records, reviewItems, summary.currentStreak, dismissedRecommendations]);

  return (
    <div className="h-full overflow-auto">
      {/* Section 1: Felt Arena Hero */}
      <FeltArena />

      <div className="px-5">
        {/* Section 2: Streak Rail */}
        <StreakRail />

        {/* Section 3: Quick Drill Brass Banner */}
        <div className="quick-drill-card">
          <div className="quick-drill-left">
            <div className="quick-drill-icon">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="quick-drill-title">
                {t('dashboard.quickDrill.title')}
              </div>
              <div className="quick-drill-sub">
                {t('dashboard.quickDrill.subtitle')}
              </div>
            </div>
          </div>
          <div className="quick-drill-right">
            <button
              onClick={() => startQuickDrill('range')}
              className="quick-drill-mode"
            >
              <Target className="w-3 h-3" />
              {t('dashboard.quickDrill.range')}
            </button>
            <button
              onClick={() => startQuickDrill('odds')}
              className="quick-drill-mode"
            >
              <Calculator className="w-3 h-3" />
              {t('dashboard.quickDrill.odds')}
            </button>
            <button
              onClick={() => startQuickDrill('mixed')}
              className="quick-drill-mode"
            >
              <Zap className="w-3 h-3" />
              {t('dashboard.quickDrill.mixed')}
            </button>
            {todayCompleted && (
              <span className="quick-drill-done">
                {t('dashboard.quickDrill.completed')}
              </span>
            )}
          </div>
        </div>

        {/* P1-3: Achievement Entry Card */}
        <button
          onClick={() => setAchievementWallOpen(true)}
          className="w-full mb-5 panel flex items-center gap-4 p-4 text-left hover:brightness-105 transition-all"
          style={{ borderLeft: '3px solid var(--brass)' }}
        >
          <div className="text-3xl">{latestAchievement?.icon ?? '🏆'}</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--ivory)]">
              {t('achievements.title')}
            </div>
            <div className="text-xs text-[var(--ivory-muted)] mt-0.5">
              {latestAchievement
                ? t('achievements.newUnlock') + ' ' + t(latestAchievement.title)
                : t('achievements.progress', { current: unlockedAchievements.length, total: ACHIEVEMENTS.length })}
            </div>
          </div>
          <div className="shrink-0 text-xs font-numeric text-[var(--brass-bright)]">
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)]" />
        </button>

        {/* First visit guide */}
        {summary.totalSessions === 0 && (
          <div className="panel p-4 flex flex-col sm:flex-row items-center gap-3 mb-4" style={{ borderLeft: '3px solid var(--brass)' }}>
            <span className="text-2xl shrink-0">👋</span>
            <div className="flex-1 text-center sm:text-left">
              <p className="text-[var(--ivory)] font-medium text-sm">{t('progress.firstVisitWelcome')}</p>
            </div>
            <button
              onClick={() => navigate('/academy/basics')}
              className="shrink-0 px-4 py-2 rounded-md bg-[var(--brass-bright)] text-[var(--primary-fg)] font-semibold text-sm hover:brightness-110 transition-all shadow-[var(--shadow-brass)]"
            >
              {t('progress.startLearning')}
            </button>
          </div>
        )}

        {/* Section 4: Row 1 - Training (2/3) + SRS (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ gridAutoRows: '1fr' }}>
          <div className="lg:col-span-2 h-full">
            <DailyChallenge />
          </div>
          <div className="h-full">
            <SpacedRepetitionPanel
              reviewItems={reviewItems}
              todayItems={todayReviewItems}
              onStartReview={openReviewSession}
            />
          </div>
        </div>

        {/* Downswing + Mood (conditional) */}
        <DownswingAlert />
        <MoodTracker />

        {/* Progress Replay - 回放你的进步 */}
        <div className="mb-5">
          <ProgressReplay />
        </div>

        {/* Section 5: Row 2 - Data (2/3) + Recommendations (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ gridAutoRows: '1fr' }}>
          <div className="lg:col-span-2 h-full">
            <DailyTrainingPlan
              recommendations={recommendations}
              onDismiss={dismissRecommendation}
            />
          </div>
          <div className="h-full">
            {/* Accuracy trend / recent records panel */}
            <div className="panel h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="panel-title mb-0">
                  <TrendingUp className="w-4 h-4" />
                  {t('dashboard.dataPlan.accuracyTrend')}
                </div>
              </div>
              <div className="flex-1">
                {recentRecords.length > 0 ? (
                  <div className="space-y-1">
                    {recentRecords.slice(0, 5).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 border-b border-[var(--walnut-border)]/40 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-[var(--walnut-light)]/50 flex items-center justify-center">
                            <Target className="w-3.5 h-3.5 text-[var(--brass-bright)]" />
                          </div>
                          <div className="text-xs text-[var(--ivory)]">
                            {MODULE_LABELS[record.module] ?? record.module}
                          </div>
                        </div>
                        <span className="font-numeric text-xs text-[var(--brass-bright)]">
                          {(record.result.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-xs text-[var(--ivory-muted)] py-8">
                    {t('progress.noRecords', '还没有训练记录')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Training Grounds - 6 module cards */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="panel-title mb-0">
              <Gamepad2 className="w-4 h-4" />
              {t('dashboard.trainingGrounds.title')}
            </div>
            <span className="text-[10px] text-[var(--ivory-muted)]">
              {t('dashboard.trainingGrounds.subtitle')}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* Range Trainer */}
            <button className="module-card" onClick={() => navigate('/range-trainer')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,162,94,0.22), rgba(201,162,94,0.06))' }}
              >
                <Target className="w-5 h-5 text-[var(--brass-bright)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.rangeTrainer')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.rangeDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>

            {/* Pot Odds */}
            <button className="module-card" onClick={() => navigate('/pot-odds')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(139,165,155,0.22), rgba(139,165,155,0.06))' }}
              >
                <Calculator className="w-5 h-5 text-[var(--poker-info)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.potOdds')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.oddsDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>

            {/* GTO Simulator */}
            <button className="module-card" onClick={() => navigate('/gto-simulator')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(168,196,207,0.22), rgba(168,196,207,0.06))' }}
              >
                <Gamepad2 className="w-5 h-5 text-[var(--poker-frost)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.gtoSimulator')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.gtoDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>

            {/* Strategy Academy */}
            <button className="module-card" onClick={() => navigate('/academy')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(127,184,131,0.22), rgba(127,184,131,0.06))' }}
              >
                <GraduationCap className="w-5 h-5 text-[var(--poker-success)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.academy')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.academyDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>

            {/* Puzzle Trainer */}
            <button className="module-card" onClick={() => navigate('/puzzle')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(201,162,94,0.22), rgba(201,162,94,0.06))' }}
              >
                <Puzzle className="w-5 h-5 text-[var(--brass-bright)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.puzzle')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.puzzleDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>

            {/* Hand History */}
            <button className="module-card" onClick={() => navigate('/hand-history')}>
              <div
                className="module-icon"
                style={{ background: 'radial-gradient(circle at 30% 30%, rgba(192,138,90,0.2), rgba(192,138,90,0.05))' }}
              >
                <ClipboardList className="w-5 h-5 text-[var(--poker-leather)]" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] font-semibold text-[var(--ivory)]">{t('nav.handHistory')}</div>
                <div className="text-[10px] text-[var(--ivory-muted)] mt-0.5 leading-snug">
                  {t('dashboard.trainingGrounds.reviewDesc')}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-[var(--ivory-muted)]" />
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <RankUpCelebration rankUp={eloRankUp} onClose={clearEloRankUp} />
      <ReviewSession
        open={reviewSessionOpen}
        onOpenChange={setReviewSessionOpen}
        initialItems={todayReviewItems}
      />
      <AchievementWall
        open={achievementWallOpen}
        onOpenChange={setAchievementWallOpen}
      />
    </div>
  );
}
