/**
 * SM-2 简化间隔重复算法
 * 用于管理知识点复习队列
 */

// P1-3: 复习项附加元数据，用于复习模式渲染原题内容（front/back/options）
// 所有字段可选，老数据无 metadata 仍能正常工作（复习模式回退到自评 UI）
export interface ReviewItemMetadata {
  front?: string;                          // 问题文本（如 "AKs 在 BTN 该如何行动？"）
  back?: string;                           // 答案文本（如 "raise"）
  options?: Array<{                        // 选择题选项（如有则复习模式渲染为选择题）
    text: string;
    isCorrect: boolean;
    explanation?: string;
  }>;
  source?: 'range' | 'odds' | 'gto' | 'strategy';  // 来源模块
  scenario?: string;                       // 场景描述（如 pot-odds 的 scenario 文本）
  /** i18n 插值参数：front/options.text 为带 {{var}} 的 key 时透传给 t() */
  params?: Record<string, string | number>;
}

// 知识点复习项
export interface ReviewItem {
  id: string;                    // lessonId 或 quizQuestionId
  label: string;                 // 显示名称如 "位置的力量"
  category: string;              // "strategy" | "range" | "odds" | "gto"
  easeFactor: number;            // 难度因子，初始 2.5
  interval: number;              // 当前间隔（天）
  repetitions: number;           // 连续正确次数
  nextReviewDate: string;        // YYYY-MM-DD 下次复习日期
  lastReviewedAt?: number;       // 上次复习时间戳
  metadata?: ReviewItemMetadata; // P1-3: 复习模式渲染用的附加元数据
}

// 间隔序列：1 → 3 → 7 → 14 → 30 天
const INTERVAL_SEQUENCE = [1, 3, 7, 14, 30];

// 默认难度因子
const DEFAULT_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

/** 快答阈值（秒）：答对且用时低于该值视为"完美记忆"（quality 5）。
 * 单点事实源，供各 trainer SRS 记录器与 QuickDrill 复用，避免各处硬编码 5000ms。 */
export const FAST_ANSWER_SECONDS = 5;

/** 本地时区日期格式化 YYYY-MM-DD（与 streakCalc 统一口径，
 * 禁用 toISOString：UTC 日期在 UTC+8 的 00:00-08:00 会比本地日期晚一天，
 * 导致跨日判定错位（今日完成态/每日题量上限/情绪标记选中态））
 * P0B-03：导出供消费方（如 strategy-academy CourseView 计算 nextReviewDate）复用，
 * 避免各处自行 toISOString 造成时区遗漏 */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 获取今天的日期字符串 YYYY-MM-DD（本地时区）
 */
export function getTodayString(): string {
  return toLocalDateString(new Date());
}

/**
 * 计算 N 天后的日期字符串（本地时区）
 */
function getDateAfterDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return toLocalDateString(date);
}

/**
 * 处理一次复习结果
 * @param item 复习项
 * @param quality 回忆质量 0-5（0=完全不记得，5=完美记忆）
 * @returns 更新后的复习项
 */
export function processReview(item: ReviewItem, quality: number): ReviewItem {
  const clampedQuality = Math.max(0, Math.min(5, quality));

  if (clampedQuality >= 3) {
    // 成功回忆，进入下一间隔
    const nextRepetitions = item.repetitions + 1;
    const intervalIndex = Math.min(nextRepetitions - 1, INTERVAL_SEQUENCE.length - 1);
    const baseInterval = INTERVAL_SEQUENCE[intervalIndex]!;

    // 使用难度因子调整间隔
    const adjustedInterval = Math.round(baseInterval * (item.easeFactor / DEFAULT_EASE_FACTOR));

    // 更新难度因子（成功时略微增加）
    const newEaseFactor = Math.min(
      3.0,
      item.easeFactor + (0.1 - (5 - clampedQuality) * (0.08 + (5 - clampedQuality) * 0.02))
    );

    return {
      ...item,
      repetitions: nextRepetitions,
      interval: adjustedInterval,
      easeFactor: newEaseFactor,
      nextReviewDate: getDateAfterDays(adjustedInterval),
      lastReviewedAt: Date.now(),
    };
  } else {
    // 失败，重置间隔为1天，降低 easeFactor
    const newEaseFactor = Math.max(
      MIN_EASE_FACTOR,
      item.easeFactor - 0.2
    );

    return {
      ...item,
      repetitions: 0,
      interval: 1,
      easeFactor: newEaseFactor,
      nextReviewDate: getDateAfterDays(1),
      lastReviewedAt: Date.now(),
    };
  }
}

/**
 * 获取今日待复习项目
 * @param items 所有复习项
 * @returns 今日需要复习的项目
 */
export function getTodayReviewItems(items: ReviewItem[]): ReviewItem[] {
  const today = getTodayString();
  return items
    .filter((item) => item.nextReviewDate <= today)
    .toSorted((a, b) => {
      // 按到期日期排序，最旧的优先
      if (a.nextReviewDate !== b.nextReviewDate) {
        return a.nextReviewDate.localeCompare(b.nextReviewDate);
      }
      // 同一天按难度因子排序，难的优先
      return a.easeFactor - b.easeFactor;
    });
}

/**
 * 初始化一个新的复习项
 * @param id 唯一标识
 * @param label 显示名称
 * @param category 分类
 * @param metadata 可选附加元数据（P1-3：复习模式渲染用 front/back/options/source/scenario）
 * @returns 新的复习项
 */
export function createReviewItem(
  id: string,
  label: string,
  category: string,
  metadata?: ReviewItemMetadata
): ReviewItem {
  return {
    id,
    label,
    category,
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: 0,
    repetitions: 0,
    nextReviewDate: getDateAfterDays(1), // 明天开始复习
    lastReviewedAt: undefined,
    metadata,
  };
}

/**
 * SM-2 quality 映射（统一口径，单位=毫秒）：
 *   答对 + 用时 < FAST_ANSWER_SECONDS → 5（完美记忆）
 *   答对                                         → 4
 *   答错                                         → 1
 * 供各 trainer SRS 记录器复用，取代各自硬编码的 `timeTakenMs < 5000 ? 5 : 4 : 1`。
 */
export function answerQuality(isCorrect: boolean, timeTakenMs: number): number {
  if (!isCorrect) return 1;
  return timeTakenMs < FAST_ANSWER_SECONDS * 1000 ? 5 : 4;
}

/**
 * 在复习队列中查找或创建复习项，并用给定 quality 推进其 SRS 状态（纯函数）。
 * 返回推进后的 ReviewItem 及是否为新建项，由调用方负责写回 store
 * （addReviewItem / updateReviewItem），从而保持本函数为可单测的纯函数。
 *
 * - 已存在：对现有项 processReview(quality)
 * - 不存在：createReviewItem(id, label, category, metadata) 后 processReview(quality)
 *
 * @param reviewItems 现有复习项列表
 * @param id          复习项唯一 id（如 `range:pos:hand` / `odds:id` / `gto:spotKey:hand`）
 * @param label       显示名称
 * @param category    分类（range/odds/gto/strategy）
 * @param metadata    SRS 复习模式渲染用元数据（仅新建项写入）
 * @param quality     回忆质量 0-5（通常由 answerQuality 计算）
 */
export function upsertReviewItem(
  reviewItems: ReviewItem[],
  id: string,
  label: string,
  category: string,
  metadata: ReviewItemMetadata,
  quality: number,
): { item: ReviewItem; isNew: boolean } {
  const existing = reviewItems.find((r) => r.id === id);
  if (existing) {
    return { item: processReview(existing, quality), isNew: false };
  }
  const baseItem = createReviewItem(id, label, category, metadata);
  return { item: processReview(baseItem, quality), isNew: true };
}

/**
 * 根据训练结果更新复习队列
 * @param existingItems 现有复习项
 * @param completedLessonId 完成的课程ID
 * @param lessonTitle 课程标题
 * @param quizScore 测验分数 0-100
 * @returns 更新后的复习队列
 */
export function updateReviewQueue(
  existingItems: ReviewItem[],
  completedLessonId: string,
  lessonTitle: string,
  quizScore: number
): ReviewItem[] {
  const existingItem = existingItems.find((item) => item.id === completedLessonId);

  if (existingItem) {
    // 已存在，根据分数更新复习状态
    // 分数越高，回忆质量越好
    const quality = quizScore >= 90 ? 5 : quizScore >= 75 ? 4 : quizScore >= 60 ? 3 : 2;
    const updatedItem = processReview(existingItem, quality);
    return existingItems.map((item) =>
      item.id === completedLessonId ? updatedItem : item
    );
  } else {
    // 新课程，创建复习项
    const newItem = createReviewItem(completedLessonId, lessonTitle, 'strategy');

    // 根据分数调整首次复习时间
    if (quizScore >= 90) {
      // 高分，可以间隔久一点
      newItem.nextReviewDate = getDateAfterDays(3);
      newItem.interval = 3;
    } else if (quizScore >= 70) {
      // 中等，正常间隔
      newItem.nextReviewDate = getDateAfterDays(1);
      newItem.interval = 1;
    } else {
      // 低分，明天就要复习
      newItem.nextReviewDate = getDateAfterDays(1);
      newItem.interval = 1;
      newItem.easeFactor = 2.2; // 降低难度因子
    }

    return [...existingItems, newItem];
  }
}

/**
 * 获取复习统计信息
 */
export function getReviewStats(items: ReviewItem[]): {
  total: number;
  mastered: number;    // 间隔 >= 14 天视为掌握
  learning: number;    // 正在学习中
  dueToday: number;    // 今日待复习
} {
  const today = getTodayString();
  const mastered = items.filter((item) => item.interval >= 14).length;
  const dueToday = items.filter((item) => item.nextReviewDate <= today).length;

  return {
    total: items.length,
    mastered,
    learning: items.length - mastered,
    dueToday,
  };
}

/**
 * 计算距离上次复习的天数
 */
export function getDaysSinceLastReview(item: ReviewItem): number | null {
  if (!item.lastReviewedAt) return null;
  const diff = Date.now() - item.lastReviewedAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
