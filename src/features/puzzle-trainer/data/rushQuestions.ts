/**
 * Puzzle Rush 模式题库：按难度递增排序。
 *
 * 前 5 题简单（difficulty 1）→ 中间中等（difficulty 2）→ 后面较难（difficulty 3）。
 * 让用户在前段建立信心，后段挑战极限。
 */
import type { PuzzleQuestion } from '../types';
import { getAllPuzzles } from './puzzleBank';
import { getDateSeed, shuffleBySeed } from '../utils/dateSeed';

/**
 * 获取 Puzzle Rush 题目序列。
 *
 * @param count 题目数量（默认 30）
 * @param date 用于种子化打乱顺序（默认今天）
 */
export function getRushQuestions(count: number = 30, date: Date = new Date()): PuzzleQuestion[] {
  const allQuestions = getAllPuzzles();
  const seed = getDateSeed(date);

  const easy = allQuestions.filter((q) => q.difficulty === 1);
  const medium = allQuestions.filter((q) => q.difficulty === 2);
  const hard = allQuestions.filter((q) => q.difficulty === 3);

  // 用种子打乱每个难度段，保证同一天顺序一致
  const shuffledEasy = shuffleBySeed(easy, seed);
  const shuffledMedium = shuffleBySeed(medium, seed + 1);
  const shuffledHard = shuffleBySeed(hard, seed + 2);

  // 前 5 题简单 → 中间中等 → 后面较难
  const ordered = [...shuffledEasy, ...shuffledMedium, ...shuffledHard];
  return ordered.slice(0, Math.min(count, ordered.length));
}

/**
 * Puzzle Rush 默认时长选项（毫秒）。
 */
export const RUSH_DURATIONS = {
  threeMinutes: 3 * 60 * 1000, // 180000
  fiveMinutes: 5 * 60 * 1000, // 300000
} as const;

/** Puzzle Rush 初始命数 */
export const RUSH_INITIAL_LIVES = 3;

/** 连对奖励阈值（连对 N 题奖励时间） */
export const RUSH_STREAK_THRESHOLD = 5;

/** 连对奖励时间（毫秒） */
export const RUSH_STREAK_BONUS = 10 * 1000; // +10 秒
