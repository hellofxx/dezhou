import { THEORY_LEVELS } from '../data/levels';
import type { TheoryChapter, TheoryLevelInfo } from '../types';

/** 获取所有章节的扁平化列表（按 Level 与 order 排列） */
export function getAllChapters(): TheoryChapter[] {
  return THEORY_LEVELS.flatMap((level) => level.chapters);
}

/** 根据 ID 查找章节 */
export function findChapterById(chapterId: string): TheoryChapter | undefined {
  return getAllChapters().find((c) => c.id === chapterId);
}

/** 根据章节 ID 查找所属 Level */
export function findLevelByChapterId(chapterId: string): TheoryLevelInfo | undefined {
  return THEORY_LEVELS.find((level) => level.chapters.some((c) => c.id === chapterId));
}

/** 获取下一章（跨 Level 顺延；无下一章返回 undefined） */
export function getNextChapter(currentChapterId: string): TheoryChapter | undefined {
  const all = getAllChapters();
  const idx = all.findIndex((c) => c.id === currentChapterId);
  if (idx === -1 || idx >= all.length - 1) return undefined;
  return all[idx + 1];
}

/** 获取总章节数 */
export function getTotalChapterCount(): number {
  return THEORY_LEVELS.reduce((sum, level) => sum + level.chapters.length, 0);
}

/**
 * 章节难度映射（供 progress.updateElo 的 difficulty 参数，0-1）：
 * T1≈0.2 逐级递增至 T9≈0.8，与其他训练模块的难度口径一致。
 */
export function getChapterDifficulty(level: number): number {
  return Math.min(0.8, Math.max(0.2, 0.2 + (level - 1) * 0.075));
}

/**
 * 判断 Level 是否按顺序解锁（纯函数：T1 恒解锁，Tn 需 T(n-1) 全部章节完成）。
 * store.isTheoryLevelUnlocked 委托本函数（另加调试解锁旁路）；
 * TheoryChapterView 的「下一章」导航渲染前校验（P1F-02）亦复用，避免口径分叉。
 */
export function isLevelUnlockedByCompleted(levelId: string, completedChapters: string[]): boolean {
  const idx = THEORY_LEVELS.findIndex((l) => l.id === levelId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  const prev = THEORY_LEVELS[idx - 1];
  if (!prev) return false;
  return prev.chapters.every((c) => completedChapters.includes(c.id));
}

/** 判断某 Level 是否全部章节完成 */
export function isLevelFullyCompleted(levelId: string, completedChapters: string[]): boolean {
  const level = THEORY_LEVELS.find((l) => l.id === levelId);
  if (!level || level.chapters.length === 0) return false;
  return level.chapters.every((c) => completedChapters.includes(c.id));
}
