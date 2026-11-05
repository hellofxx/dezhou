import type { EloDimension, EloRating, PokerVariant } from '@/shared/types/elo';
import type { TheoryChapterSummary, TheoryLevelNumber } from '../types';
import {
  getCoreChaptersOfLevel,
  getLevelSummariesByVariant,
  isLevelUnlockedByCompleted,
} from '../utils/theoryMeta';

/**
 * 理论→章节反向桥接（ELO 五维 → 推荐章节）。
 *
 * 纯函数、无副作用：不写 store、不读门禁开关、不 emit 事件（PRD §5.27.2「推荐只展示」）。
 * 数据源只有两个：progress store 的五维 ELO 快照与理论目录摘要（manifest），
 * 因此本文件可被首页同步调用，无需加载任何章节正文。
 *
 * 映射口径（各维度 → 候选 Level，按顺序取首个仍可读的未读核心章）：
 * - math（赔率 / EV / 组合计数）→ T1 / T2 / T4
 * - preflop（位置与起手牌）→ T3 / T4
 * - postflop（范围优势与下注）→ T5 / T6
 * - handReading（读牌）→ T7
 * - mental（情绪与资金）→ T8
 * - 综合薄弱（多维度低分）或 T8 已读完 → T9
 * - 无数据（gamesPlayed = 0）→ T1
 */

/** 推荐原因 key：`theory.recommendation.reason.<key>`（与已落地的 6 个 key 一一对应） */
export type TheoryRecommendationReason = EloDimension | 'fallback';

/** 推荐结果（chapterId 指向目录摘要层，渲染端自行解析标题与路由） */
export interface TheoryChapterRecommendation {
  chapterId: string;
  reason: TheoryRecommendationReason;
  /** 触发推荐的维度；fallback 时缺省 */
  dimension?: EloDimension;
}

export interface TheoryRecommendationInput {
  /** 当前变体的五维 ELO（progress store 的 eloByVariant[variant]） */
  elo: EloRating;
  completedChapters: readonly string[];
  /** 定位测评免修 Level（参与解锁判定，与 store 口径一致） */
  creditLevels?: readonly string[];
  /** v5 宽限解锁 Level（新增核心章前已解锁的 Level） */
  legacyUnlockedLevels?: readonly string[];
  /** 变体序列（缺省 standard；本模块 UI 只在标准变体下展示推荐） */
  variant?: PokerVariant;
}

/** 维度 → 候选 Level（顺序即优先级：先补地基，再补专题） */
const DIMENSION_LEVELS: Record<EloDimension, readonly TheoryLevelNumber[]> = {
  math: [1, 2, 4],
  preflop: [3, 4],
  postflop: [5, 6],
  handReading: [7],
  mental: [8],
};

/** 五维并列比较顺序（同分时取靠前维度，保证结果确定） */
const DIMENSION_ORDER: readonly EloDimension[] = [
  'math',
  'preflop',
  'postflop',
  'handReading',
  'mental',
];

/**
 * 「多维度薄弱」阈值：低于该分数的维度计入综合薄弱。
 * 起始分为 500（DEFAULT_ELO），800 对应玩家已稳定答对中等难度题的水平，
 * 低于此说明该维度尚未形成可靠能力；两个及以上维度同时低于阈值时，
 * 单点补课意义有限，改读 T9 综合章（把各维度串成一条决策链）。
 */
export const MULTI_LOW_ELO_THRESHOLD = 800;

/** 多维度薄弱的最少维度数 */
export const MULTI_LOW_DIMENSION_COUNT = 2;

/** T8 完成后进入 T9 综合（T9 为收束级，没有单维度入口） */
const SYNTHESIS_LEVEL: TheoryLevelNumber = 9;

/** 无进度时（未答过任何题）判定：gamesPlayed 为 0 即无数据 */
export function hasEloData(elo: EloRating): boolean {
  return elo.gamesPlayed > 0;
}

/** 按目录顺序取指定 Level 的首个未读核心章（Level 未解锁时返回 undefined） */
function firstUnreadCoreChapter(
  levelNo: TheoryLevelNumber,
  input: TheoryRecommendationInput,
): TheoryChapterSummary | undefined {
  const levelId = `t${levelNo}`;
  const level = getLevelSummariesByVariant(input.variant ?? 'standard').find(
    (item) => item.id === levelId,
  );
  if (!level) return undefined;
  if (
    !isLevelUnlockedByCompleted(
      levelId,
      input.completedChapters,
      input.creditLevels ?? [],
      input.legacyUnlockedLevels ?? [],
    )
  ) {
    return undefined;
  }
  return getCoreChaptersOfLevel(level).find(
    (chapter) => !input.completedChapters.includes(chapter.id),
  );
}

/** 全序列兜底：首个已解锁 Level 的首个未读核心章（与「继续学习」同口径） */
function firstReachableUnreadChapter(
  input: TheoryRecommendationInput,
): TheoryChapterSummary | undefined {
  for (const level of getLevelSummariesByVariant(input.variant ?? 'standard')) {
    const chapter = firstUnreadCoreChapter(level.level, input);
    if (chapter) return chapter;
  }
  return undefined;
}

/** 候选 Level 序列里首个可读的未读核心章 */
function firstChapterOfLevels(
  levels: readonly TheoryLevelNumber[],
  input: TheoryRecommendationInput,
): TheoryChapterSummary | undefined {
  for (const levelNo of levels) {
    const chapter = firstUnreadCoreChapter(levelNo, input);
    if (chapter) return chapter;
  }
  return undefined;
}

/** T8 核心章是否已全部读完（决定是否进入 T9 综合） */
function isLevelEightCompleted(input: TheoryRecommendationInput): boolean {
  const level = getLevelSummariesByVariant(input.variant ?? 'standard').find(
    (item) => item.id === 't8',
  );
  if (!level) return false;
  const core = getCoreChaptersOfLevel(level);
  if (core.length === 0) return false;
  return core.every((chapter) => input.completedChapters.includes(chapter.id));
}

/** 综合薄弱判定：达到阈值的维度数 ≥ MULTI_LOW_DIMENSION_COUNT */
export function countWeakDimensions(elo: EloRating): number {
  return DIMENSION_ORDER.filter((dimension) => elo[dimension] < MULTI_LOW_ELO_THRESHOLD).length;
}

/**
 * 取最弱维度：分数最低者；同分按 DIMENSION_ORDER 顺序取靠前。
 * 无数据时由调用方短路，本函数始终要求 gamesPlayed > 0。
 */
export function findWeakestDimension(elo: EloRating): EloDimension {
  let weakest: EloDimension = DIMENSION_ORDER[0]!;
  for (const dimension of DIMENSION_ORDER) {
    if (elo[dimension] < elo[weakest]) weakest = dimension;
  }
  return weakest;
}

/**
 * 主入口：五维 ELO → 推荐章节。
 * 返回 null 表示全序列核心章已读完（或目录为空），渲染端据此不渲染推荐卡。
 */
export function getTheoryChapterRecommendation(
  input: TheoryRecommendationInput,
): TheoryChapterRecommendation | null {
  const { elo } = input;

  // 无数据：从 T1 起步（不改写任何解锁状态，T1 本身恒解锁）
  if (!hasEloData(elo)) {
    const chapter = firstChapterOfLevels(DIMENSION_LEVELS.math, input)
      ?? firstReachableUnreadChapter(input);
    return chapter ? { chapterId: chapter.id, reason: 'fallback' } : null;
  }

  // 综合薄弱 / T8 已读完：优先读 T9 综合章（把各维度串成一条决策链）
  const synthesisFirst = isLevelEightCompleted(input)
    || countWeakDimensions(elo) >= MULTI_LOW_DIMENSION_COUNT;
  if (synthesisFirst) {
    const chapter = firstChapterOfLevels([SYNTHESIS_LEVEL], input);
    if (chapter) return { chapterId: chapter.id, reason: 'fallback' };
  }

  // 最弱维度定向补课：该维度候选 Level 全部读完时退到下一候选 Level，
  // 仍无未读章则回到全局下一章（fallback），保证「有未读章就有推荐」。
  const dimension = findWeakestDimension(elo);
  const targeted = firstChapterOfLevels(DIMENSION_LEVELS[dimension], input);
  if (targeted) return { chapterId: targeted.id, reason: dimension, dimension };

  const fallback = firstReachableUnreadChapter(input);
  return fallback ? { chapterId: fallback.id, reason: 'fallback' } : null;
}
