import { useMemo, useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Target,
  Calculator,
  Gamepad2,
  ArrowRight,
  Zap,
  History,
  Clock,
} from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useProgressStore } from '../../store';
import { useAcademyProgressSnapshot } from '@/shared/hooks/useAcademyDataSource';
import { useModuleLabel } from '@/shared/hooks/useModuleLabel';
import { EmptyState } from '@/shared/components/feedback/EmptyState';
import DailyChallenge from '../achievement/DailyChallenge';
import DailyTrainingPlan from '../training/DailyTrainingPlan';
import SpacedRepetitionPanel from '../srs/SpacedRepetitionPanel';
import ReviewSession from '../srs/ReviewSession';
import FirstVisitBanner from './FirstVisitBanner';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import { getTodayReviewItems, getTodayString } from '@/shared/utils/spacedRepetition';
import RankUpCelebration from '../celebration/RankUpCelebration';
import DownswingAlert from '../gate/DownswingAlert';
import MoodTracker from '../settings/MoodTracker';
import FeltArena from '../training/FeltArena';
import StreakRail from '../streak/StreakRail';
import AchievementWall from '../achievement/AchievementWall';
import ProgressReplay from '../replay/ProgressReplay';
import { VariantEloOverview } from '../stats/VariantEloOverview';
import { ACHIEVEMENTS } from '../../data/achievements';
import ModuleGrid, { NewbiePathCard } from './ModuleGrid';

type TimeRange = '7d' | '30d' | '90d' | 'all';

const TIME_RANGE_KEYS: Record<TimeRange, string> = {
  '7d': 'dashboard.timeRange.7d',
  '30d': 'dashboard.timeRange.30d',
  '90d': 'dashboard.timeRange.90d',
  all: 'dashboard.timeRange.all',
};

const TIME_RANGE_DAYS: Record<TimeRange, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { summary, records } = useProgress();
  const academyProgress = useAcademyProgressSnapshot();
  const moduleLabel = useModuleLabel();

  // 时间范围筛选器 — 联动「最近训练」列表
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

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
    const sorted = [...unlockedAchievements].toSorted(
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
    const allRecommendations = generateCrossModuleDailyPlan(
      academyProgress.completedLessons,
      records,
      reviewItems,
      summary.currentStreak
    );
    return allRecommendations.filter((r) => !dismissedRecommendations.includes(r.id));
  }, [academyProgress, records, reviewItems, summary.currentStreak, dismissedRecommendations]);

  // 时间范围筛选后的训练记录（基于全量 records，展示层再 slice，避免仅统计最近 10 条）
  const filteredRecentRecords = useMemo(() => {
    const days = TIME_RANGE_DAYS[timeRange];
    if (days === null) return records;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return records.filter((r) => r.createdAt >= cutoff);
  }, [records, timeRange]);

  // §13.6.1 新手收敛：totalSessions < 5 时隐藏训练场网格，展示单一学习路径卡
  const isNewbie = summary.totalSessions < 5;
  const pathCard = useMemo(() => {
    const rec = recommendations[0];
    if (!rec) {
      return { title: t('dashboard.progressive.newbieTitle'), description: '', route: '/academy' };
    }
    // title/description 为 i18n key（渲染端 t() 解析，key 缺失回退 titleParams.title）
    const resolvedTitle =
      t(rec.title, rec.titleParams) === rec.title
        ? String(rec.titleParams?.title ?? rec.title)
        : t(rec.title, rec.titleParams);
    return { title: resolvedTitle, description: t(rec.description, rec.descParams), route: rec.route };
  }, [recommendations, t]);

  return (
    <div className="h-full overflow-auto">
      {/* Section 1: Felt Arena Hero */}
      <FeltArena />

      <div className="px-0">
        {/* First visit banner — 首访引导置于首屏，紧随 Hero */}
        {summary.totalSessions === 0 && <FirstVisitBanner />}

        {/* Section 2: Streak Rail — 连续天数 + 周轨道 + 今日正确率（核心进度指标） */}
        <StreakRail />

        {/* Section 3: Quick Drill Brass Banner — 高频训练入口 */}
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

        {/* Section 4: 今日任务 + 今日复习（双卡，2:1 主从布局） */}
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

        {/* Downswing Alert — 下风期警示，仅条件性渲染 */}
        <DownswingAlert />

        {/* Section 5: 智能推荐（主） + 最近训练（次，含时间范围筛选） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ gridAutoRows: '1fr' }}>
          <div className="lg:col-span-2 h-full">
            <DailyTrainingPlan
              recommendations={recommendations}
              onDismiss={dismissRecommendation}
            />
          </div>
          <div className="h-full">
            {/* 最近训练记录 — 时间范围筛选器联动 */}
            <div className="panel h-full flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="panel-title mb-0">
                  <History className="w-4 h-4" />
                  {t('dashboard.recentTraining.title')}
                </div>
                {/* 时间范围筛选器 */}
                <div className="flex items-center gap-1 rounded-md bg-[var(--walnut-raised)]/60 p-0.5" role="tablist" aria-label={t('dashboard.timeRange.ariaLabel')}>
                  {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => {
                    const active = timeRange === range;
                    return (
                      <button
                        key={range}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setTimeRange(range)}
                        className={`px-2 py-1 text-[10px] font-numeric rounded transition-colors ${
                          active
                            ? 'bg-[var(--brass)] text-[var(--primary-foreground)] font-semibold'
                            : 'text-[var(--ivory-muted)] hover:text-[var(--ivory)]'
                        }`}
                      >
                        {t(TIME_RANGE_KEYS[range])}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 当前筛选下的关键统计 — 强化"决策辅助"价值 */}
              <FilteredSummary records={filteredRecentRecords} />

              <div className="flex-1">
                {filteredRecentRecords.length > 0 ? (
                  <div className="space-y-1">
                    {filteredRecentRecords.slice(0, 5).map((record) => (
                      <div
                        key={record.id}
                        className="flex items-center justify-between py-2 border-b border-[var(--walnut-border)]/40 last:border-0"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded bg-[var(--walnut-light)]/50 flex items-center justify-center shrink-0">
                            <Target className="w-3.5 h-3.5 text-[var(--brass-bright)]" />
                          </div>
                          <div className="text-xs text-[var(--ivory)] truncate">
                            {moduleLabel(record.module)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-[var(--ivory-muted)] font-numeric">
                            {formatRelative(record.createdAt, t)}
                          </span>
                          <span className="font-numeric text-xs text-[var(--brass-bright)] min-w-[44px] text-right">
                            {(record.result.accuracy * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={<Clock className="w-8 h-8" />}
                    title={t('dashboard.recentTraining.empty.title')}
                    description={t('dashboard.recentTraining.empty.description')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: 多变体 ELO 概览 + 成就入口（双列，水平对称） */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <VariantEloOverview />
          <button
            onClick={() => setAchievementWallOpen(true)}
            className="hover-bright panel flex items-center gap-4 p-5 text-left transition-all"
            style={{ borderLeft: '3px solid var(--brass)' }}
            aria-label={t('achievements.title')}
          >
            <div className="text-4xl shrink-0">{latestAchievement?.icon ?? '🏆'}</div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
                {t('achievements.title')}
              </div>
              <div className="text-xs text-[var(--ivory-muted)] mt-1 line-clamp-2">
                {latestAchievement
                  ? `${t('achievements.newUnlock')}：${t(latestAchievement.title)}`
                  : t('achievements.progress', { current: unlockedAchievements.length, total: ACHIEVEMENTS.length })}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="font-numeric text-sm text-[var(--brass-bright)]">
                {unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </span>
              <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)]" />
            </div>
          </button>
        </div>

        {/* Section 7: 进度回放 + 情绪标记（情绪为辅助，放右侧） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ gridAutoRows: '1fr' }}>
          <div className="lg:col-span-2 h-full">
            <ProgressReplay />
          </div>
          <div className="h-full">
            <MoodTracker />
          </div>
        </div>

        {/* Section 8: Training Grounds — 6 个训练模块入口（最后，作为完整目录）
            §13.6.1 新手收敛：totalSessions < 5 时替换为单一学习路径卡 */}
        {isNewbie ? (
          <NewbiePathCard
            title={pathCard.title}
            description={pathCard.description}
            route={pathCard.route}
          />
        ) : (
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
            <ModuleGrid />
          </div>
        )}
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

/* ===== 私有子组件：最近训练筛选汇总 ===== */
function FilteredSummary({
  records,
}: {
  records: { result: { totalQuestions: number; correctAnswers: number; accuracy: number } }[];
}) {
  const { t } = useTranslation();
  const stats = useMemo(() => {
    if (records.length === 0) {
      return { count: 0, questions: 0, accuracy: 0 };
    }
    let q = 0;
    let c = 0;
    for (const r of records) {
      q += r.result.totalQuestions;
      c += r.result.correctAnswers;
    }
    return {
      count: records.length,
      questions: q,
      accuracy: q > 0 ? c / q : 0,
    };
  }, [records]);

  return (
    <div className="grid grid-cols-3 gap-2 mb-3 pb-3 border-b border-[var(--walnut-border)]/40">
      <Metric
        label={t('dashboard.recentTraining.sessions')}
        value={String(stats.count)}
      />
      <Metric
        label={t('dashboard.recentTraining.questions')}
        value={String(stats.questions)}
      />
      <Metric
        label={t('dashboard.recentTraining.accuracy')}
        value={`${(stats.accuracy * 100).toFixed(1)}%`}
        accent={stats.accuracy >= 0.7 ? 'success' : stats.accuracy < 0.5 ? 'danger' : 'brass'}
      />
    </div>
  );
}

function Metric({
  label,
  value,
  accent = 'ivory',
}: {
  label: string;
  value: string;
  accent?: 'ivory' | 'brass' | 'success' | 'danger';
}) {
  const valueClass =
    accent === 'brass'
      ? 'text-[var(--brass-bright)]'
      : accent === 'success'
        ? 'text-[var(--poker-success)]'
        : accent === 'danger'
          ? 'text-[var(--poker-danger)]'
          : 'text-[var(--ivory)]';
  return (
    <div className="flex flex-col items-start">
      <span className="text-[10px] uppercase tracking-wider text-[var(--ivory-muted)]">
        {label}
      </span>
      <span className={`font-numeric text-base font-semibold mt-0.5 ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}

/** 相对时间格式化（紧凑形式：今天/昨天/N 天前/N 周前/N 月前） */
function formatRelative(
  timestamp: number,
  t: (key: string, options?: Record<string, number>) => string,
): string {
  const diff = Date.now() - timestamp;
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return t('dashboard.recentTraining.justNow');
  if (diff < 2 * day) return t('dashboard.recentTraining.yesterday');
  if (diff < 7 * day) return t('dashboard.recentTraining.daysAgo', { n: Math.floor(diff / day) });
  if (diff < 30 * day) return t('dashboard.recentTraining.weeksAgo', { n: Math.floor(diff / (7 * day)) });
  if (diff < 365 * day) return t('dashboard.recentTraining.monthsAgo', { n: Math.floor(diff / (30 * day)) });
  return t('dashboard.recentTraining.yearsAgo', { n: Math.floor(diff / (365 * day)) });
}
