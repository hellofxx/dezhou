/**
 * 日期种子算法：同一天返回相同种子，相同种子生成相同题目序列。
 *
 * 用于"每日谜题"模式：保证所有用户同一天看到相同的题目集（仅顺序与抽取固定）。
 *
 * 注：seededRandom / shuffleBySeed / hashStringToSeed 已上移至
 * @/shared/utils/seededShuffle（供多模块复用），此处 re-export 以保持
 * 模块内既有 import 路径不变。
 */
import { seededRandom, shuffleBySeed } from '@/shared/utils/seededShuffle';

export {
  seededRandom,
  shuffleBySeed,
  hashStringToSeed,
} from '@/shared/utils/seededShuffle';

/**
 * 将日期转换为 YYYYMMDD 数字种子。
 * 例：2026-07-25 → 20260725
 */
export function getDateSeed(date: Date = new Date()): number {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return parseInt(`${y}${m}${d}`, 10);
}

/**
 * 基于种子从数组中抽取 N 个不重复元素。
 * 若 count 大于数组长度，返回打乱后的全数组。
 */
export function pickBySeed<T>(arr: readonly T[], count: number, seed: number): T[] {
  const shuffled = shuffleBySeed(arr, seed);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * 基于种子生成 100-999 之间的整数（用于"今日已有 XXX 人完成"模拟）。
 */
export function getDailyCompletionCount(date: Date = new Date()): number {
  const seed = getDateSeed(date);
  const rng = seededRandom(seed + 7919); // 偏移以避免与其他用途耦合
  return 100 + Math.floor(rng() * 900);
}
