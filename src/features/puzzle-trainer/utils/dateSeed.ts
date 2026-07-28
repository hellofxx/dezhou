/**
 * 日期种子算法：同一天返回相同种子，相同种子生成相同题目序列。
 *
 * 用于"每日谜题"模式：保证所有用户同一天看到相同的题目集（仅顺序与抽取固定）。
 */

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
 * 基于种子的伪随机数生成器（mulberry32 算法）。
 * 返回一个函数，每次调用返回 [0, 1) 之间的伪随机数。
 *
 * 同一种子始终产生相同序列。
 */
export function seededRandom(seed: number): () => number {
  // 处理负数与 0 的情况，确保种子有效
  let state = seed >>> 0;
  if (state === 0) state = 0x9e3779b9; // 黄金比例常数作为后备
  return function () {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
 * Fisher–Yates 基于种子的洗牌（不修改原数组）。
 */
export function shuffleBySeed<T>(arr: readonly T[], seed: number): T[] {
  if (arr.length <= 1) return [...arr];
  const rng = seededRandom(seed);
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * 基于种子生成 100-999 之间的整数（用于"今日已有 XXX 人完成"模拟）。
 */
export function getDailyCompletionCount(date: Date = new Date()): number {
  const seed = getDateSeed(date);
  const rng = seededRandom(seed + 7919); // 偏移以避免与其他用途耦合
  return 100 + Math.floor(rng() * 900);
}
