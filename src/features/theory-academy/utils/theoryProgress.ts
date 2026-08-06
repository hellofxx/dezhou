import { THEORY_LEVELS } from '../data/levels';
import { ALL_VARIANT_THEORY_LEVELS, getTheoryLevelsByVariant } from '../data/levels/variants';
import type { TheoryChapter, TheoryLevelInfo } from '../types';
import type { PokerVariant } from '@/shared/types/elo';

/**
 * 获取指定 Level ID 所属变体的完整 Level 序列。
 * 在所有变体中查找，找不到则回退标准序列（防御）。
 */
function getLevelSequence(levelId: string): TheoryLevelInfo[] {
  const level = ALL_VARIANT_THEORY_LEVELS.find((l) => l.id === levelId);
  if (!level) return THEORY_LEVELS;
  return getTheoryLevelsByVariant(level.variant);
}

/** 获取所有章节的扁平化列表（按 Level 与 order 排列，仅标准系列） */
export function getAllChapters(): TheoryChapter[] {
  return THEORY_LEVELS.flatMap((level) => level.chapters);
}

/** 根据 ID 查找章节（支持所有变体） */
export function findChapterById(chapterId: string): TheoryChapter | undefined {
  return ALL_VARIANT_THEORY_LEVELS.flatMap((l) => l.chapters).find((c) => c.id === chapterId);
}

/** 根据章节 ID 查找所属 Level（支持所有变体） */
export function findLevelByChapterId(chapterId: string): TheoryLevelInfo | undefined {
  return ALL_VARIANT_THEORY_LEVELS.find((level) =>
    level.chapters.some((c) => c.id === chapterId),
  );
}

/**
 * 获取下一章：在同一变体序列内顺延。
 * 变体序列内跨 Level 顺延（t1hu 末章 → t2hu 首章）；
 * 不会跨变体顺延；找不到章节时返回 undefined。
 */
export function getNextChapter(currentChapterId: string): TheoryChapter | undefined {
  const level = findLevelByChapterId(currentChapterId);
  if (!level) return undefined;
  const sequence = getLevelSequence(level.id);
  const allChaptersInSequence = sequence.flatMap((l) => l.chapters);
  const idx = allChaptersInSequence.findIndex((c) => c.id === currentChapterId);
  if (idx === -1 || idx >= allChaptersInSequence.length - 1) return undefined;
  return allChaptersInSequence[idx + 1];
}

/** 获取总章节数（按变体；默认标准系列） */
export function getTotalChapterCount(variant?: PokerVariant): number {
  const levels = variant ? getTheoryLevelsByVariant(variant) : THEORY_LEVELS;
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
 * 标准系列行为完全不变。
 */
export function isLevelUnlockedByCompleted(levelId: string, completedChapters: string[]): boolean {
  const sequence = getLevelSequence(levelId);
  const idx = sequence.findIndex((l) => l.id === levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = sequence[idx - 1];
  if (!prev) return false;
  return prev.chapters.every((c) => completedChapters.includes(c.id));
}

/** 判断某 Level 是否全部章节完成（支持所有变体） */
export function isLevelFullyCompleted(levelId: string, completedChapters: string[]): boolean {
  const level = ALL_VARIANT_THEORY_LEVELS.find((l) => l.id === levelId);
  if (!level || level.chapters.length === 0) return false;
  return level.chapters.every((c) => completedChapters.includes(c.id));
}

/**
 * 获取 Level 的学习目标章节（首个未完成章节；全部完成则返回第一章）。
 * TheoryLevelCard 的「继续学习」与 TheoryLearningMap 的节点点击共用此推导，避免口径分叉。
 */
export function getLevelTargetChapter(
  level: TheoryLevelInfo,
  completedChapters: string[],
): TheoryChapter | undefined {
  const firstIncomplete = level.chapters.find((c) => !completedChapters.includes(c.id));
  return firstIncomplete ?? level.chapters[0];
}