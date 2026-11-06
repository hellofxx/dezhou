/**
 * 选项语义固定排序（"答案位置偏差治理"方案）。
 *
 * 教学决策：谜题选项不再按日期种子洗牌，而是按扑克动作的激进程度
 * 从消极到激进固定排列（Fold → Check → Call → Limp → Bet → Raise → 全下），
 * 与真实扑克客户端的动作按钮顺序一致。这样：
 *  1. 正确答案位置由动作语义自然决定，与题库书写顺序解耦（消除"总选第一个"作弊）；
 *  2. 用户形成稳定的空间记忆（消极动作在前、激进动作在后），降低认知负担；
 *  3. 选项顺序 100% 确定，跨日期、跨用户完全一致。
 *
 * 实现：词表与排序委托 `shared/utils/optionOrder`（action 策略 + puzzle 词表，
 * requireAllParsed=false：未识别动作归 99 排最后，稳定排序保持原相对顺序）。
 * 本文件只保留 puzzle 模块的公开 API（parseOptionSortKey / sortOptionsCanonically）。
 *
 * 所有函数均为纯函数。
 */
import {
  applyOptionOrder,
  computeOptionOrder,
  parseActionSortKey,
  UNKNOWN_ACTION_CATEGORY,
  type ActionSortKey,
  type OrderStrategy,
} from '@/shared/utils/optionOrder';
import type { PuzzleOption } from '../types';

/**
 * 选项排序键：先按动作类别（消极→激进），同类再按尺度升序
 * （别名保留模块历史导出名，实现见 shared `ActionSortKey`）。
 */
export type OptionSortKey = ActionSortKey;

/** 无法识别类别时的兜底值（排最后；别名保留模块历史导出名） */
export const UNKNOWN_CATEGORY = UNKNOWN_ACTION_CATEGORY;

/** puzzle 词表排序策略：canonical (category, size) 稳定升序，无 fallback */
const PUZZLE_ORDER_STRATEGY: OrderStrategy = {
  kind: 'action',
  vocab: 'puzzle',
  requireAllParsed: false,
};

/**
 * 解析选项文本 → 排序键（puzzle 词表）。
 *
 * 规则：
 *  - 文本含"全下"一律归类 6（覆盖 '全下 XBB'、'3-bet 全下 15BB'、'5bet 全下'）；
 *  - 否则按前缀匹配（大小写不敏感）：Fold(0) / Check(1) / Call(2) / Limp(3) /
 *    Bet·C-bet(4) / Raise·3bet·4bet·5bet(5)；
 *  - 无法识别返回 category: 99；
 *  - size 取文本中第一个数值（如 'C-bet 1.8BB' → 1.8、'全下 27.5BB' → 27.5），无数值取 0。
 */
export function parseOptionSortKey(text: string): OptionSortKey {
  return parseActionSortKey(text, 'puzzle');
}

/**
 * 按 (category, size) 升序对选项做稳定排序，返回新数组（不修改入参）。
 *
 * 同 category 同 size（含 category 99 的未识别项）保持原相对顺序。
 */
export function sortOptionsCanonically(options: readonly PuzzleOption[]): PuzzleOption[] {
  const order = computeOptionOrder(
    options,
    (option) => option.text,
    PUZZLE_ORDER_STRATEGY,
  );
  return applyOptionOrder(options, order);
}
