import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import {
  buildCalcDrill,
  calcDrillSeed,
  gradeCalcDrill,
  CHAPTER_DRILL_SLOTS,
  type CalcDrill,
} from './theoryCalcDrills';
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

/**
 * 演练题源守卫：
 * 1. 期望值必须与独立复算一致（防止参数与答案分叉）
 * 2. 同 seed 必须给出同一题（章内演练要可回访、可复算）
 * 3. 容差边界与非数字输入
 * 4. 模板插值占位符必须 ⊆ params 键集（模板 key 是动态拼接，staticKeyGuard 覆盖不到）
 */

const independentExpected = (drill: CalcDrill): number => {
  const p = drill.params;
  switch (drill.formula) {
    case 'alpha':
      return calculateAlpha(p.pot as number, p.bet as number) * 100;
    case 'mdf':
      return calculateMDF(p.pot as number, p.bet as number) * 100;
    case 'requiredEquity':
      return requiredEquity(p.bet as number, (p.pot as number) + 2 * (p.bet as number)) * 100;
    case 'kelly':
      return kellyFraction((p.winrate as number) / 100, p.odds as number) * 100;
    case 'halfKelly':
      return halfKellyFraction((p.winrate as number) / 100, p.odds as number) * 100;
    case 'requiredHands':
      return Math.round(requiredHandsForEdge(p.edge as number, p.sd as number, p.z as number));
    case 'riskOfRuin':
      return riskOfRuin({
        winrateBB100: p.winrate as number,
        sdBB100: p.sd as number,
        bankrollBB: (p.buyins as number) * 100,
      }) * 100;
    case 'multiwayBluffFold':
      return multiwayAllFold(
        calculateAlpha(p.pot as number, p.bet as number),
        p.defenders as number
      ) * 100;
    case 'outsEquity':
      return outsToEquity(p.outs as number, p.streets === 2 ? 2 : 1) * 100;
    case 'pairCombos':
      return pairTierCombos(p.tiers as number, p.boardHits as number);
    case 'af':
      return aggressionFactor(p.bets as number, p.raises as number, p.calls as number);
    case 'vpip':
      return vpipPercent(p.hands as number, p.total as number);
  }
};

const allDrills = (): CalcDrill[] => {
  const out: CalcDrill[] = [];
  for (const chapterId of Object.keys(CHAPTER_DRILL_SLOTS)) {
    const slots = CHAPTER_DRILL_SLOTS[chapterId] as readonly string[];
    for (let slot = 0; slot < slots.length; slot++) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const drill = buildCalcDrill(chapterId, slot, attempt);
        if (drill) out.push(drill);
      }
    }
  }
  return out;
};

describe('theoryCalcDrills 题源', () => {
  const drills = allDrills();

  it('每题期望值与独立复算一致，且落在可读区间', () => {
    expect(drills.length).toBeGreaterThan(40);
    for (const drill of drills) {
      expect(Number.isFinite(drill.expected), `${drill.drillId} 应为有限数`).toBe(true);
      expect(drill.expected, `${drill.drillId} 非正`).toBeGreaterThan(0);
      expect(drill.expected, `${drill.drillId} 与独立复算一致`).toBeCloseTo(independentExpected(drill), 6);
    }
  });

  it('同 (章节, 槽位, attempt) 两次生成完全一致', () => {
    for (const [chapterId, slots] of Object.entries(CHAPTER_DRILL_SLOTS)) {
      for (let slot = 0; slot < slots.length; slot++) {
        expect(buildCalcDrill(chapterId, slot, 1)).toEqual(buildCalcDrill(chapterId, slot, 1));
      }
    }
  });

  it('换题会改变题面参数，但不越出该槽位的公式族', () => {
    for (const [chapterId, slots] of Object.entries(CHAPTER_DRILL_SLOTS)) {
      for (let slot = 0; slot < slots.length; slot++) {
        const a = buildCalcDrill(chapterId, slot, 0);
        const b = buildCalcDrill(chapterId, slot, 5);
        if (!a || !b) continue;
        expect(b.formula).toBe(a.formula);
      }
    }
  });

  it('seed 不掺日期与用户：仅由章节/槽位/attempt 决定', () => {
    expect(calcDrillSeed('t5-mdf-alpha', 0, 0)).toBe(calcDrillSeed('t5-mdf-alpha', 0, 0));
    expect(calcDrillSeed('t5-mdf-alpha', 0, 0)).not.toBe(calcDrillSeed('t5-mdf-alpha', 1, 0));
    expect(calcDrillSeed('t5-mdf-alpha', 0, 0)).not.toBe(calcDrillSeed('t5-mdf-alpha', 0, 1));
  });

  it('容差边界与非数字输入', () => {
    const drill = buildCalcDrill('t5-mdf-alpha', 0, 0) as CalcDrill;
    expect(gradeCalcDrill(drill, drill.expected.toFixed(1))).toBe('correct');
    expect(gradeCalcDrill(drill, ` ${drill.expected.toFixed(1)} `)).toBe('correct');
    expect(gradeCalcDrill(drill, String(drill.expected + 8))).toBe('incorrect');
    expect(gradeCalcDrill(drill, '')).toBe('invalid');
    expect(gradeCalcDrill(drill, 'abc')).toBe('invalid');
    // 期望值恒为正（百分比/手数），负数只能判 incorrect 而非 invalid
    expect(drill.expected).toBeGreaterThan(0);
    expect(gradeCalcDrill(drill, '-12')).toBe('incorrect');
  });

  it('未登记章节与越界槽位返回 null（演练区据此不渲染）', () => {
    expect(buildCalcDrill('t1-combinatorics', 0)).toBeNull();
    expect(buildCalcDrill('t5sd-mdf', 0)).toBeNull();
    expect(buildCalcDrill('t9-hu', 0)).toBeNull();
    expect(buildCalcDrill('t5-mdf-alpha', 99)).toBeNull();
  });

  it('模板与提示的插值占位符必须 ⊆ params 键集（双语两侧）', () => {
    const sides = ['zh', 'en'] as const;
    for (const side of sides) {
      const json = JSON.parse(fs.readFileSync(`src/i18n/locales/${side}/theory.json`, 'utf8')) as {
        drill?: { template?: Record<string, string> };
      };
      const templates = json.drill?.template;
      expect(templates, `${side} 缺 theory.drill.template`).toBeDefined();
      for (const drill of drills) {
        const template = templates?.[drill.formula] ?? '';
        expect(template, `${side} 缺模板 theory.drill.template.${drill.formula}`).toBeTruthy();
        const keys = new Set(Object.keys(drill.params));
        for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) {
          expect(keys.has(match[1] as string), `${side}·${drill.formula} 占位符 {{${match[1]}}} 不在 params 中`).toBe(true);
        }
      }
    }
  });

  // 单位标签同样是动态 key（`theory.drill.unit.${unit}`），staticKeyGuard 覆盖不到，
  // 缺 key 会让判分行渲染成键面字（如 "19.1theory.drill.unit.ratio"），故在此兜住。
  it('每个 drill 的单位标签在双语 locale 中必须存在且非空', () => {
    const sides = ['zh', 'en'] as const;
    const units = new Set(drills.map((d) => d.unit));
    expect(units.size, '题源应覆盖多个单位，否则本守卫无意义').toBeGreaterThan(1);
    for (const side of sides) {
      const json = JSON.parse(fs.readFileSync(`src/i18n/locales/${side}/theory.json`, 'utf8')) as {
        drill?: { unit?: Record<string, string> };
      };
      const labels = json.drill?.unit;
      expect(labels, `${side} 缺 theory.drill.unit`).toBeDefined();
      for (const unit of units) {
        const label = labels?.[unit] ?? '';
        expect(label, `${side} 缺单位标签 theory.drill.unit.${unit}`).toBeTruthy();
      }
    }
  });

  // 零持久是刻意的产品决策（演练不得污染全局连错计数、每日题量预算与能力分），
  // 组件测试只能证明"这次没改到状态"，此处从源码层面拦住"顺手加计数"的回归。
  it('演练组件源码不得接入测评与持久化链路', () => {
    const rawModules = import.meta.glob('../components/TheoryCalcDrill.tsx', {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    const paths = Object.keys(rawModules);
    expect(paths.length, '未读到演练组件源码').toBe(1);
    const raw = rawModules[paths[0] as string] as string;

    const forbidden = [
      'recordAnswer(',
      'updateElo(',
      'addReviewItem(',
      'completeChapter(',
      'trainingEvents.emit',
      'recordTrainingDay(',
    ];
    for (const token of forbidden) {
      expect(raw.includes(token), `演练组件不得调用 ${token}`).toBe(false);
    }
  });
});
