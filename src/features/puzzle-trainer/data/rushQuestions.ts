/**
 * Puzzle Rush 模式题库：按难度递增排序。
 *
 * 前段简单（difficulty 1）→ 中段中等（difficulty 2）→ 后段较难（difficulty 3）。
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

  // 用种子打乱每个难度段，保证同一天顺序一致
  const easy = shuffleBySeed(allQuestions.filter((q) => q.difficulty === 1), seed);
  const medium = shuffleBySeed(allQuestions.filter((q) => q.difficulty === 2), seed + 1);
  const hard = shuffleBySeed(allQuestions.filter((q) => q.difficulty === 3), seed + 2);

  // P1D-01 修复：分段配比切片（约各 1/3）实现难度递增 1→2→3。
  // 旧实现 [...easy,...medium,...hard].slice(0,count) 在 easy 题量 ≥ count 时
  // 输出全为难度 1，"难度递增"完全失效。
  const easyTarget = Math.ceil(count / 3);
  const mediumTarget = Math.ceil(count / 3);
  const hardTarget = Math.max(0, count - easyTarget - mediumTarget);

  const picked = [
    ...easy.slice(0, easyTarget),
    ...medium.slice(0, mediumTarget),
    ...hard.slice(0, hardTarget),
  ];

  // 某难度段题量不足时，从剩余题目补齐（不改变配比设计，仅兜底）
  if (picked.length < count) {
    const usedIds = new Set(picked.map((q) => q.id));
    const rest = [...easy, ...medium, ...hard].filter((q) => !usedIds.has(q.id));
    picked.push(...rest.slice(0, count - picked.length));
  }

  // 稳定排序保证最终难度非降序（段内保持种子洗牌顺序）
  picked.sort((a, b) => a.difficulty - b.difficulty);
  return picked.slice(0, Math.min(count, picked.length));
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
