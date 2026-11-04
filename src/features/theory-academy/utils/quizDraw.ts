import { hashStringToSeed, shuffleBySeed } from '@/shared/utils/seededShuffle';
import type { TheoryChapterAttempt } from '../types';

/**
 * 章末小测抽题出口（题量与抽题确定性治理）。
 *
 * 口径（PRD §5.27.6）：
 * - 每章按 Level 抽固定题量：T1–T3（基础段）5 题，T4–T9（中高级段）6 题；
 * - 抽题种子 = `hash(<chapterId>#<attemptNumber>)`：同一次作答（同一 attemptNumber）结果确定，
 *   不同次作答抽到不同子集（重考换题，避免死记硬背同 5 题）；
 * - 题池不足时全量出战（不重复、不补空），顺序仍按种子洗牌；
 * - `attemptNumber` 唯一事实源是持久化的 `chapterAttempts[chapterId].attempts + 1`，
 *   故「首次 / 练习」判定与抽题在同一次渲染内自洽（不走组件内计时器或本地计数）。
 */

/** 基础段（T1–T3）抽题数量 */
export const QUIZ_DRAW_SIZE_BASIC = 5;
/** 中高级段（T4–T9）抽题数量 */
export const QUIZ_DRAW_SIZE_ADVANCED = 6;

/** 按 Level 取本段题量：T1–T3 → 5，T4–T9 → 6 */
export function getQuizDrawSize(level: number): number {
  return level <= 3 ? QUIZ_DRAW_SIZE_BASIC : QUIZ_DRAW_SIZE_ADVANCED;
}

/** 本次作答序号（首次 = 1）：持久化 attempts + 1 */
export function getChapterAttemptNumber(
  attempts: Record<string, TheoryChapterAttempt> | undefined,
  chapterId: string,
): number {
  return (attempts?.[chapterId]?.attempts ?? 0) + 1;
}

/** 是否首次作答（决定 ELO / recordAnswer / 首次成绩口径） */
export function isFirstChapterAttempt(
  attempts: Record<string, TheoryChapterAttempt> | undefined,
  chapterId: string,
): boolean {
  return (attempts?.[chapterId]?.attempts ?? 0) === 0;
}

/** 抽题种子（导出供测试断言同种子同结果，不参与渲染） */
export function getQuizDrawSeed(chapterId: string, attemptNumber: number): number {
  return hashStringToSeed(`${chapterId}#${attemptNumber}`);
}

export interface QuizDrawOptions {
  chapterId: string;
  /** 本次作答序号（1 起） */
  attemptNumber: number;
  /** 期望题量（按 Level 由 getQuizDrawSize 决定） */
  size: number;
}

/**
 * 从本章题库抽取本次作答的题目子集。
 * 返回按种子洗牌后的顺序（题目顺序本身也随作答变化，不只换子集）。
 */
export function drawQuizQuestions<T extends { id: string }>(
  questions: readonly T[],
  { chapterId, attemptNumber, size }: QuizDrawOptions,
): T[] {
  if (questions.length === 0) return [];
  const shuffled = shuffleBySeed(questions, getQuizDrawSeed(chapterId, attemptNumber));
  return shuffled.slice(0, Math.min(Math.max(size, 1), shuffled.length));
}
