import type { TFunction } from 'i18next';
import type { CalcDrill, DrillUnit } from './theoryCalcDrills';

/**
 * CalcDrill 分步解答装配（读→算→测的"错后脚手架"，Fix 3 / D6）。
 *
 * 三步结构：公式陈述（复用 theory.drill.hint.<formula>）→ 数值代入串
 * （drill.params 拼纯数学式，语言中立，zh/en 同串）→ 答案
 * （drill.expected.toFixed(precision) + 单位，期望值由 theoryCalcDrills
 * 经 theoryFormulas 现算，本文件不出现任何硬编码答案）。
 *
 * 零持久口径与 TheoryCalcDrill 一致：纯函数，不触碰任何 store / 事件。
 */
export interface DrillSolutionStep {
  kind: 'formula' | 'substitute' | 'answer';
  text: string;
}

/** 单位标签：显式字面量 key（模板 key 会绕过 staticKeyGuard） */
function unitLabel(unit: DrillUnit, t: TFunction): string {
  switch (unit) {
    case 'percent':
      return t('theory.drill.unit.percent');
    case 'hands':
      return t('theory.drill.unit.hands');
    case 'ratio':
      return t('theory.drill.unit.ratio');
    case 'count':
      return t('theory.drill.unit.count');
  }
}

/** 数值代入串：按公式族把 params 拼成可手算复核的纯数学式 */
function substitution(drill: CalcDrill): string {
  const p = drill.params;
  const pot = p.pot ?? 0;
  const bet = p.bet ?? 0;
  switch (drill.formula) {
    case 'alpha':
      return `α = ${bet} ÷ (${pot} + ${bet}) × 100`;
    case 'mdf':
      return `MDF = ${pot} ÷ (${pot} + ${bet}) × 100`;
    case 'requiredEquity':
      return `Eq = ${bet} ÷ (${pot} + 2 × ${bet}) × 100`;
    case 'kelly':
    case 'halfKelly': {
      const winrate = p.winrate ?? 0;
      const odds = p.odds ?? 0;
      // q 用 (100−winrate)/100 而非 1−p，避免二进制浮点尾差污染展示串
      const win = winrate / 100;
      const lose = (100 - winrate) / 100;
      const full = `(${odds} × ${win} − ${lose}) ÷ ${odds}`;
      return drill.formula === 'kelly'
        ? `f* = ${full} × 100`
        : `f*/2 = (${full}) ÷ 2 × 100`;
    }
    case 'requiredHands': {
      const edge = p.edge ?? 0;
      const sd = p.sd ?? 0;
      const z = p.z ?? 0;
      return `n = (${z} × (${sd} ÷ 10) ÷ (${edge} ÷ 100))²`;
    }
    case 'riskOfRuin': {
      const winrate = p.winrate ?? 0;
      const sd = p.sd ?? 0;
      const bankroll = (p.buyins ?? 0) * 100;
      return `ROR = exp(−2 × (${winrate} ÷ 100) × ${bankroll} ÷ (${sd} ÷ 10)²) × 100`;
    }
    case 'multiwayBluffFold': {
      const defenders = p.defenders ?? 0;
      return `(${bet} ÷ (${pot} + ${bet}))^${defenders} × 100`;
    }
    case 'outsEquity': {
      const outs = p.outs ?? 0;
      return (p.streets ?? 1) === 2
        ? `(1 − (${47 - outs} ÷ 47) × (${46 - outs} ÷ 46)) × 100`
        : `${outs} ÷ 47 × 100`;
    }
    case 'pairCombos': {
      const tiers = p.tiers ?? 0;
      const hits = p.boardHits ?? 0;
      return `(${tiers} − ${hits}) × 6 + ${hits} × 3`;
    }
    case 'af':
      return `AF = (${p.bets ?? 0} + ${p.raises ?? 0}) ÷ ${p.calls ?? 0}`;
    case 'vpip':
      return `VPIP = ${p.hands ?? 0} ÷ ${p.total ?? 0} × 100`;
  }
}

/** 装配三步解答：公式 → 代入 → 答案（答案与判分口径同源，禁硬编码） */
export function buildDrillSolution(drill: CalcDrill, t: TFunction): DrillSolutionStep[] {
  return [
    { kind: 'formula', text: t(drill.hintKey) },
    { kind: 'substitute', text: substitution(drill) },
    {
      kind: 'answer',
      text: `${drill.expected.toFixed(drill.precision)}${unitLabel(drill.unit, t)}`,
    },
  ];
}