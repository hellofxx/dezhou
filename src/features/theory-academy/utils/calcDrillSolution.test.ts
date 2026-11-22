/**
 * buildDrillSolution 三步解答回归（Fix 3 / D6）。
 * 核心验收：数值代入串是**可复算的纯数学式** —— 用测试内迷你求值器独立求值，
 * 结果必须与 drill.expected（theoryFormulas 现算）一致，防止代入串与答案分叉；
 * 答案步 = expected.toFixed(precision) + 单位；公式步复用 theory.drill.hint.<formula>。
 * 另锁语言中立：en 下代入串无汉字、与 zh 逐字一致。
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import i18n from '@/i18n/config';
import { preloadI18n } from '@/i18n/preload';
import { buildCalcDrill, type DrillFormula } from './theoryCalcDrills';
import { buildDrillSolution } from './calcDrillSolution';

const HAN = /[㐀-鿿]/;

/** 12 公式族 → 已登记槽位的章节（与 CHAPTER_DRILL_SLOTS 对齐） */
const CASES: { formula: DrillFormula; chapterId: string; slot: number }[] = [
  { formula: 'alpha', chapterId: 't2-ev', slot: 0 },
  { formula: 'mdf', chapterId: 't2-ev', slot: 1 },
  { formula: 'requiredEquity', chapterId: 't2-pot-odds', slot: 0 },
  { formula: 'kelly', chapterId: 't8-bankroll-psych', slot: 0 },
  { formula: 'halfKelly', chapterId: 't8-bankroll-psych', slot: 1 },
  { formula: 'requiredHands', chapterId: 't1-variance', slot: 0 },
  { formula: 'riskOfRuin', chapterId: 't8-bankroll-psych', slot: 2 },
  { formula: 'multiwayBluffFold', chapterId: 't5-multiway-frequency', slot: 1 },
  { formula: 'outsEquity', chapterId: 't1-outs', slot: 0 },
  { formula: 'pairCombos', chapterId: 't4-combinatorics', slot: 0 },
  { formula: 'af', chapterId: 't7-stats', slot: 1 },
  { formula: 'vpip', chapterId: 't7-stats', slot: 0 },
];

/**
 * 迷你求值器（递归下降）：只支持代入串用到的 + − × ÷ ^ ² ( ) exp()，
 * 不用 eval / new Function，独立于生产代码复算。
 */
function evaluateSubstitution(expr: string): number {
  const eq = expr.indexOf('=');
  const rhs = eq >= 0 ? expr.slice(eq + 1) : expr;
  const normalized = rhs
    .replace(/²/g, '**2')
    .replace(/\^/g, '**')
    .replace(/÷/g, '/')
    .replace(/×/g, '*')
    .replace(/−/g, '-');
  const tokens = normalized.match(/\d+(?:\.\d+)?|\*\*|[()+\-*/]|exp/g) ?? [];
  let pos = 0;
  const peek = (): string | undefined => tokens[pos];
  const next = (): string => tokens[pos++] as string;
  const parsePrimary = (): number => {
    const tok = next();
    if (tok === '(') {
      const value = parseExpr();
      expect(next()).toBe(')');
      return value;
    }
    if (tok === 'exp') {
      expect(next()).toBe('(');
      const value = parseExpr();
      expect(next()).toBe(')');
      return Math.exp(value);
    }
    const value = Number(tok);
    expect(Number.isFinite(value), `非法记号 ${tok}`).toBe(true);
    return value;
  };
  const parsePower = (): number => {
    const base = parsePrimary();
    if (peek() === '**') {
      next();
      return base ** parseUnary();
    }
    return base;
  };
  const parseUnary = (): number => {
    if (peek() === '-') {
      next();
      return -parseUnary();
    }
    return parsePower();
  };
  const parseTerm = (): number => {
    let value = parseUnary();
    while (peek() === '*' || peek() === '/') {
      const op = next();
      const rhsValue = parseUnary();
      value = op === '*' ? value * rhsValue : value / rhsValue;
    }
    return value;
  };
  const parseExpr = (): number => {
    let value = parseTerm();
    while (peek() === '+' || peek() === '-') {
      const op = next();
      const rhsValue = parseTerm();
      value = op === '+' ? value + rhsValue : value - rhsValue;
    }
    return value;
  };
  const result = parseExpr();
  expect(pos, '代入串必须被完整消费').toBe(tokens.length);
  return result;
}

beforeAll(async () => {
  await preloadI18n(['theory'], 'zh');
  await i18n.changeLanguage('zh');
});

afterAll(async () => {
  await i18n.changeLanguage('zh');
});

describe('buildDrillSolution', () => {
  it.each(CASES)('$formula：三步结构完整，代入串复算与 expected 一致', ({ chapterId, slot }) => {
    const drill = buildCalcDrill(chapterId, slot, 0);
    expect(drill).not.toBeNull();
    const t = i18n.t.bind(i18n);
    const steps = buildDrillSolution(drill!, t);

    expect(steps.map((step) => step.kind)).toEqual(['formula', 'substitute', 'answer']);
    // 公式步复用既有 hint key（不另造公式文案）
    expect(steps[0]!.text).toBe(t(drill!.hintKey));
    // 代入串独立求值 ≈ expected（hands 为取整口径，先 round 再比）
    const evaluated = evaluateSubstitution(steps[1]!.text);
    const expected = drill!.unit === 'hands' ? Math.round(evaluated) : evaluated;
    const drift = Math.abs(expected - drill!.expected) / Math.max(1, Math.abs(drill!.expected));
    expect(drift, `代入串 ${steps[1]!.text} 复算 ${evaluated} ≠ ${drill!.expected}`).toBeLessThan(1e-9);
    // 答案步 = expected.toFixed(precision) + 单位（禁硬编码答案）
    const unitKey = `theory.drill.unit.${drill!.unit}`;
    expect(steps[2]!.text).toBe(`${drill!.expected.toFixed(drill!.precision)}${t(unitKey)}`);
    // 代入串必须真的用到题面参数（防"通用式"冒充代入）
    const paramValues = Object.values(drill!.params).map(String);
    const used = paramValues.filter((value) => steps[1]!.text.includes(value));
    expect(used.length).toBeGreaterThan(0);
  });

  it('代入串语言中立：en 下与 zh 逐字一致且无汉字，答案单位为英文', async () => {
    const drill = buildCalcDrill('t1-variance', 0, 0)!;
    const zhSteps = buildDrillSolution(drill, i18n.t.bind(i18n));
    await preloadI18n(['theory'], 'en');
    await i18n.changeLanguage('en');
    const enSteps = buildDrillSolution(drill, i18n.t.bind(i18n));

    expect(enSteps[1]!.text).toBe(zhSteps[1]!.text);
    expect(HAN.test(enSteps[1]!.text)).toBe(false);
    expect(HAN.test(enSteps[2]!.text)).toBe(false);
    expect(enSteps[0]!.text).toBe(i18n.t(drill.hintKey));
    expect(HAN.test(enSteps[0]!.text)).toBe(false);
    expect(enSteps[2]!.text).toContain('hands');
  });

  it('outsEquity 两张牌走精确式（含 47/46 未知牌数），一张牌走单街式', () => {
    // 扫若干 attempt 直到两种 streets 都出现（参数来自离散网格，确定性 seed）
    let oneStreet: string | null = null;
    let twoStreet: string | null = null;
    for (let attempt = 0; attempt < 24 && (!oneStreet || !twoStreet); attempt++) {
      const drill = buildCalcDrill('t1-outs', 0, attempt);
      if (!drill) continue;
      const text = buildDrillSolution(drill, i18n.t.bind(i18n))[1]!.text;
      if (drill.params.streets === 2) twoStreet = text;
      else oneStreet = text;
    }
    expect(oneStreet).toMatch(/^\d+ ÷ 47 × 100$/);
    expect(twoStreet).toMatch(/^\(1 − \(\d+ ÷ 47\) × \(\d+ ÷ 46\)\) × 100$/);
  });
});