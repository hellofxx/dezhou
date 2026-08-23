/**
 * 赔率测验选项排序工具（"答案位置偏差治理"方案，纯函数）。
 *
 * 治理背景：原题库正确答案高度集中于 options[0]（14 题中 10 题），
 * 且渲染按数组原序，用户可通过"总选第一个"作弊。
 *
 * 排序规则（orderQuizOptions）：
 *  - 数值选项集（如 outs 数量题，解析后每个文本均含数字）→ 按数值升序，
 *    位置由数值语义自然决定，与书写顺序解耦；
 *  - 其余选项 → 按题目 id（或调用方指定的种子串）确定性洗牌，
 *    跨会话、跨用户顺序完全一致。
 *
 * i18n 说明：本模块题库为 i18n-key 型（options[].text 存 key），数值集判定必须
 * 基于 t() 解析后的真实文本（经 resolvedTexts 参数传入）：key 恒不以数字开头，
 * 且恒含题号数字（q1/q12…），无论用前缀匹配还是宽松匹配都无法在 key 上正确判定。
 * 洗牌分支基于 id 种子，与解析与否无关。两类分支在 zh/en 下结果相同
 * （数值升序语言无关、洗牌种子为 id），顺序不随语言切换变化。
 */
import {
  shuffleBySeed,
  hashStringToSeed,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';
import type { PotOddsQuizQuestion } from '../types';

/** 放宽的数值选项集判定：每个解析后文本都含数字即视为数值集。
 *
 * shared 的 isNumericOptionSet 要求 `/^约?\s*\d/`（数字/"约"+数字开头），
 * 对英文 locale（如 'About 15 (combo draw)'）会失配，导致 zh/en 走不同分支。
 * 与 strategy-academy quizShuffle 的 isDigitBearingOptionSet 同口径：
 * 放宽为 `/\d/`（含数字即可），排序取文本首个数字（与位置无关），
 * zh/en 数值相同 → 两种语言下同走升序分支且顺序一致。
 */
function isDigitBearingOptionSet(texts: string[]): boolean {
  return texts.length > 0 && texts.every((text) => /\d/.test(text));
}

/**
 * 返回选项已重排的新题目对象（不修改入参）。
 *
 * @param q 原始题目
 * @param seedKey 可选的洗牌种子串；缺省用 String(q.id)。
 *   用于 id 会被调用方改写的题目（如 getEasyOddsQuestion 的 id=0 占位），
 *   传入固定字符串保证洗牌结果与最终 id 无关。
 * @param resolvedTexts 可选的 t() 解析后选项文本（与 q.options 原序对齐）。
 *   i18n-key 型题库的数值集判定只能基于解析后文本（见文件头注）；
 *   调用方（渲染层）应传 q.options.map((o) => t(o.text))，
 *   使数值选项题正确走升序分支。未提供（或长度不匹配）时一律走洗牌分支，
 *   仅适合非数值题或纯洗牌场景（如 getEasyOddsQuestion）。
 */
export function orderQuizOptions(
  q: PotOddsQuizQuestion,
  seedKey?: string,
  resolvedTexts?: string[],
): PotOddsQuizQuestion {
  const seed = hashStringToSeed(seedKey ?? String(q.id));
  const texts =
    resolvedTexts && resolvedTexts.length === q.options.length ? resolvedTexts : null;
  if (texts && isDigitBearingOptionSet(texts)) {
    const options = sortByNumericValue(
      q.options.map((o, i) => ({ option: o, text: texts[i] ?? o.text })),
      (pair) => pair.text,
    ).map((pair) => pair.option);
    return { ...q, options };
  }
  return { ...q, options: shuffleBySeed(q.options, seed) };
}
