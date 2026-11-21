import { lazy, Suspense, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Gamepad2, Target, Trophy } from 'lucide-react';
import { ComponentSkeleton } from '@/shared/components/feedback/LoadingState';
import { useProgress } from '../../hooks/useProgress';
import { useProgressStore } from '../../store';
import { DIFFICULTY_THRESHOLDS } from '../../constants';
import { aggregateByDay } from '../../utils/statsAggregator';
import { getTrainingCalendar } from '../../utils/streakCalc';
import { ACHIEVEMENTS } from '../../data/achievements';
import ModuleStatsPanel from '../dashboard/ModuleStatsPanel';
import StreakTracker from '../streak/StreakTracker';
import DifficultyIndicator from '../stats/DifficultyIndicator';
import { VariantEloOverview } from '../stats/VariantEloOverview';
import DailyChallenge from '../achievement/DailyChallenge';
import AchievementWall from '../achievement/AchievementWall';
import MoodTracker from '../settings/MoodTracker';
import ProgressHero from './ProgressHero';

const LazyAccuracyChart = lazy(() => import('../dashboard/AccuracyChart'));
const LazyWeaknessAnalysis = lazy(() => import('../stats/WeaknessAnalysis'));

/**
 * ProgressOverview — 进度中心「概览」页。
 *
 * 内容 = 原 ProgressPage 主体（Hero / 难度阶梯 / 模块明细 / 趋势 / 雷达 / 模块入口）
 *      + 从下线首页 Dashboard 平移过来的变体 ELO、成就入口、情绪标记、今日任务。
 * 每个区块只读 progress store（模块内合法）；跨模块展示一律走链接，不 import 别的模块组件。
 */
export default function ProgressOverview() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { summary, moduleStats, records } = useProgress();

  const unlockedAchievements = useProgressStore((s) => s.unlockedAchievements);
  const achievementUnlockDates = useProgressStore((s) => s.achievementUnlockDates);
  const [achievementWallOpen, setAchievementWallOpen] = useState(false);

  const dailyStats = useMemo(() => aggregateByDay(records, 14), [records]);

  const now = new Date();
  const calendarData = useMemo(
    () => getTrainingCalendar(records, now.getMonth(), now.getFullYear()),
    [records, now.getMonth(), now.getFullYear()],
  );

  // Determine difficulty based on overall stats（阈值单源：DIFFICULTY_THRESHOLDS）
  const difficulty = useMemo<'beginner' | 'intermediate' | 'advanced'>(() => {
    if (summary.overallAccuracy > DIFFICULTY_THRESHOLDS.advanced) return 'advanced';
    if (summary.overallAccuracy > DIFFICULTY_THRESHOLDS.intermediate) return 'intermediate';
    return 'beginner';
  }, [summary.overallAccuracy]);

  // 最近解锁的成就（成就入口卡片的副标题）
  const latestAchievement = useMemo(() => {
    if (unlockedAchievements.length === 0) return null;
    const sorted = [...unlockedAchievements].toSorted(
      (a, b) => (achievementUnlockDates[b] ?? 0) - (achievementUnlockDates[a] ?? 0),
    );
    const id = sorted[0];
    return id ? ACHIEVEMENTS.find((achievement) => achievement.id === id) ?? null : null;
  }, [unlockedAchievements, achievementUnlockDates]);

  return (
    <>
      {/* 签名元素：战绩牌匾 Hero（段位 + 四项核心指标） */}
      <ProgressHero summary={summary} />

      {/* 难度阶梯（全宽横条） */}
      <DifficultyIndicator
        currentDifficulty={difficulty}
        accuracy={summary.overallAccuracy}
        sessionsCount={summary.totalSessions}
      />

      {/* 各模块统计明细（四项核心指标已并入上方 ProgressHero，不再重复） */}
      <ModuleStatsPanel moduleStats={moduleStats} />

      {/* 趋势图 + 打卡日历（2:1） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Suspense fallback={<div className="min-h-[260px]"><ComponentSkeleton /></div>}>
            <LazyAccuracyChart dailyStats={dailyStats} days={14} />
          </Suspense>
        </div>
        <div>
          <StreakTracker
            currentStreak={summary.currentStreak}
            longestStreak={summary.longestStreak}
            calendarData={calendarData}
          />
        </div>
      </div>

      {/* 五维能力雷达图（2）+ 模块统计入口（1） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <Suspense fallback={<div className="min-h-[300px]"><ComponentSkeleton /></div>}>
            <LazyWeaknessAnalysis />
          </Suspense>
        </div>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate('/progress/range')}
            className="flex-1 w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--brass)]/10 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-[var(--brass-text)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--ivory)]">
                  {t('progress.moduleEntry.rangeTitle')}
                </div>
                <div className="text-xs text-[var(--ivory-dim)]">
                  {t('progress.moduleEntry.rangeDesc')}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" aria-hidden="true" />
            </div>
          </button>
          <button
            type="button"
            onClick={() => navigate('/progress/gto')}
            className="flex-1 w-full text-left rounded-[var(--radius)] border border-[var(--walnut-border)] bg-[var(--surface)] p-4 hover:border-[var(--brass)]/30 hover:bg-[var(--walnut-border)]/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--ivory-dim)]/10 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5 text-[var(--ivory-muted)]" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--ivory)]">
                  {t('progress.moduleEntry.gtoTitle')}
                </div>
                <div className="text-xs text-[var(--ivory-dim)]">
                  {t('progress.moduleEntry.gtoDesc')}
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--ivory-dim)]" aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>

      {/* 变体 ELO 概览 + 成就入口（双列） */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <VariantEloOverview />
        <button
          type="button"
          onClick={() => setAchievementWallOpen(true)}
          className="hover-bright panel flex items-center gap-4 p-5 text-left transition-all cursor-pointer"
          style={{ borderLeft: '3px solid var(--brass)' }}
        >
          <div className="shrink-0" aria-hidden="true">
            {latestAchievement?.icon ?? <Trophy size={32} className="text-[var(--brass-text)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-[15px] text-[var(--ivory)] tracking-wide">
              {t('achievements.title')}
            </div>
            <div className="text-xs text-[var(--ivory-muted)] mt-1 line-clamp-2">
              {latestAchievement
                ? `${t('achievements.newUnlock')}：${t(latestAchievement.title)}`
                : t('achievements.progress', {
                    current: unlockedAchievements.length,
                    total: ACHIEVEMENTS.length,
                  })}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="font-numeric text-sm text-[var(--brass-bright)]">
              {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
            <ArrowRight className="w-4 h-4 text-[var(--ivory-muted)]" aria-hidden="true" />
          </div>
        </button>
      </div>

      {/* 今日任务 + 今日情绪（2:1） */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2">
          <DailyChallenge />
        </div>
        <div>
          <MoodTracker />
        </div>
      </div>

      <AchievementWall open={achievementWallOpen} onOpenChange={setAchievementWallOpen} />
    </>
  );
}
