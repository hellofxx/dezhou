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
 *    Bet/C-Bet/Donk → Raise/3-bet/4-Bet/5-Bet → All-in/全下），
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
 *
 * 实现：策略委托 `shared/utils/optionOrder`（conditional actionAll →
 * action requireAllParsed / numericStrict / shuffle+盐），本文件保留模块公开 API
 * 与检测口径（practice 词表：all-in + 全下、donk / cbet / 4-bet / 5-bet）。
 */
import type { PracticeOption, PracticeQuestion } from '../types';
import {
  applyOptionOrder,
  computeOptionOrder,
  parseActionSortKey,
  type OrderStrategy,
} from '@/shared/utils/optionOrder';

/** 洗牌盐值：隔离 practice 出口的种子空间（勿与其他出口盐值重复） */
const PRACTICE_OPTION_SALT = '@practice-v1';

/** 选项展示文本视图：action + amount（尺度可能只写在 amount 字段） */
function optionText(option: PracticeOption): string {
  return option.amount ? `${option.action} ${option.amount}` : option.action;
}

/**
 * 解析选项文本 → 动作类别（practice 词表）。
 * 含 "all-in"/"全下" 一律归 6（覆盖 'Check-Raise All-in' / '3-bet all-in' 等复合体，
 * 与 puzzle-trainer 的"全下"归类口径一致）；否则按前缀表匹配；无法识别返回 99。
 */
export function parsePracticeActionCategory(text: string): number {
  return parseActionSortKey(text, 'practice').category;
}

/**
 * practice 分流策略：
 * 全部动作可识别 → canonical 排序；否则数值集升序；否则加盐洗牌。
 */
function practiceStrategy(id: string): OrderStrategy {
  return {
    kind: 'conditional',
    if: 'actionAll',
    then: { kind: 'action', vocab: 'practice', requireAllParsed: true },
    else: {
      kind: 'conditional',
      if: 'numericStrict',
      then: { kind: 'numeric', detect: 'strict', direction: 'asc' },
      else: { kind: 'shuffle', seed: id, salt: PRACTICE_OPTION_SALT },
    },
  };
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
  const order = computeOptionOrder(question.options, optionText, practiceStrategy(question.id));
  return { ...question, options: applyOptionOrder(question.options, order) };
}
