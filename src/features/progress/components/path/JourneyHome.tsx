import { useMemo, useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gamepad2 } from 'lucide-react';
import { useProgress } from '../../hooks/useProgress';
import { useProgressStore } from '../../store';
import { useAcademyProgressSnapshot } from '../../hooks/useAcademyDataSource';
import DailyTrainingPlan from '../training/DailyTrainingPlan';
import SpacedRepetitionPanel from '../srs/SpacedRepetitionPanel';
import ReviewSession from '../srs/ReviewSession';
import { useEnsureReviewSourceI18n } from '../srs/useEnsureReviewSourceI18n';
import ModuleGrid from '../dashboard/ModuleGrid';
import { generateCrossModuleDailyPlan } from '../../utils/dailyTrainingPlan';
import { useTheoryPlanRevision } from '../../hooks/useTheoryPlanRevision';
import { getTodayReviewItems, getTodayString } from '@/shared/utils/spacedRepetition';
import RankUpCelebration from '../celebration/RankUpCelebration';
import DownswingAlert from '../gate/DownswingAlert';
import FeltArena from '../training/FeltArena';
import StreakRail from '../streak/StreakRail';
import QuickDrillBanner from './QuickDrillBanner';
import JourneyTrack from './JourneyTrack';

/**
 * JourneyHome — 学习路径首页（批次 2，替换旧仪表盘 Dashboard）。
 *
 * 首屏顺序：牌桌 Hero → 连续天数 → 速训横幅 → 学习旅程图 → 今日计划 + 间隔复习
 * → 首访引导（仅零训练）→ 下风警示 → 训练场（新手期收敛为单一学习路径卡）。
 *
 * 本批把「回顾型」大盘（每日挑战 / 多变体 ELO / 成就墙 / 进步回放 / 情绪 / 最近训练）
 * 从首页移出（文件保留，批次 3 迁入 /progress），首页只保留「今天该学什么」。
 * 保留的跨模块装配：每日推荐（theory revision 自愈）、复习项 i18n 预加载、
 * 复习 Dialog、段位庆祝、新手收敛。
 */
export default function JourneyHome() {
  const { t } = useTranslation();
  const { summary, records } = useProgress();
  const academyProgress = useAcademyProgressSnapshot();

  const reviewItems = useProgressStore((s) => s.reviewItems);
  const dismissedRecommendations = useProgressStore((s) => s.dismissedRecommendations);
  const lastDismissalDate = useProgressStore((s) => s.lastDismissalDate);
  const dismissRecommendation = useProgressStore((s) => s.dismissRecommendation);
  const clearDailyDismissals = useProgressStore((s) => s.clearDailyDismissals);

  const eloRankUp = useProgressStore((s) => s.eloRankUp);
  const clearEloRankUp = useProgressStore((s) => s.clearEloRankUp);

  const [reviewSessionOpen, setReviewSessionOpen] = useState(false);
  const openReviewSession = useCallback(() => setReviewSessionOpen(true), []);

  // 每日重置跳过的推荐
  useEffect(() => {
    const today = getTodayString();
    if (lastDismissalDate !== today) {
      clearDailyDismissals();
    }
  }, [lastDismissalDate, clearDailyDismissals]);

  // 今日待复习项
  const todayReviewItems = useMemo(() => getTodayReviewItems(reviewItems), [reviewItems]);

  // PRD §12.4.3 配对要求：复习态存的是 i18n key，渲染前须确保来源包就绪。
  useEnsureReviewSourceI18n(todayReviewItems);

  // 生成每日推荐（theoryRevision：理论数据源晚注册 / 理论进度变化时重算）
  const theoryRevision = useTheoryPlanRevision();
  const recommendations = useMemo(() => {
    const allRecommendations = generateCrossModuleDailyPlan(
      academyProgress.completedLessons,
      records,
      reviewItems,
      summary.currentStreak,
    );
    return allRecommendations.filter((r) => !dismissedRecommendations.includes(r.id));
  }, [
    academyProgress,
    records,
    reviewItems,
    summary.currentStreak,
    dismissedRecommendations,
    theoryRevision,
  ]);

  return (
    <div className="home-room h-full overflow-auto">
      <div className="home-hero-deck">
        <FeltArena />
        <StreakRail />
      </div>

      <div className="px-0">
        <QuickDrillBanner />

        <JourneyTrack />

        {/* 今日计划（主）+ 今日复习（次） */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5" style={{ gridAutoRows: '1fr' }}>
          <div className="lg:col-span-2 h-full">
            <DailyTrainingPlan
              recommendations={recommendations}
              onDismiss={dismissRecommendation}
            />
          </div>
          <div className="h-full">
            <SpacedRepetitionPanel
              reviewItems={reviewItems}
              todayItems={todayReviewItems}
              onStartReview={openReviewSession}
            />
          </div>
        </div>

        <DownswingAlert />

        {/* 训练场 — 对照基准图：始终展示六模块网格（学习路径由旅程面板承担） */}
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
      </div>

      {/* Dialogs */}
      <RankUpCelebration rankUp={eloRankUp} onClose={clearEloRankUp} />
      <ReviewSession
        open={reviewSessionOpen}
        onOpenChange={setReviewSessionOpen}
        initialItems={todayReviewItems}
      />
    </div>
  );
}
