import {
  calculateAlpha,
  calculateMDF,
  requiredEquity,
  kellyFraction,
  halfKellyFraction,
  requiredHandsForEdge,
  riskOfRuin,
  multiwayAllFold,
  outsToEquity,
  pairTierCombos,
  aggressionFactor,
  vpipPercent,
} from './theoryFormulas';
import { hashStringToSeed, seededRandom } from '@/shared/utils/seededShuffle';

/**
 * 章内即时计算演练的题源（读→算→测微闭环的"算"环节）。
 *
 * 口径纪律：
 * - 期望值一律由 `theoryFormulas` 现算，本文件不出现任何硬编码答案；
 * - 参数只从离散友好网格取值，保证学习者能手算复核；
 * - seed = hash(章节 id + 槽位 + 换题次数)，**不掺日期、不掺用户**：
 *   章内演练不是每日谜题（PRD §5.26.4 的同题同序契约只约束每日谜题），
 *   掺日期会让回访时题目漂移，掺用户则让复算锚点无法登记；
 * - 纯数值填空没有 correctIndex，不属于 `quizOrder.ts` 的选项排序治理面，
 *   因此不经 `orderTheoryQuizQuestion` 不是漏接（依据 AGENTS.md 选项排序治理条款）。
 *
 * 演练结果不写入任何持久状态（见 components/TheoryCalcDrill.tsx 的说明）。
 *
 * 未挂槽的章节是判断而非疏漏：`t9-cash-vs-mtt` 唯一的可算对象是三人 ICM 递归，
 * 需要多步带小数的分数运算，越出"参数取自友好网格、答案可口算复核"的纪律；
 * `t8-tilt` / `t8-mindset` / `t7-player-types` 等章无可算对象。补槽前先确认
 * 该章确有 theoryFormulas 能现算的量，而不是把别章的公式搬来凑数。
 */

export type DrillFormula =
  | 'alpha'
  | 'mdf'
  | 'requiredEquity'
  | 'kelly'
  | 'halfKelly'
  | 'requiredHands'
  | 'riskOfRuin'
  | 'multiwayBluffFold'
  | 'outsEquity'
  | 'pairCombos'
  | 'af'
  | 'vpip';

export type DrillUnit = 'percent' | 'hands' | 'ratio' | 'count';

export interface CalcDrill {
  /** `${chapterId}#d${slotIndex}` —— 刻意不用 `-qN` 后缀，避免与章末小测/复习项 id 空间相撞 */
  drillId: string;
  chapterId: string;
  slotIndex: number;
  formula: DrillFormula;
  templateKey: string;
  hintKey: string;
  params: Record<string, number>;
  expected: number;
  unit: DrillUnit;
  /** 答案展示的小数位 */
  precision: number;
  tolerance: { mode: 'relative' | 'absolute'; value: number };
}

const POT_GRID = [60, 80, 100, 120, 150, 200] as const;
/** 下注额按底池比例取，保证口算友好 */
const BET_FRACTIONS = [0.25, 1 / 3, 0.5, 0.75, 1, 1.5] as const;
const WIN_RATE_GRID = [52, 55, 58, 60] as const;
const NET_ODDS_GRID = [1, 2] as const;
const EDGE_GRID = [5, 10] as const;
const SD_GRID = [80, 90, 100] as const;
const Z_GRID = [1.645, 1.96] as const;
const BUY_IN_GRID = [10, 20, 30] as const;
const DEFENDER_GRID = [2, 3] as const;
/** Outs 取常见听牌型（卡顺 4 / 两对或三条 5 / 两头顺 8 / 同花 9 / 两头顺加同花 12） */
const OUTS_GRID = [4, 5, 8, 9, 12] as const;
const STREETS_GRID = [1, 2] as const;
/** 口袋对子档位数量与牌面露出的档数（露出的每张把该档从 6 种削到 3 种） */
const PAIR_TIER_GRID = [3, 4, 6] as const;
const BOARD_HIT_GRID = [0, 1, 2] as const;
/** HUD 计数取十位友好值，保证 AF 与 VPIP 都能口算到一位小数 */
const HUD_BET_GRID = [20, 30, 40, 60] as const;
const HUD_RAISE_GRID = [10, 20, 30] as const;
const HUD_CALL_GRID = [10, 20, 30] as const;
const HUD_HANDS_GRID = [18, 24, 30, 35, 40] as const;
const HUD_TOTAL_GRID = [100, 150, 200] as const;

/** 章节 → 演练槽位。未列出的章节（含短牌/单挑变体）返回 null，演练区不渲染 */
export const CHAPTER_DRILL_SLOTS: Readonly<Record<string, readonly DrillFormula[]>> = {
  't1-outs': ['outsEquity', 'requiredEquity'],
  't1-variance': ['requiredHands'],
  't2-ev': ['alpha', 'mdf'],
  't2-pot-odds': ['requiredEquity'],
  't2-implied-odds': ['requiredEquity'],
  't3-fundamental-theorem': ['requiredEquity'],
  't4-combinatorics': ['pairCombos'],
  't4-preflop-structure': ['alpha', 'mdf'],
  't4-structure-economics': ['alpha', 'mdf'],
  't5-game-theory': ['mdf'],
  't5-gto-concept': ['alpha'],
  't5-mdf-alpha': ['alpha', 'mdf'],
  't5-multiway-frequency': ['alpha', 'multiwayBluffFold'],
  't6-bet-purpose': ['alpha'],
  't6-sizing-theory': ['mdf', 'requiredEquity'],
  't6-geometric': ['requiredEquity'],
  't6-equity-realization': ['requiredEquity'],
  't7-exploit': ['alpha'],
  't7-stats': ['vpip', 'af'],
  't8-bankroll-psych': ['kelly', 'halfKelly', 'riskOfRuin'],
  't9-mop': ['alpha', 'requiredHands'],
  't9-alpha': ['alpha', 'mdf'],
  't9-multiway': ['multiwayBluffFold'],
  't9-unified': ['mdf'],
};

function pick<T>(values: readonly T[], rnd: () => number): T {
  return values[Math.floor(rnd() * values.length)] as T;
}

/** 底池与下注额成对生成，bet 取整到整数 bb */
function betPair(rnd: () => number): { pot: number; bet: number } {
  const pot = pick(POT_GRID, rnd);
  const bet = Math.round(pot * pick(BET_FRACTIONS, rnd));
  return { pot, bet };
}

export function calcDrillSeed(chapterId: string, slotIndex: number, attempt: number): number {
  return hashStringToSeed(`${chapterId}#d${slotIndex}#a${attempt}`);
}

/** 按公式算出的答案与判分口径（参数由 rollParams 决定，二者在此分离） */
interface DrillAnswer {
  expected: number;
  unit: DrillUnit;
  precision: number;
  tolerance: { mode: 'relative' | 'absolute'; value: number };
}

/** 按公式构造答案；返回 null 表示当前随机参数不满足出题条件（如 Kelly 无优势） */
function buildForFormula(formula: DrillFormula, params: Record<string, number>): DrillAnswer | null {
  switch (formula) {
    case 'alpha':
    case 'mdf': {
      const pot = params.pot as number;
      const bet = params.bet as number;
      const value = formula === 'alpha' ? calculateAlpha(pot, bet) : calculateMDF(pot, bet);
      return { expected: value * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'requiredEquity': {
      const pot = params.pot as number;
      const bet = params.bet as number;
      const value = requiredEquity(bet, pot + 2 * bet);
      return { expected: value * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'kelly':
    case 'halfKelly': {
      const winrate = params.winrate as number;
      const odds = params.odds as number;
      const fraction = formula === 'kelly'
        ? kellyFraction(winrate / 100, odds)
        : halfKellyFraction(winrate / 100, odds);
      if (fraction <= 0) return null;
      return { expected: fraction * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'requiredHands': {
      const hands = requiredHandsForEdge(params.edge as number, params.sd as number, params.z as number);
      return { expected: Math.round(hands), unit: 'hands', precision: 0, tolerance: { mode: 'relative', value: 0.05 } };
    }
    case 'riskOfRuin': {
      const value = riskOfRuin({
        winrateBB100: params.winrate as number,
        sdBB100: params.sd as number,
        bankrollBB: (params.buyins as number) * 100,
      });
      return { expected: value * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'multiwayBluffFold': {
      const pot = params.pot as number;
      const bet = params.bet as number;
      const defenders = params.defenders as number;
      const value = multiwayAllFold(calculateAlpha(pot, bet), defenders);
      return { expected: value * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'outsEquity': {
      const value = outsToEquity(params.outs as number, params.streets === 2 ? 2 : 1);
      return { expected: value * 100, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
    case 'pairCombos': {
      const value = pairTierCombos(params.tiers as number, params.boardHits as number);
      return { expected: value, unit: 'count', precision: 0, tolerance: { mode: 'absolute', value: 0 } };
    }
    case 'af': {
      const value = aggressionFactor(params.bets as number, params.raises as number, params.calls as number);
      return { expected: value, unit: 'ratio', precision: 1, tolerance: { mode: 'absolute', value: 0.05 } };
    }
    case 'vpip': {
      const value = vpipPercent(params.hands as number, params.total as number);
      return { expected: value, unit: 'percent', precision: 1, tolerance: { mode: 'absolute', value: 0.5 } };
    }
  }
}

function rollParams(formula: DrillFormula, rnd: () => number): Record<string, number> {
  switch (formula) {
    case 'alpha':
    case 'mdf':
    case 'requiredEquity':
    case 'multiwayBluffFold': {
      const { pot, bet } = betPair(rnd);
      const params: Record<string, number> = { pot, bet };
      if (formula === 'multiwayBluffFold') params.defenders = pick(DEFENDER_GRID, rnd);
      return params;
    }
    case 'kelly':
    case 'halfKelly':
      return { winrate: pick(WIN_RATE_GRID, rnd), odds: pick(NET_ODDS_GRID, rnd) };
    case 'requiredHands':
      return { edge: pick(EDGE_GRID, rnd), sd: pick(SD_GRID, rnd), z: pick(Z_GRID, rnd) };
    case 'riskOfRuin':
      return { winrate: pick(EDGE_GRID, rnd), sd: pick(SD_GRID, rnd), buyins: pick(BUY_IN_GRID, rnd) };
    case 'outsEquity':
      return { outs: pick(OUTS_GRID, rnd), streets: pick(STREETS_GRID, rnd) };
    case 'pairCombos': {
      const tiers = pick(PAIR_TIER_GRID, rnd);
      const hits = Math.min(pick(BOARD_HIT_GRID, rnd), tiers);
      return { tiers, boardHits: hits };
    }
    case 'af':
      return {
        bets: pick(HUD_BET_GRID, rnd),
        raises: pick(HUD_RAISE_GRID, rnd),
        calls: pick(HUD_CALL_GRID, rnd),
      };
    case 'vpip':
      return { hands: pick(HUD_HANDS_GRID, rnd), total: pick(HUD_TOTAL_GRID, rnd) };
  }
}

/** 生成某章某槽位的演练题；该章未登记槽位或该槽位无题源时返回 null */
export function buildCalcDrill(chapterId: string, slotIndex: number, attempt = 0): CalcDrill | null {
  const formulas = CHAPTER_DRILL_SLOTS[chapterId];
  const formula = formulas?.[slotIndex];
  if (!formula) return null;

  // 参数不满足出题条件时（如 Kelly 无优势）向后顺移一次随机流重试，最多 6 次，保证同 seed 结果确定
  for (let retry = 0; retry < 6; retry++) {
    const seed = calcDrillSeed(chapterId, slotIndex, attempt + retry * 97);
    const rnd = seededRandom(seed);
    const params = rollParams(formula, rnd);
    const built = buildForFormula(formula, params);
    if (built && Number.isFinite(built.expected)) {
      return {
        drillId: `${chapterId}#d${slotIndex}`,
        chapterId,
        slotIndex,
        formula,
        templateKey: `theory.drill.template.${formula}`,
        hintKey: `theory.drill.hint.${formula}`,
        params,
        ...built,
      };
    }
  }
  return null;
}

/** 逐题判分：命中容差为 correct，超容差为 incorrect，非数字/空为 invalid */
export function gradeCalcDrill(drill: CalcDrill, raw: string): 'correct' | 'incorrect' | 'invalid' {
  const trimmed = raw.trim().replace(',', '.');
  if (trimmed === '') return 'invalid';
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return 'invalid';
  const diff = Math.abs(value - drill.expected);
  const limit = drill.tolerance.mode === 'relative'
    ? Math.abs(drill.expected) * drill.tolerance.value
    : drill.tolerance.value;
  return diff <= limit ? 'correct' : 'incorrect';
}
