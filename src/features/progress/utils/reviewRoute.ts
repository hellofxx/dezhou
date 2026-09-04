import type { ReviewItem } from '@/shared/utils/spacedRepetition';

/**
 * 复习项「点击跳转到源模块」路由解析（纯函数，供 SpacedRepetitionPanel 消费）。
 *
 * 提取自 SpacedRepetitionPanel 的内联 switch，目的有二：
 * 1. 可单测（路由映射是跨模块契约，错一个前缀即死链）；
 * 2. 分类新增时集中变更，避免散落在渲染层。
 *
 * 兼容性硬约束：metadata.route 是可选字段，存量复习项可能没有它；
 * 任何分支都不得抛错，未知 category 一律落到策略学院课程页（沿用提取前的 default 行为）。
 */
export function getReviewRoute(item: ReviewItem): string {
  // 复习项自带跳转目标优先（如理论学院错题须跳回其所属章节页，而非策略学院课程页）
  const route = item.metadata?.route;
  if (typeof route === 'string' && route.startsWith('/')) return route;

  switch (item.category) {
    case 'range':
      return '/range-trainer';
    case 'odds':
      return '/pot-odds';
    case 'gto':
      return '/gto-simulator';
    // 理论复习项缺 route 时回退理论学院主页：禁止落到下方 default 拼出 /academy/lesson/theory:... 死链
    case 'theory':
      return '/theory';
    case 'strategy':
    default:
      return `/academy/lesson/${item.id}`;
  }
}
