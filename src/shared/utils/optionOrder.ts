/**
 * 选项排序策略（跨模块唯一实现，纯函数集）。
 *
 * 治理背景：题库正确答案位置集中（"总选第一个/总选 B"作弊），各训练模块必须在渲染前
 * 重排选项，且顺序必须确定（同题跨会话 / 跨语言一致）。本模块把历史上分散在
 * pot-odds / theory-academy / onboarding / puzzle-trainer / strategy-academy 的
 * 六套实现收口为「策略描述 + 一次求值」：
 *
 *   strategy ──computeOptionOrder──▶ 原索引置换数组 ──applyOptionOrder──▶ 重排后的数组
 *                                            └────remapCorrectIndex────▶ 新 correctIndex
 *
 * 四类策略：
 *  - numeric：数值选项集按数值排序。detect 区分严格判定（`/^约?\s*\d/`，`isNumericOptionSet`）
 *    与宽松判定（`/\d/`，`isDigitBearingOptionSet`，供 i18n 解析文本场景，保证 zh/en 同分支）；
 *    direction 为 'seedParity' 时按种子奇偶决定升/降序（把"数值单调便于扫读"与
 *    "打散正确答案位置"同时保住）。
 *  - shuffle：按种子洗牌。string 种子经 FNV-1a 哈希（可加盐隔离种子空间），
 *    number 种子直接使用（会话随机种子 / 已算好的哈希）。
 *  - action：按扑克动作激进度 canonical 排序（Fold → Check → Call → Limp → Bet →
 *    Raise → All-in/全下），同类按尺度升序，未知类别（99）排最后且稳定。
 *    requireAllParsed 为 true 时若存在无法识别的选项，改用 fallback 策略。
 *  - conditional：先判定条件（数值严格 / 数值宽松 / 全部动作可识别）再选分支。
 *
 * 术语约定：
 *  - 「种子」统一由 resolveSeed 归一：number 原样使用，string → hashStringToSeed(seed + salt)。
 *  - 所有函数不修改入参；置换数组的元素是原数组下标。
 *  - 洗牌 / 数值排序基础设施复用 `shared/utils/seededShuffle`（shuffleBySeed /
 *    hashStringToSeed / isNumericOptionSet / isDigitBearingOptionSet / sortByNumericValue），
 *    本模块只做策略编排，不重复实现随机数与判定。
 */
import {
  hashStringToSeed,
  isDigitBearingOptionSet,
  isNumericOptionSet,
  shuffleBySeed,
  sortByNumericValue,
} from './seededShuffle';

/** 数值选项集判定口径：strict = 以数字开头；digit = 文本内含数字 */
export type NumericDetect = 'strict' | 'digit';

/** 动作词表口径：puzzle 只有"全下"，practice 另有 all-in 且支持 donk/cbet 等前缀 */
export type ActionVocab = 'puzzle' | 'practice';

/** conditional 的判定条件 */
export type OrderCondition = 'numericStrict' | 'numericDigit' | 'actionAll';

/** 种子输入：number 直接用，string 经 FNV-1a 哈希（可加盐） */
export type SeedInput = number | string;

export interface NumericStrategy {
  kind: 'numeric';
  detect: NumericDetect;
  /** 缺省 'asc'（升序）；'seedParity' 按 resolveSeed(seed) 奇偶决定升/降序 */
  direction?: 'asc' | 'seedParity';
  seed?: SeedInput;
}

export interface ShuffleStrategy {
  kind: 'shuffle';
  seed: SeedInput;
  /** 种子盐值（仅对 string 种子生效，用于隔离不同出口的种子空间） */
  salt?: string;
}

export interface ActionStrategy {
  kind: 'action';
  vocab: ActionVocab;
  /** true：存在无法识别的选项时改用 fallback（缺省 fallback 则保持原序） */
  requireAllParsed: boolean;
  fallback?: OrderStrategy;
}

export interface ConditionalStrategy {
  kind: 'conditional';
  if: OrderCondition;
  then: OrderStrategy;
  else: OrderStrategy;
}

export type OrderStrategy =
  | NumericStrategy
  | ShuffleStrategy
  | ActionStrategy
  | ConditionalStrategy;

/** 动作排序键：先按类别（消极→激进），同类按尺度升序 */
export interface ActionSortKey {
  category: number;
  /** 文本中第一个数值（支持小数），无数值取 0 */
  size: number;
}

/** 类别前缀匹配表（按声明顺序尝试，大小写不敏感） */
type PrefixEntry = readonly [prefix: string, category: number];

/**
 * puzzle 词表：只有"全下"算 6；不含 donk / 无连字符 cbet / 4-bet / 5-bet。
 * 口径变更会改变题库 canonical 顺序，须同步 puzzleBank 黄金快照。
 */
const PUZZLE_PREFIXES: readonly PrefixEntry[] = [
  ['fold', 0],
  ['check', 1],
  ['call', 2],
  ['limp', 3],
  ['c-bet', 4],
  ['bet', 4],
  ['raise', 5],
  ['3bet', 5],
  ['3-bet', 5],
  ['4bet', 5],
  ['5bet', 5],
];

/** practice 词表：all-in 与"全下"都算 6，另含 donk / cbet / 4-bet / 5-bet */
const PRACTICE_PREFIXES: readonly PrefixEntry[] = [
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

/** 全下类类别值（覆盖 'Check-Raise All-in' / '3-bet 全下 15BB' 等复合体） */
const ALL_IN_CATEGORY = 6;

/** 无法识别动作语义时的类别兜底值（排最后，稳定排序保持原相对顺序） */
export const UNKNOWN_ACTION_CATEGORY = 99;

/** 提取文本中第一个数值（支持小数） */
const FIRST_NUMBER_PATTERN = /\d+(?:\.\d+)?/;

/**
 * 解析选项文本 → 动作排序键（纯函数）。
 *
 * - practice：文本（小写）含 'all-in' 或 '全下' → 6；否则按 practice 前缀表匹配；
 * - puzzle：仅"全下"→ 6；否则按 puzzle 前缀表匹配（不含 all-in 关键字）；
 * - 均取文本第一个数值作为 size（无数值取 0）；无法识别返回 category 99。
 */
export function parseActionSortKey(text: string, vocab: ActionVocab): ActionSortKey {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();
  const match = FIRST_NUMBER_PATTERN.exec(trimmed);
  const size = match ? Number.parseFloat(match[0]) : 0;

  if (vocab === 'practice') {
    if (lower.includes('all-in') || lower.includes('全下')) return { category: ALL_IN_CATEGORY, size };
    for (const [prefix, category] of PRACTICE_PREFIXES) {
      if (lower.startsWith(prefix)) return { category, size };
    }
    return { category: UNKNOWN_ACTION_CATEGORY, size };
  }

  if (trimmed.includes('全下')) return { category: ALL_IN_CATEGORY, size };
  for (const [prefix, category] of PUZZLE_PREFIXES) {
    if (lower.startsWith(prefix)) return { category, size };
  }
  return { category: UNKNOWN_ACTION_CATEGORY, size };
}

/** 归一化种子：number 原样使用；string 走 FNV-1a（salt 参与哈希，隔离种子空间） */
function resolveSeed(seed: SeedInput | undefined, salt?: string): number {
  if (typeof seed === 'number') return seed;
  const key = seed ?? '';
  return hashStringToSeed(salt ? `${key}${salt}` : key);
}

/** 数值判定口径分发 */
function matchesNumericDetect(texts: readonly string[], detect: NumericDetect): boolean {
  return detect === 'strict' ? isNumericOptionSet([...texts]) : isDigitBearingOptionSet([...texts]);
}

/**
 * conditional 条件判定。
 *
 * `actionAll` 的词表取 then 分支的 action.vocab（缺省 practice），
 * 保证"判定用哪套词表"与"排序用哪套词表"永远一致。
 */
function matchesCondition(
  condition: OrderCondition,
  texts: readonly string[],
  thenStrategy: OrderStrategy,
): boolean {
  if (condition === 'numericStrict') return isNumericOptionSet([...texts]);
  if (condition === 'numericDigit') return isDigitBearingOptionSet([...texts]);
  const vocab: ActionVocab = thenStrategy.kind === 'action' ? thenStrategy.vocab : 'practice';
  return texts.every((text) => parseActionSortKey(text, vocab).category !== UNKNOWN_ACTION_CATEGORY);
}

/** 求值：把策略翻译成原索引置换数组 */
function resolveOrder(
  indices: readonly number[],
  texts: readonly string[],
  strategy: OrderStrategy,
): number[] {
  switch (strategy.kind) {
    case 'numeric': {
      // 判定不通过时保持原序：需要"非数值时改走别处"的调用方请用 conditional 显式给出 else
      if (!matchesNumericDetect(texts, strategy.detect)) return [...indices];
      const ascending = sortByNumericValue(indices, (index) => texts[index] ?? '');
      const seed = resolveSeed(strategy.seed);
      return strategy.direction === 'seedParity' && seed % 2 !== 0
        ? [...ascending].reverse()
        : ascending;
    }
    case 'shuffle':
      return shuffleBySeed(indices, resolveSeed(strategy.seed, strategy.salt));
    case 'action': {
      const keys = texts.map((text) => parseActionSortKey(text, strategy.vocab));
      const allParsed = keys.every((key) => key.category !== UNKNOWN_ACTION_CATEGORY);
      if (strategy.requireAllParsed && !allParsed) {
        return strategy.fallback
          ? resolveOrder(indices, texts, strategy.fallback)
          : [...indices];
      }
      return indices
        .map((index) => ({ index, key: keys[index] ?? { category: UNKNOWN_ACTION_CATEGORY, size: 0 } }))
        .sort(
          (a, b) =>
            a.key.category - b.key.category || a.key.size - b.key.size || a.index - b.index,
        )
        .map((entry) => entry.index);
    }
    case 'conditional':
      return resolveOrder(
        indices,
        texts,
        matchesCondition(strategy.if, texts, strategy.then) ? strategy.then : strategy.else,
      );
  }
}

/**
 * 计算选项展示顺序（返回原索引的置换数组，不修改入参）。
 *
 * @param items 原始选项数组
 * @param getText 选项 → 用于排序判定的展示文本（已解析文案；不是 i18n key）
 * @param strategy 排序策略
 */
export function computeOptionOrder<T>(
  items: readonly T[],
  getText: (item: T) => string,
  strategy: OrderStrategy,
): number[] {
  const indices = items.map((_, index) => index);
  if (items.length <= 1) return indices;
  return resolveOrder(indices, items.map(getText), strategy);
}

/** 按置换数组重排（返回新数组，只移动引用，不复制元素） */
export function applyOptionOrder<T>(items: readonly T[], order: readonly number[]): T[] {
  return order.map((originalIndex) => items[originalIndex]!);
}

/** 正确答案索引重映射：原 correctIndex 在置换数组中的新位置（找不到返回 -1） */
export function remapCorrectIndex(order: readonly number[], originalIndex: number): number {
  return order.indexOf(originalIndex);
}
