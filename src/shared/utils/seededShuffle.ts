/**
 * 种子洗牌与数值选项排序工具（纯函数集）。
 *
 * 从 puzzle-trainer 的 dateSeed.ts 上移至 shared 层，
 * 供 puzzle-trainer / strategy-academy / pot-odds 等模块复用：
 * - seededRandom / shuffleBySeed / hashStringToSeed：确定性洗牌基础设施
 * - isNumericOptionSet / sortByNumericValue：数值选项集识别与升序排序
 *   （用于"答案位置偏差治理"：数值选项按数值升序展示而非洗牌）
 */

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
 * 将任意字符串哈希为 uint32 种子（FNV-1a 算法，纯函数）。
 *
 * 用于将题目 id 混入日期种子，使每题的选项洗牌互不相同且确定。
 */
export function hashStringToSeed(str: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193); // FNV prime
  }
  return hash >>> 0;
}

/**
 * 判断选项文本是否以数字开头（可选"约"前缀）。
 * 例：'20%'、'8 个（两头顺）'、'约 15 个' → true
 */
const NUMERIC_OPTION_PATTERN = /^约?\s*\d/;

/**
 * 提取文本中第一个数字（支持小数），用于数值排序。
 */
const FIRST_NUMBER_PATTERN = /\d+(?:\.\d+)?/;

/**
 * 判断一组选项文本是否为"纯数值选项集"。
 *
 * 规则：每个文本都匹配 `/^约?\s*\d/`（可选"约"前缀后紧跟数字），
 * 全部匹配才返回 true；空数组返回 false（无从判断，按非数值处理）。
 *
 * 目的：数值选项（outs 数、百分比）应按数值升序展示而非洗牌，
 * 避免答案位置偏差；陈述句选项极少以数字开头，可避免误判。
 */
export function isNumericOptionSet(texts: string[]): boolean {
  if (texts.length === 0) return false;
  return texts.every((text) => NUMERIC_OPTION_PATTERN.test(text));
}

/**
 * 按 getText 返回文本中第一个数字升序排序（稳定，不修改原数组）。
 *
 * - 数字匹配 `/\d+(?:\.\d+)?/`，"约"前缀自然被忽略（只取首个数字）
 * - 无法提取数字的项按 Infinity 处理（排在末尾，保持相对顺序）
 * - 数值相同保持原相对顺序（基于索引的稳定排序）
 */
export function sortByNumericValue<T>(
  items: readonly T[],
  getText: (item: T) => string,
): T[] {
  return items
    .map((item, index) => {
      const match = FIRST_NUMBER_PATTERN.exec(getText(item));
      const value = match ? parseFloat(match[0]) : Infinity;
      return { item, index, value };
    })
    .toSorted((a, b) => a.value - b.value || a.index - b.index)
    .map((entry) => entry.item);
}
