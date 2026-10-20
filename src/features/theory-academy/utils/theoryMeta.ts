import type { PokerVariant } from '@/shared/types/elo';
import {
  ALL_VARIANT_LEVEL_SUMMARIES,
  HEADS_UP_LEVEL_SUMMARIES,
  SHORT_DECK_LEVEL_SUMMARIES,
  STANDARD_LEVEL_SUMMARIES,
} from '../data/levels/manifest';
import type { TheoryChapterSummary, TheoryLevelSummary } from '../types';

/**
 * 理论学院目录层查询（不含章节正文）。
 * 首页、store、成就检查与 i18n/内容包调度只依赖本模块；
 * 需要 content/quiz 的章节页仍走 utils/theoryProgress 的完整数据版本。
 */

const LEVELS_BY_VARIANT: Record<PokerVariant, TheoryLevelSummary[]> = {
  standard: STANDARD_LEVEL_SUMMARIES,
  'short-deck': SHORT_DECK_LEVEL_SUMMARIES,
  'heads-up': HEADS_UP_LEVEL_SUMMARIES,
};

const LEVEL_BY_ID = new Map(ALL_VARIANT_LEVEL_SUMMARIES.map((level) => [level.id, level]));
const CHAPTER_BY_ID = new Map<string, TheoryChapterSummary>();
const LEVEL_BY_CHAPTER_ID = new Map<string, TheoryLevelSummary>();
const CHAPTERS_BY_VARIANT = new Map<PokerVariant, TheoryChapterSummary[]>();

for (const level of ALL_VARIANT_LEVEL_SUMMARIES) {
  for (const chapter of level.chapters) {
    CHAPTER_BY_ID.set(chapter.id, chapter);
    LEVEL_BY_CHAPTER_ID.set(chapter.id, level);
  }
}

for (const [variant, levels] of Object.entries(LEVELS_BY_VARIANT) as [
  PokerVariant,
  TheoryLevelSummary[],
][]) {
  CHAPTERS_BY_VARIANT.set(
    variant,
    levels.flatMap((level) => level.chapters),
  );
}

export function getLevelSummariesByVariant(variant: PokerVariant): TheoryLevelSummary[] {
  return LEVELS_BY_VARIANT[variant];
}

export function findLevelSummaryById(levelId: string): TheoryLevelSummary | undefined {
  return LEVEL_BY_ID.get(levelId);
}

export function findChapterSummaryById(chapterId: string): TheoryChapterSummary | undefined {
  return CHAPTER_BY_ID.get(chapterId);
}

export function findLevelSummaryByChapterId(chapterId: string): TheoryLevelSummary | undefined {
  return LEVEL_BY_CHAPTER_ID.get(chapterId);
}

/** 章节 id → 变体；未知前缀回退 standard（与数据命名契约 t<n><sd|hu>- 对齐） */
export function inferVariantFromChapterId(chapterId: string): PokerVariant {
  if (/^t\d+sd-/.test(chapterId)) return 'short-deck';
  if (/^t\d+hu-/.test(chapterId)) return 'heads-up';
  return 'standard';
}

/** 当前变体的扁平章节目录（不复制完整章节对象） */
export function getChapterSummariesByVariant(
  variant: PokerVariant,
): readonly TheoryChapterSummary[] {
  return CHAPTERS_BY_VARIANT.get(variant) ?? [];
}

/**
 * 获取指定 Level 所属变体的完整 Level 序列。
 * 找不到时回退标准序列（防御）。
 */
function getLevelSequence(levelId: string): TheoryLevelSummary[] {
  const level = LEVEL_BY_ID.get(levelId);
  if (!level) return STANDARD_LEVEL_SUMMARIES;
  return LEVELS_BY_VARIANT[level.variant];
}

/** 获取所有章节的目录摘要（仅标准系列，保持与旧 getAllChapters 口径一致） */
export function getAllChapterSummaries(): TheoryChapterSummary[] {
  return [...(CHAPTERS_BY_VARIANT.get('standard') ?? [])];
}

/** 根据章节 id 查找下一章（同变体序列内顺延，目录层） */
export function getNextChapterSummary(
  currentChapterId: string,
): TheoryChapterSummary | undefined {
  const level = LEVEL_BY_CHAPTER_ID.get(currentChapterId);
  if (!level) return undefined;
  const chapters = getChapterSummariesByVariant(level.variant);
  const idx = chapters.findIndex((chapter) => chapter.id === currentChapterId);
  if (idx === -1 || idx >= chapters.length - 1) return undefined;
  return chapters[idx + 1];
}

/** 获取总章节数（按变体；默认标准系列） */
export function getTotalChapterCount(variant?: PokerVariant): number {
  const levels = variant ? LEVELS_BY_VARIANT[variant] : STANDARD_LEVEL_SUMMARIES;
  return levels.reduce((sum, level) => sum + level.chapters.length, 0);
}

/**
 * 章节难度映射（供 progress.updateElo 的 difficulty 参数，0-1）：
 * T1≈0.2 逐级递增至 T9≈0.8，与其他训练模块的难度口径一致。
 */
export function getChapterDifficulty(level: number): number {
  return Math.min(0.8, Math.max(0.2, 0.2 + (level - 1) * 0.075));
}

/**
 * 判断 Level 是否按顺序解锁（纯函数）。
 * 变体 Level 的解锁链在变体自己的 Level 序列内判定：
 * 序列内 idx=0 恒解锁，Tn 需前一 Level 全部章节完成。
 */
export function isLevelUnlockedByCompleted(
  levelId: string,
  completedChapters: string[],
): boolean {
  const sequence = getLevelSequence(levelId);
  const idx = sequence.findIndex((level) => level.id === levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const previous = sequence[idx - 1];
  if (!previous) return false;
  return previous.chapters.every((chapter) => completedChapters.includes(chapter.id));
}

/** 判断某 Level 是否全部章节完成（支持所有变体） */
export function isLevelFullyCompleted(
  levelId: string,
  completedChapters: string[],
): boolean {
  const level = LEVEL_BY_ID.get(levelId);
  if (!level || level.chapters.length === 0) return false;
  return level.chapters.every((chapter) => completedChapters.includes(chapter.id));
}
