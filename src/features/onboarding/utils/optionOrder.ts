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
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';

type PlacementOption = PlacementQuestion['options'][number];

/** 对定级题选项做重排（纯函数，返回新数组，不修改源数据） */
export function orderPlacementOptions(
  q: PlacementQuestion,
  getText: (option: PlacementOption) => string,
): PlacementOption[] {
  const texts = q.options.map((o) => getText(o));
  const indices = q.options.map((_, i) => i);
  const order = isNumericOptionSet(texts)
    ? sortByNumericValue(indices, (i) => texts[i]!)
    : shuffleBySeed(indices, hashStringToSeed(q.id));
  return order.map((originalIndex) => q.options[originalIndex]!);
}
