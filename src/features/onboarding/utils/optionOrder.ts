/**
 * 定级测试选项排序出口（答案位置偏差治理，AGENTS.md 选项排序治理条款）。
 *
 * 规则与 theory-academy quizOrder / strategy-academy quizShuffle 一致：
 * - 数值选项集（解析后文本全部以数字开头，如 '20%'）：按数值升序展示，
 *   位置由数值天然决定（zh/en 解析后数值相同 → 顺序一致）
 * - 文字选项集：hash(题目id) 稳定种子洗牌（同题顺序确定、不同题分布互异；
 *   种子只依赖题目 id，与语言无关 → zh/en 顺序一致）
 * - PlacementQuestion 选项自带 isCorrect 标志并随选项整体移动，无需重映射
 * - i18n-key 型题库：源题库静态数据不改，组件在 t() 解析后调用本出口
 */
import type { PlacementQuestion } from '../types';
import { applyOptionOrder, computeOptionOrder } from '@/shared/utils/optionOrder';
import type { OrderStrategy } from '@/shared/utils/optionOrder';

type PlacementOption = PlacementQuestion['options'][number];

/** 定级题排序策略：数值选项集升序，文字选项集按 hash(题 id) 种子洗牌 */
function placementStrategy(id: string): OrderStrategy {
  return {
    kind: 'conditional',
    if: 'numericStrict',
    then: { kind: 'numeric', detect: 'strict', direction: 'asc' },
    else: { kind: 'shuffle', seed: id },
  };
}

/** 对定级题选项做重排（纯函数，返回新数组，不修改源数据） */
export function orderPlacementOptions(
  q: PlacementQuestion,
  getText: (option: PlacementOption) => string,
): PlacementOption[] {
  const order = computeOptionOrder(q.options, getText, placementStrategy(q.id));
  return applyOptionOrder(q.options, order);
}
