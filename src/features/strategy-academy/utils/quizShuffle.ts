/**
 * 答案位置偏差治理 — 测验/Drill 选项渲染前排序工具（纯函数集）。
 *
 * 背景：levels 测验题正确答案高度集中于 B/C 位（B+C 占 95.1%），
 * localLessons 81.6% 集中在 B 位。用户可通过"总选 B"获得虚高正确率。
 * 治理方式：渲染前对选项做纯函数处理，源数据文件一律不改。
 *
 * 教学规则：
 * 1. 数值选项集（全部文本以数字开头，如 '20%' / '约 15 个'）：
 *    按数值升序展示 —— 位置由数值天然决定，既消除位置偏差，
 *    又符合"数值从小到大"的阅读习惯，便于估算比较。
 * 2. 文字选项集：用题目 id 的哈希作为稳定种子洗牌 ——
 *    同一题每次复习的选项顺序不变（利于记忆锚定），
 *    但不同题目的正确答案位置互不相同（消除全局位置偏差）。
 * 3. 传入显式 seed（如认证考试的会话随机种子）：
 *    每次进入考试选项顺序不同，考试过程中保持稳定（防背位置应试）。
 */

import type { QuizQuestion, DrillQuestion } from '../types';
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  isDigitBearingOptionSet,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';

/**
 * 计算选项的新展示顺序（返回原索引的置换数组）。
 *
 * - 数值选项集：按数值升序（稳定排序）
 * - 其他：按种子洗牌（seed 缺省时用题目 id 哈希，保证同题确定性）
 */
function computeOrder(texts: string[], id: string, seed?: number): number[] {
  const indices = texts.map((_, i) => i);
  if (isNumericOptionSet(texts)) {
    return sortByNumericValue(indices, (i) => texts[i]!);
  }
  return shuffleBySeed(indices, seed ?? hashStringToSeed(id));
}

/**
 * 对课后测验/认证考试题（QuizQuestion）做选项重排（纯函数，返回新对象）。
 *
 * - 数值选项集走升序分支；文字选项集走种子洗牌分支
 * - `correctIndex` 同步重映射：在置换数组中找到原 correctIndex 的新位置
 * - 不修改传入对象与其 options 数组
 *
 * @param q 原始题目（源数据，保持不变）
 * @param seed 可选显式种子（认证考试传入会话种子实现"每次进入顺序不同"）
 */
export function orderQuizQuestion(q: QuizQuestion, seed?: number): QuizQuestion {
  const order = computeOrder(q.options, q.id, seed);
  return {
    ...q,
    options: order.map((originalIndex) => q.options[originalIndex]!),
    correctIndex: order.indexOf(q.correctIndex),
  };
}

/**
 * 对 ChoiceDrill 类课程题（DrillQuestion）做选项重排（纯函数，返回新对象）。
 *
 * 选项对象自带 `isCorrect` 标记并随选项整体移动，无需重映射索引。
 * 排序/洗牌规则与 orderQuizQuestion 一致（数值升序 / id 稳定种子 / 显式种子）。
 *
 * @param q 原始题目（源数据，保持不变）
 * @param seed 可选显式种子
 */
export function orderDrillOptions(q: DrillQuestion, seed?: number): DrillQuestion {
  const texts = q.options.map((option) => option.text);
  const order = computeOrder(texts, q.id, seed);
  return {
    ...q,
    options: order.map((originalIndex) => q.options[originalIndex]!),
  };
}

// ===== i18n-key 型 Drill 题库（HandRanking / Outs / PotOdds / Opponent 第 2 问）=====

/**
 * 排序种子盐值：
 * 与 orderQuizQuestion 的裸 hash(id) 区分开，并经真实题库验证 ——
 * 该盐值下 outs / potOdds / opponent 第 2 问重排后正确答案索引任一占比 ≤60%
 * （见 drillOptionOrder.test.ts 分布守卫）。
 */
const DRILL_OPTION_SALT = '@v2';

/** orderResolvedOptions 的返回结构：重排后的选项 + 重映射后的正确索引 */
export interface OrderedOptions<T> {
  options: T[];
  correctIndex: number;
}

/**
 * 对"渲染时才解析文本"的 Drill 选项做重排（纯函数，不修改入参）。
 *
 * 适用：选项为 i18n key（HandRanking / Outs / PotOdds）或内联文本（Opponent 策略），
 * 组件在 t() 解析后、渲染前调用本函数。
 *
 * 规则（与 orderQuizQuestion 的差异见下）：
 * 1. 数值选项集（放宽判定：每个文本含数字）：按数值单调排列，
 *    方向（升/降序）由 hash(id + salt) 奇偶决定。
 *    ⚠️ 与课后测验的"一律升序"不同：这四个 Drill 的题库源数据选项本已升序
 *    （count6/9/12/15），纯升序等于不重排，正确答案仍 75% 集中在"第二小"位；
 *    方向哈希在保留"数值单调、便于扫读比较"教学价值的同时打散位置集中度。
 *    方向只依赖题目 id → 同题跨语言、跨会话顺序一致。
 * 2. 文字选项集：hash(id + salt) 种子洗牌，种子只依赖 id → zh/en 顺序天然一致。
 * 3. correctIndex 同步重映射，指向重排后的正确选项。
 *
 * @param id 题目 id（稳定种子来源）
 * @param options 原始选项数组（任意类型，getText 提供文本视图）
 * @param correctIndex 原始正确索引
 * @param getText 选项 → 已解析展示文本（组件侧传 t() 解析结果）
 * @param seed 可选显式种子（覆盖 id 哈希，如会话随机场景）
 */
export function orderResolvedOptions<T>(
  id: string,
  options: readonly T[],
  correctIndex: number,
  getText: (option: T) => string,
  seed?: number,
): OrderedOptions<T> {
  const texts = options.map(getText);
  const indices = options.map((_, i) => i);
  const effectiveSeed = seed ?? hashStringToSeed(id + DRILL_OPTION_SALT);
  let order: number[];
  if (isDigitBearingOptionSet(texts)) {
    const ascending = sortByNumericValue(indices, (i) => texts[i]!);
    order = effectiveSeed % 2 === 0 ? ascending : [...ascending].reverse();
  } else {
    order = shuffleBySeed(indices, effectiveSeed);
  }
  return {
    options: order.map((originalIndex) => options[originalIndex]!),
    correctIndex: order.indexOf(correctIndex),
  };
}
