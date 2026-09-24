/**
 * 每日谜题：基于日期种子从全题库抽取固定题目。
 *
 * 同一天所有用户看到相同的 8 道题（顺序也固定）。
 */
import type { PuzzleQuestion } from '../types';
import { getAllPuzzles } from './puzzleBank';
import { getDateSeed, pickBySeed } from '../utils/dateSeed';

// getDailyKey 已迁至 utils/dateSeed（纯日期函数，不应携带题库依赖），此处 re-export 保持既有 import 路径兼容
export { getDailyKey } from '../utils/dateSeed';

/** 每日谜题数量 */
export const DAILY_PUZZLE_COUNT = 8;

/**
 * 基于日期种子从全题库抽取 8 题（混合主题，难度均衡）。
 * 同一天返回的题目与顺序固定。
 */
export function getDailyPuzzles(date: Date = new Date()): PuzzleQuestion[] {
  const seed = getDateSeed(date);
  const allQuestions = getAllPuzzles();
  return pickBySeed(allQuestions, DAILY_PUZZLE_COUNT, seed);
}
