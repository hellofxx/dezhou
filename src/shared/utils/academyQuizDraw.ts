/** 两院共用的按尝试次数抽题（纯函数）。 */
import { hashStringToSeed, shuffleBySeed } from './seededShuffle';

export interface DrawByAttemptOptions {
  /** 稳定键：理论用 chapterId，策略用 lessonId / Level 键。 */
  key: string;
  /** 本次作答序号（首次 = 1）；由持久化 attempts + 1 得出。 */
  attemptNumber: number;
  /** 期望题量；超过题池时全量返回。 */
  size: number;
}

/** 抽题种子：同 key + 同 attempt 稳定，不同 attempt 换题。 */
export function getAttemptSeed(key: string, attemptNumber: number): number {
  return hashStringToSeed(`${key}#${attemptNumber}`);
}

export function drawByAttempt<T extends { id: string }>(
  items: readonly T[],
  { key, attemptNumber, size }: DrawByAttemptOptions,
): T[] {
  if (items.length === 0) return [];
  const shuffled = shuffleBySeed(items, getAttemptSeed(key, attemptNumber));
  return shuffled.slice(0, Math.min(Math.max(size, 1), shuffled.length));
}
