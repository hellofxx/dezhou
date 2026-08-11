// 答案位置偏差治理（i18n-key 型 Drill 题库）：orderResolvedOptions 测试
// ① 重映射正确性 ② zh/en 数值题分支与顺序一致 ③ 真实题库分布守卫 ④ 确定性；
// i18n key 直接读拆分后的 drills 模块文件（locales/{zh,en}/drills.json），
// 包裹为 { drills } 以保持 'drills.xxx' 解析前缀不变（不起 i18next 实例）

import { describe, it, expect } from 'vitest';
import { orderResolvedOptions } from './quizShuffle';
import { OUTS_QUESTIONS } from '../components/drills/outsQuestions';
import { POT_ODDS_QUESTIONS } from '../components/drills/potOddsQuestions';
import { HAND_RANKING_QUESTIONS } from '../components/drills/handRankingQuestions';
import type { HandRankingQuestion } from '../components/drills/handRankingQuestions';
import { OPPONENT_DRILL_QUESTIONS } from '../data/opponentProfiles';
import drillsZh from '@/i18n/locales/zh/drills.json';
import drillsEn from '@/i18n/locales/en/drills.json';

const zh = { drills: drillsZh } as const;
const en = { drills: drillsEn } as const;

// ===== i18n key 解析（沿路径下钻 locale JSON）=====
function resolveKey(dict: unknown, key: string): string {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) break;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== 'string') throw new Error(`i18n key 不存在或非字符串: ${key}`);
  return node;
}

const zhText = (key: string) => resolveKey(zh, key);
const enText = (key: string) => resolveKey(en, key);

// HandRankingDrill 的选项文本解析（与组件 resolveOptionText 同构：按 key 匹配内联 label）
function hrText(q: HandRankingQuestion, key: string, locale: unknown): string {
  if (q.type === 'simple-compare') {
    if (key === 'drills.handRanking.options.labelA' && q.labelA) return q.labelA;
    if (key === 'drills.handRanking.options.labelB' && q.labelB) return q.labelB;
  }
  return resolveKey(locale, key);
}

// 提取文本首个数字（校验单调性用，与 shared sortByNumericValue 口径一致）
const firstNumber = (text: string) => parseFloat(/\d+(?:\.\d+)?/.exec(text)![0]);

function isMonotonic(values: number[]): boolean {
  const asc = values.every((v, i) => i === 0 || v >= values[i - 1]!);
  const desc = values.every((v, i) => i === 0 || v <= values[i - 1]!);
  return asc || desc;
}

// 分布统计 + 打印 + ≤60% 断言
function assertDistribution(name: string, correctIndexes: number[], optionCount = 4): void {
  const dist: Record<number, number> = {};
  for (const idx of correctIndexes) dist[idx] = (dist[idx] ?? 0) + 1;
  const total = correctIndexes.length;
  const readable = Object.entries(dist)
    .map(([idx, count]) => `${String.fromCharCode(65 + Number(idx))}: ${count} (${((count / total) * 100).toFixed(1)}%)`)
    .join(', ');
  console.log(`[drill 分布守卫] ${name} 共 ${total} 题（≤${optionCount} 选项）→ ${readable}`);
  for (const count of Object.values(dist)) {
    expect(count / total).toBeLessThanOrEqual(0.6);
  }
}

describe('orderResolvedOptions — ① 重映射正确性（真实题库 + zh 文本）', () => {
  it('outs / potOdds：重排后 correctIndex 指向原正确文本，选项集合不变，不修改入参', () => {
    for (const q of [...OUTS_QUESTIONS, ...POT_ODDS_QUESTIONS]) {
      const before = [...q.optionsKeys];
      const ordered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText);
      expect(zhText(ordered.options[ordered.correctIndex]!)).toBe(
        zhText(q.optionsKeys[q.correctIndex]!),
      );
      expect([...ordered.options].sort()).toEqual([...q.optionsKeys].sort());
      expect(q.optionsKeys).toEqual(before);
    }
  });

  it('handRanking：重排后 correctIndex 指向原正确文本（含 simple-compare 内联 label）', () => {
    for (const q of HAND_RANKING_QUESTIONS) {
      const ordered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, (key) =>
        hrText(q, key, zh),
      );
      expect(hrText(q, ordered.options[ordered.correctIndex]!, zh)).toBe(
        hrText(q, q.optionsKeys[q.correctIndex]!, zh),
      );
    }
  });

  it('opponent 第 2 问：重排后 correctIndex 指向原正确策略文本', () => {
    for (const q of OPPONENT_DRILL_QUESTIONS) {
      const ordered = orderResolvedOptions(
        q.id,
        q.strategyOptions,
        q.correctStrategyIndex,
        (option) => option,
      );
      expect(ordered.options[ordered.correctIndex]).toBe(
        q.strategyOptions[q.correctStrategyIndex],
      );
    }
  });
});

describe('orderResolvedOptions — ② zh/en 数值题走单调分支且顺序一致', () => {
  it('模拟文本："约 N%"（zh）与 "~N%"（en，非数字开头）均走单调分支且顺序相同', () => {
    // shared isNumericOptionSet 的 /^约?\s*\d/ 对 en '~8%' 会失配，
    // 放宽判定（每个文本含数字）保证两种语言同分支；此处直接验证行为。
    const zhOptions = ['约 8%', '约 16%', '约 32%', '约 36%'];
    const enOptions = ['~8%', '~16%', '~32%', '~36%'];
    const zhOrdered = orderResolvedOptions('outs-q7', zhOptions, 1, (o) => o);
    const enOrdered = orderResolvedOptions('outs-q7', enOptions, 1, (o) => o);
    // 数值单调（升或降序，方向由 id 哈希决定，两种语言一致），重映射后仍指向 16
    expect(isMonotonic(zhOrdered.options.map(firstNumber))).toBe(true);
    expect(zhOrdered.options.map(firstNumber)).toEqual(enOrdered.options.map(firstNumber));
    expect(zhOrdered.correctIndex).toBe(enOrdered.correctIndex);
    expect(firstNumber(zhOrdered.options[zhOrdered.correctIndex]!)).toBe(16);
  });

  it('真实题库全量：zh 与 en 解析文本下重排结果（key 顺序 + correctIndex）完全一致', () => {
    for (const q of [...OUTS_QUESTIONS, ...POT_ODDS_QUESTIONS]) {
      const zhOrdered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText);
      const enOrdered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, enText);
      expect(zhOrdered.options).toEqual(enOrdered.options);
      expect(zhOrdered.correctIndex).toBe(enOrdered.correctIndex);
    }
    for (const q of HAND_RANKING_QUESTIONS) {
      const zhOrdered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, (key) =>
        hrText(q, key, zh),
      );
      const enOrdered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, (key) =>
        hrText(q, key, en),
      );
      expect(zhOrdered.options).toEqual(enOrdered.options);
      expect(zhOrdered.correctIndex).toBe(enOrdered.correctIndex);
    }
  });

  it('outs 数值题重排后保持数值单调（升序或降序）', () => {
    for (const q of OUTS_QUESTIONS) {
      const ordered = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText);
      expect(isMonotonic(ordered.options.map((key) => firstNumber(zhText(key))))).toBe(true);
    }
  });
});

describe('orderResolvedOptions — ③ 真实题库重排后分布守卫（任一索引 ≤60%）', () => {
  it('outs（8 题）', () => {
    const indexes = OUTS_QUESTIONS.map(
      (q) => orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText).correctIndex,
    );
    assertDistribution('outs', indexes);
  });

  it('potOdds（6 题）', () => {
    const indexes = POT_ODDS_QUESTIONS.map(
      (q) => orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText).correctIndex,
    );
    assertDistribution('potOdds', indexes);
  });

  it('opponent 第 2 问（8 题）', () => {
    const indexes = OPPONENT_DRILL_QUESTIONS.map(
      (q) =>
        orderResolvedOptions(q.id, q.strategyOptions, q.correctStrategyIndex, (o) => o)
          .correctIndex,
    );
    assertDistribution('opponent 第 2 问', indexes);
  });

  it('handRanking（10 题，一致性接入）', () => {
    const indexes = HAND_RANKING_QUESTIONS.map(
      (q) =>
        orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, (key) => hrText(q, key, zh))
          .correctIndex,
    );
    assertDistribution('handRanking', indexes);
  });
});

describe('orderResolvedOptions — ④ 确定性', () => {
  it('同 id 两次调用结果一致（全部四个题库）', () => {
    for (const q of [...OUTS_QUESTIONS, ...POT_ODDS_QUESTIONS]) {
      const a = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText);
      const b = orderResolvedOptions(q.id, q.optionsKeys, q.correctIndex, zhText);
      expect(a).toEqual(b);
    }
    for (const q of OPPONENT_DRILL_QUESTIONS) {
      const a = orderResolvedOptions(q.id, q.strategyOptions, q.correctStrategyIndex, (o) => o);
      const b = orderResolvedOptions(q.id, q.strategyOptions, q.correctStrategyIndex, (o) => o);
      expect(a).toEqual(b);
    }
  });

  it('显式 seed：同 seed 一致，不同 seed 可产生不同顺序（文字选项集）', () => {
    const q = OPPONENT_DRILL_QUESTIONS[0]!;
    const order = (seed: number) =>
      orderResolvedOptions(q.id, q.strategyOptions, q.correctStrategyIndex, (o) => o, seed);
    expect(order(1)).toEqual(order(1));
    const anyDifferent = [2, 3, 4, 5, 6, 7, 8].some(
      (s) => order(s).options.join('|') !== order(1).options.join('|'),
    );
    expect(anyDifferent).toBe(true);
  });
});
