/**
 * PracticeDrill（含 QuickDrill 消费路径）选项渲染前排序出口（纯函数）。
 *
 * 背景（P0B-01）：practice 题库 259 题此前按源数据原序渲染，
 * 正确答案 55.2% 集中在 index 1，违反《答题选项排序治理》
 * "禁止按题库数据原序直接渲染"。源题库静态数据一律不改，
 * 渲染前经本函数重排。
 *
 * 分流规则（对齐 AGENTS.md《答题选项排序治理》/ PRD 5.26 / TDD 5.9）：
 * 1. 动作类选项集（全部选项可识别为扑克动作语义）：
 *    按"消极→激进"canonical 固定排序（Fold → Check → Call → Limp →
 *    Bet/C-Bet/Donk → Raise/3-Bet/4-Bet/5-Bet → All-in/全下），
 *    同类别按尺度数值升序 —— 与 puzzle-trainer utils/optionOrder.ts 同规范；
 * 2. 数值类选项集：按数值单调升序（复用 shared 判定与排序）；
 * 3. 其余（含无法全量识别动作语义的文字陈述混合集）：
 *    按 hash(题目id + 盐) 种子洗牌 —— 同题跨会话确定，
 *    盐值与 quizShuffle 的裸 hash(id) / DRILL_OPTION_SALT('@v2') 区分，
 *    避免种子空间重叠导致同 id 题目洗出相同置换。
 *
 * 正确答案标识：PracticeOption 自带 isCorrect 随选项对象整体移动，
 * 无需索引重映射（组件按 option.isCorrect / 对象引用判定）。
 * 题库选项为静态中文文本（非 i18n key），无 t() 解析时序问题。
 *
 * 分布守卫：practiceOptionOrder.test.ts 全量迭代题库断言
 * 重排后正确答案任一位置占比 ≤60% 且同题两次排序结果一致。
 */
import type { PracticeOption, PracticeQuestion } from '../types';
import {
  shuffleBySeed,
  hashStringToSeed,
  isNumericOptionSet,
  sortByNumericValue,
} from '@/shared/utils/seededShuffle';

/** 洗牌盐值：隔离 practice 出口的种子空间（勿与其他出口盐值重复） */
const PRACTICE_OPTION_SALT = '@practice-v1';

/** 无法识别动作语义时的类别兜底值 */
const UNKNOWN_CATEGORY = 99;

/**
 * 动作类别前缀匹配表（大小写不敏感，按声明顺序尝试）：
 * 0=Fold 1=Check（含 Check-Raise 等 check 前缀变体，与 puzzle-trainer 同口径）
 * 2=Call 3=Limp 4=Bet/C-Bet/Donk 5=Raise/3-Bet/4-Bet/5-Bet
 */
const CATEGORY_PREFIXES: ReadonlyArray<readonly [prefix: string, category: number]> = [
  ['fold', 0],
  ['check', 1],
  ['call', 2],
  ['limp', 3],
  ['donk', 4],
  ['c-bet', 4],
  ['cbet', 4],
  ['bet', 4],
  ['raise', 5],
  ['3-bet', 5],
  ['3bet', 5],
  ['4-bet', 5],
  ['4bet', 5],
  ['5-bet', 5],
  ['5bet', 5],
];

/** 提取文本中第一个数值（支持小数），无数值取 0（用于同类别内尺度升序） */
const FIRST_NUMBER_PATTERN = /\d+(?:\.\d+)?/;

/** 选项展示文本视图：action + amount（尺度可能只写在 amount 字段） */
function optionText(option: PracticeOption): string {
  return option.amount ? `${option.action} ${option.amount}` : option.action;
}

/**
 * 解析选项文本 → 动作类别。
 * 含 "all-in"/"全下" 一律归 6（覆盖 'Check-Raise All-in' / '3-bet all-in' 等复合体，
 * 与 puzzle-trainer 的"全下"归类口径一致）；否则按前缀表匹配；无法识别返回 99。
 */
export function parsePracticeActionCategory(text: string): number {
  const lower = text.trim().toLowerCase();
  if (lower.includes('all-in') || lower.includes('全下')) return 6;
  for (const [prefix, category] of CATEGORY_PREFIXES) {
    if (lower.startsWith(prefix)) return category;
  }
  return UNKNOWN_CATEGORY;
}

/**
 * 对单题 practice 选项做渲染前重排（纯函数：返回新题目对象，不修改入参）。
 *
 * - 全部选项动作语义可识别 → canonical (category, size) 稳定升序；
 * - 数值选项集 → 数值升序；
 * - 其余 → hash(id + 盐) 种子洗牌（同题确定、跨题打散）。
 */
export function orderPracticeOptions(question: PracticeQuestion): PracticeQuestion {
  if (question.options.length <= 1) return question;

  const texts = question.options.map(optionText);
  const categories = texts.map(parsePracticeActionCategory);
  const allActionLike = categories.every((c) => c !== UNKNOWN_CATEGORY);

  let orderedOptions: PracticeOption[];
  if (allActionLike) {
    // 动作类：消极→激进固定排序，同类别按尺度升序，稳定排序保持原相对顺序
    const keyed = question.options
      .map((option, index) => {
        const sizeMatch = FIRST_NUMBER_PATTERN.exec(texts[index]!);
        return {
          option,
          category: categories[index]!,
          size: sizeMatch ? Number.parseFloat(sizeMatch[0]) : 0,
          index,
        };
      })
      .toSorted((a, b) => a.category - b.category || a.size - b.size || a.index - b.index);
    orderedOptions = keyed.map((entry) => entry.option);
  } else if (isNumericOptionSet(texts)) {
    // 数值类：单调升序
    orderedOptions = sortByNumericValue(question.options, optionText);
  } else {
    // 文字陈述混合集：题目 id 加盐哈希做确定性种子洗牌
    orderedOptions = shuffleBySeed(
      question.options,
      hashStringToSeed(question.id + PRACTICE_OPTION_SALT),
    );
  }

  return { ...question, options: orderedOptions };
}
