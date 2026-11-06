/**
 * 理论章末小测选项排序出口（答案位置偏差治理，AGENTS.md 2026-07 规范）。
 *
 * 规则与 strategy-academy quizShuffle 一致：
 * - 数值选项集：按数值升序展示（位置由数值天然决定）
 * - 文字选项集：hash(题目id) 稳定种子洗牌（同题顺序确定、不同题分布互异）
 * - correctIndex 同步重映射；源题库静态数据一律不改
 *
 * 实现：策略委托 `shared/utils/optionOrder`（conditional + numericStrict / shuffle）。
 */
import { applyOptionOrder, computeOptionOrder, remapCorrectIndex } from '@/shared/utils/optionOrder';
import type { OrderStrategy } from '@/shared/utils/optionOrder';
import type { TheoryQuizQuestion } from '../types';

/** 题型排序策略：数值选项集升序，其余按 id 种子洗牌 */
function quizStrategy(id: string): OrderStrategy {
  return {
    kind: 'conditional',
    if: 'numericStrict',
    then: { kind: 'numeric', detect: 'strict', direction: 'asc' },
    else: { kind: 'shuffle', seed: id },
  };
}

/** 对章末小测题做选项重排（纯函数，返回新对象，不修改源数据） */
export function orderTheoryQuizQuestion(q: TheoryQuizQuestion): TheoryQuizQuestion {
  const order = computeOptionOrder(q.options, (text) => text, quizStrategy(q.id));
  return {
    ...q,
    options: applyOptionOrder(q.options, order),
    correctIndex: remapCorrectIndex(order, q.correctIndex),
  };
}
