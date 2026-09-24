/**
 * 理论章末小测选项排序出口（答案位置偏差治理，AGENTS.md 2026-07 规范）。
 *
 * 规则与 strategy-academy quizShuffle 一致：
 * - 数值选项集：按数值升序展示（位置由数值天然决定）
 * - 文字选项集：hash(题目id) 稳定种子洗牌（同题顺序确定、不同题分布互异）
 * - correctIndex 同步重映射；源题库静态数据一律不改
 */
import type { TheoryQuizQuestion } from '../types';
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';

/** 计算选项新展示顺序（返回原索引的置换数组） */
function computeOrder(texts: string[], id: string): number[] {
  const indices = texts.map((_, i) => i);
  if (isNumericOptionSet(texts)) {
    return sortByNumericValue(indices, (i) => texts[i]!);
  }
  return shuffleBySeed(indices, hashStringToSeed(id));
}

/** 对章末小测题做选项重排（纯函数，返回新对象，不修改源数据） */
export function orderTheoryQuizQuestion(q: TheoryQuizQuestion): TheoryQuizQuestion {
  const order = computeOrder(q.options, q.id);
  return {
    ...q,
    options: order.map((originalIndex) => q.options[originalIndex]!),
    correctIndex: order.indexOf(q.correctIndex),
  };
}
