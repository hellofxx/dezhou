/**
 * 选项重排泛型工具 - 答案位置偏差治理
 * 
 * @module shared/utils/quizOrder
 * @description 跨模块复用选项排序逻辑（pot-odds/theory-academy/strategy-academy）
 * @see PRD §5.26 + TDD §5.9 选项排序治理契约
 * @note puzzle-trainer 使用独立的 optionOrder.ts（动作语义排序：消极→激进），不在此合并
 */

import { shuffleBySeed, hashStringToSeed, isNumericOptionSet, sortByNumericValue } from './seededShuffle';

export interface QuizOption {
  id: string;
  text: string;
}

/**
 * 泛型选项重排函数
 * 
 * @param options 选项数组
 * @param seedKey 题目 ID/i18n key 等确定性种子
 * @param mode 'ascending' 数值升序 / 'shuffle' 种子洗牌
 * @param compareValue 用于 ascending 模式的比较函数（可选）
 * @returns 重排后的新数组
 */
export function reorderOptions<T extends QuizOption>(
  options: T[],
  seedKey: string,
  mode: 'ascending' | 'shuffle',
  compareValue?: (opt: T) => number
): T[] {
  
  const texts = options.map((o) => o.text);
  
  // 数值选项集：按数值单调排列（消除位置偏差 + 符合阅读习惯）
  if (mode === 'ascending' && isNumericOptionSet(texts)) {
    return sortByNumericValue(options, compareValue ?? ((o) => extractNumber(o.text)));
  }
  
  // 文字选项集：种子洗牌（同题跨会话一致、不同题分布互异）
  const seed = mode === 'shuffle' ? hashStringToSeed(seedKey) : hashStringToSeed(seedKey);
  return shuffleBySeed(options, seed);
}

/**
 * 从文本中提取首个数字（用于数值排序）
 */
function extractNumber(text: string): number {
  const match = text.match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * 同步重映射正确答案索引
 * 
 * @param originalOptions 原选项数组
 * @param newOptions 新选项数组
 * @param originalCorrectIndex 原正确索引
 * @returns 新正确索引
 */
export function remapCorrectIndex(
  originalOptions: readonly QuizOption[],
  newOptions: readonly QuizOption[],
  originalCorrectIndex: number
): number {
  const originalCorrect = originalOptions[originalCorrectIndex];
  const newIndex = newOptions.findIndex((o) => o.id === originalCorrect?.id);
  return newIndex >= 0 ? newIndex : originalCorrectIndex;
}
