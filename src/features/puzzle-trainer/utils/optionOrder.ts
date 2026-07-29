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
 * 所有函数均为纯函数。
 */
import type { PuzzleOption } from '../types';

/** 选项排序键：先按动作类别（消极→激进），同类再按尺度升序 */
export interface OptionSortKey {
  /**
   * 动作类别优先级：
   *  0 = Fold
   *  1 = Check（含 'Check 陷阱' 等变体）
   *  2 = Call
   *  3 = Limp
   *  4 = Bet / C-bet（带尺度的下注）
   *  5 = Raise / 3bet / 4bet / 5bet（非全下的加注类）
   *  6 = 全下类（文本含"全下"，如 '全下 20BB'、'3bet 全下 15BB'、'5bet 全下'）
   * 99 = 无法识别（排最后，稳定排序保持原相对顺序）
   */
  category: number;
  /** 文本中第一个数值（支持小数，如 1.8 / 27.5），无数值取 0 */
  size: number;
}

/** 无法识别类别时的兜底值（排最后） */
export const UNKNOWN_CATEGORY = 99;

/** 类别前缀匹配表：按声明顺序尝试（大小写不敏感） */
const CATEGORY_PREFIXES: ReadonlyArray<readonly [prefix: string, category: number]> = [
  ['fold', 0],
  ['check', 1],
  ['call', 2],
  ['limp', 3],
  ['c-bet', 4],
  ['bet', 4],
  ['raise', 5],
  ['3bet', 5],
  ['4bet', 5],
  ['5bet', 5],
];

/** 提取文本中第一个数值（支持小数），无数值返回 0 */
const FIRST_NUMBER_RE = /\d+(?:\.\d+)?/;

/**
 * 解析选项文本 → 排序键。
 *
 * 规则：
 *  - 文本含"全下"一律归类 6（覆盖 '全下 XBB'、'3bet 全下 15BB'、'5bet 全下'）；
 *  - 否则按前缀匹配（大小写不敏感）：Fold(0) / Check(1) / Call(2) / Limp(3) /
 *    Bet·C-bet(4) / Raise·3bet·4bet·5bet(5)；
 *  - 无法识别返回 category: 99；
 *  - size 取文本中第一个数值（如 'C-bet 1.8BB' → 1.8、'全下 27.5BB' → 27.5），无数值取 0。
 */
export function parseOptionSortKey(text: string): OptionSortKey {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();
  const sizeMatch = FIRST_NUMBER_RE.exec(normalized);
  const size = sizeMatch ? Number.parseFloat(sizeMatch[0]) : 0;

  if (normalized.includes('全下')) {
    return { category: 6, size };
  }
  for (const [prefix, category] of CATEGORY_PREFIXES) {
    if (lower.startsWith(prefix)) {
      return { category, size };
    }
  }
  return { category: UNKNOWN_CATEGORY, size };
}

/**
 * 按 (category, size) 升序对选项做稳定排序，返回新数组（不修改入参）。
 *
 * ES2019+ 的 Array.prototype.sort 保证稳定性：
 * 同 category 同 size（含 category 99 的未识别项）保持原相对顺序。
 */
export function sortOptionsCanonically(options: readonly PuzzleOption[]): PuzzleOption[] {
  const keyed = options.map((option) => ({ option, key: parseOptionSortKey(option.text) }));
  keyed.sort((a, b) => a.key.category - b.key.category || a.key.size - b.key.size);
  return keyed.map((entry) => entry.option);
}
