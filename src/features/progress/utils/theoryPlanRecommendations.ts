/**
 * 理论学院推荐卡构造（每日训练计划的 theory-review / theory-chapter 分支）。
 *
 * 抽为独立文件的理由：dailyTrainingPlan.ts 已接近 400 行硬上限（line-count-guard），
 * 而理论卡是计划里唯一经 theoryDataSourceRegistry（依赖倒置）查询、且需要互斥去重的一组分支，
 * 独立放置便于按分支单测。
 *
 * 硬约束：progress 禁止 import theory-academy（eslint ALLOWED_CROSS_IMPORTS）。
 * 章节元数据（titleKey / route / estimatedMinutes）一律经注册表取得，本文件只做映射与时间估算。
 */
import { getTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { TheoryChapterMeta } from '@/shared/types/theoryDataSource';
import type { ReviewItem } from '@/shared/utils/spacedRepetition';
import type { TheoryChapterRecommendation, TheoryReviewRecommendation } from './dailyTrainingPlan';

/** 理论复习页路由（理论 SRS 项专用；通用复习卡跳学院页 /academy，理论题不得复用） */
export const THEORY_REVIEW_ROUTE = '/theory/review';

/** 目录层时长缺失（estimatedMinutes = 0）时的兜底阅读时长 */
const FALLBACK_CHAPTER_MINUTES = 10;
/** 单条理论复习项估算时长（分钟）与整卡上限 */
const MINUTES_PER_REVIEW_ITEM = 3;
const MAX_REVIEW_MINUTES = 15;

/**
 * 理论 SRS 项判定：`metadata.source === 'theory'` 为标准载荷
 * （见 theory-academy/utils/theorySrs.ts 语言中立契约）；
 * 老数据可能只有 category === 'theory'（createReviewItem 的 category 位），两者取并集。
 */
export function isTheoryReviewItem(item: ReviewItem): boolean {
  return item.metadata?.source === 'theory' || item.category === 'theory';
}

/**
 * 今日到期理论复习卡。
 * 刻意不渲染题干预览：理论 label 是跨模块 i18n key（theory.quiz.*），
 * 需逐条 t() 且依赖理论内容包，首帧易漏；此处只给条数，避免裸键泄漏（见 recommendationText 说明）。
 */
export function buildTheoryReviewRecommendation(
  dueCount: number,
  isFirstSlot: boolean,
): TheoryReviewRecommendation {
  return {
    id: 'theory-review-today',
    type: 'theory-review',
    title: 'dashboard.dataPlan.titleTheoryReview',
    titleParams: { count: dueCount },
    description: 'dashboard.dataPlan.descTheoryReview',
    descParams: { count: dueCount },
    route: THEORY_REVIEW_ROUTE,
    priority: isFirstSlot ? 'high' : 'medium',
    estimatedTime: `${Math.min(dueCount * MINUTES_PER_REVIEW_ITEM, MAX_REVIEW_MINUTES)} min`,
    reason: 'theoryReview',
  };
}

/**
 * 下一理论章（未注册数据源时返回 null → 计划里不出现该卡，冷启动/懒加载安全）。
 * 消费顺序遵循 shared/types/theoryDataSource.ts 契约：推荐章优先，未实现时回退 findNextChapter。
 * 已注册实现的 getRecommendedChapter 自行读取理论模块实时进度；传入的 completedChapterIds
 * 仅供未实现推荐章的数据源回退使用（progress 侧并不持有理论章节完成态）。
 */
export function findNextTheoryChapter(
  completedChapterIds: readonly string[],
): TheoryChapterMeta | null {
  const source = getTheoryDataSource();
  if (!source) return null;
  return source.getRecommendedChapter?.() ?? source.findNextChapter(completedChapterIds);
}

/**
 * 下一理论章卡。
 * title 直接用注册表的 titleKey（theory.chapterTitle.<id>）并由渲染端以 titleParams.title
 * （数据层中文标题）兜底 —— 与 academy-lesson 卡同口径，见 utils/recommendationText.ts。
 */
export function buildTheoryChapterRecommendation(
  chapter: TheoryChapterMeta,
  isFirstSlot: boolean,
): TheoryChapterRecommendation {
  const hasDuration = chapter.estimatedMinutes > 0;
  const minutes = hasDuration ? chapter.estimatedMinutes : FALLBACK_CHAPTER_MINUTES;
  return {
    id: `theory-chapter-${chapter.chapterId}`,
    type: 'theory-chapter',
    title: chapter.titleKey,
    titleParams: { title: chapter.title },
    // 目录层缺 duration 时不出「约 0 分钟」，改用无时长文案
    description: hasDuration
      ? 'dashboard.dataPlan.descTheoryChapter'
      : 'dashboard.dataPlan.descTheoryChapterNoTime',
    descParams: { minutes },
    route: chapter.route,
    priority: isFirstSlot ? 'high' : 'medium',
    estimatedTime: `${minutes} min`,
    reason: 'theoryChapter',
  };
}
