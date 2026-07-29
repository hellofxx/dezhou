/**
 * 赔率测验选项排序工具（"答案位置偏差治理"方案，纯函数）。
 *
 * 治理背景：原题库正确答案高度集中于 options[0]（14 题中 10 题），
 * 且渲染按数组原序，用户可通过"总选第一个"作弊。
 *
 * 排序规则（orderQuizOptions）：
 *  - 数值选项集（如 outs 数量题，全部文本以数字/"约+数字"开头）→ 按数值升序，
 *    位置由数值语义自然决定，与书写顺序解耦；
 *  - 其余选项 → 按题目 id（或调用方指定的种子串）确定性洗牌，
 *    跨会话、跨用户顺序完全一致。
 */
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';
import type { PotOddsQuizQuestion } from '../types';

/**
 * 返回选项已重排的新题目对象（不修改入参）。
 *
 * @param q 原始题目
 * @param seedKey 可选的洗牌种子串；缺省用 String(q.id)。
 *   用于 id 会被调用方改写的题目（如 getEasyOddsQuestion 的 id=0 占位），
 *   传入固定字符串保证洗牌结果与最终 id 无关。
 */
export function orderQuizOptions(
  q: PotOddsQuizQuestion,
  seedKey?: string,
): PotOddsQuizQuestion {
  const texts = q.options.map((o) => o.text);
  const options = isNumericOptionSet(texts)
    ? sortByNumericValue(q.options, (o) => o.text)
    : shuffleBySeed(q.options, hashStringToSeed(seedKey ?? String(q.id)));
  return { ...q, options };
}
