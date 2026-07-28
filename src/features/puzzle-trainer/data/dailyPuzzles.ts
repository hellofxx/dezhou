/**
 * 每日谜题：基于日期种子从全题库抽取固定题目。
 *
 * 同一天所有用户看到相同的 8 道题（顺序也固定）。
 */
import type { PuzzleQuestion } from '../types';
import { getAllPuzzles } from './puzzleBank';
import { getDateSeed, pickBySeed } from '../utils/dateSeed';

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

/**
 * 获取今日日期 key（YYYY-MM-DD），用于持久化完成状态。
 */
export function getDailyKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
