/**
 * theory-academy 启动引导：注册成就检查数据源 + 理论数据源。
 * 依赖倒置（P2-2 / P3）：progress store 不动态 import 本模块，
 * 改为本模块向 achievementRegistry / theoryDataSourceRegistry 注册数据源，progress 遍历注册表查询。
 * 由应用入口 import 本文件触发注册（见 src/main.tsx）。
 */
import { registerAchievementSource } from '@/shared/stores/achievementRegistry';
import { registerTheoryDataSource } from '@/shared/stores/theoryDataSourceRegistry';
import type { TheoryChapterMeta } from '@/shared/types/theoryDataSource';
import { useTheoryStore } from './store';
import type { TheoryChapterSummary, TheoryProgress } from './types';
import { findLevelSummaryByChapterId, findNextTheoryChapter, isLevelFullyCompleted } from './utils/theoryMeta';
import { chapterTitleKey } from './utils/titleKeys';

// 成就检查数据源（仅 theory 专用可选方法；academy 类方法返回安全缺省值，T7/B4 idempotency）
registerAchievementSource({
  id: 'theory-academy',
  isLevelLessonsCompleted: () => false,
  getCertifications: () => ({}),
  areAllLevelsCertified: () => false,
  isTrackCompleted: () => false,
  getCompletedChapters: () => useTheoryStore.getState().progress.completedChapters,
  isTheoryLevelFullyCompleted: (level) => {
    const completed = useTheoryStore.getState().progress.completedChapters;
    for (let lv = 1; lv <= level; lv++) {
      if (!isLevelFullyCompleted(`t${lv}`, completed)) return false;
    }
    return true;
  },
});

/** 目录层 duration（如 '12 min'）→ 分钟数；解析失败回落 0 */
function parseEstimatedMinutes(duration: string): number {
  const minutes = Number.parseInt(duration, 10);
  return Number.isFinite(minutes) ? minutes : 0;
}

/** 目录摘要 → registry 元数据（路由字符串在此单点拼接，消费方只跳转不解析） */
function toChapterMeta(chapter: TheoryChapterSummary): TheoryChapterMeta {
  return {
    chapterId: chapter.id,
    // 摘要层只带数字 level，registry 契约要求 't1'–'t9' 形式的 Level id
    levelId: findLevelSummaryByChapterId(chapter.id)?.id ?? `t${chapter.level}`,
    title: chapter.title,
    titleKey: chapterTitleKey(chapter.id),
    route: `/theory/chapter/${chapter.id}`,
    estimatedMinutes: parseEstimatedMinutes(chapter.duration),
  };
}

/**
 * 下一章元数据：理论 store 的完成态是权威来源，调用方列表仅作补充。
 * 每日计划传入的是策略课时 id（非理论章节），不能覆盖理论进度；并集可兼容
 * 持有更新快照的理论侧调用方，且额外 id 在 findNextTheoryChapter 内自然被忽略。
 * 免修 Level / 当前变体等其余口径取 theory store 实时进度。
 */
function findNextChapterMeta(completedChapterIds: readonly string[]): TheoryChapterMeta | null {
  const progress: TheoryProgress = useTheoryStore.getState().progress;
  const completedChapters = [
    ...new Set([...progress.completedChapters, ...completedChapterIds]),
  ];
  const next = findNextTheoryChapter({ ...progress, completedChapters });
  return next ? toChapterMeta(next) : null;
}

// 理论数据源（progress 每日训练计划 / 下一章 CTA 经注册表查询，progress 不 import theory）
registerTheoryDataSource({
  findNextChapter: findNextChapterMeta,
  // v1 的「推荐章」即下一未完成章；ELO 五维反向桥接由理论模块 UI 自行读取 progress ELO 实现
  getRecommendedChapter: () => findNextChapterMeta(useTheoryStore.getState().progress.completedChapters),
  subscribe: (listener) => useTheoryStore.subscribe(listener),
});
