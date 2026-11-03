import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 变体规则 UI 文案守卫。
 *
 * 防的缺陷：变体描述与理论数据分属两处事实源，规则文案曾出现方向倒置——
 * 单挑「翻后 SB 先行动」（应为 BB）、短牌「顺子 > 三条」（本模块 house rule 为三条 > 顺子）。
 * 这里把 UI 文案锁回单源：`variantRules.ts` 的 headsUpRules / shortDeckRules。
 */

const read = (rel: string) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');
const readJson = (rel: string) => JSON.parse(read(rel)) as Record<string, unknown>;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

const HU_BAD = [
  /翻后[^。；\n]{0,20}SB[^。；\n]{0,10}(先|第一个)/,
  /postflop[^.\n]{0,30}SB[^.\n]{0,20}(acts?\s+first|first\s+to\s+act)/i,
  /SB[^.\n]{0,30}(acts?\s+first|first\s+to\s+act)[^.\n]{0,30}postflop/i,
] as const;

const HU_GOOD = [
  /翻后[^。；\n]{0,20}BB[^。；\n]{0,10}先行动/,
  /BB[^.\n]{0,30}(acts?\s+first|first\s+to\s+act)[^.\n]{0,30}postflop/i,
  /postflop[^.\n]{0,30}BB[^.\n]{0,30}(acts?\s+first|first\s+to\s+act)/i,
] as const;

function assertHuCopy(label: string, text: string): void {
  expect(text, `${label} 不得为空`).not.toBe('');
  const clauses = text.split(/[，,。；;\n]/).map((s) => s.trim()).filter(Boolean);
  for (const clause of clauses) {
    for (const re of HU_BAD) {
      expect(re.test(clause), `${label} 出现单挑翻后方向倒置：${clause}`).toBe(false);
    }
  }
  expect(
    clauses.some((clause) => HU_GOOD.some((re) => re.test(clause))),
    `${label} 缺少「翻后 BB 先行动」表述：${text}`,
  ).toBe(true);
}

function eloHeadsUpBlock(): string {
  const src = read('shared/types/elo.ts');
  const start = src.indexOf("'heads-up':");
  expect(start, 'elo.ts 中未找到 heads-up 变体块').toBeGreaterThan(-1);
  const end = src.indexOf('\n  },', start);
  expect(end, 'elo.ts 中 heads-up 变体块边界异常').toBeGreaterThan(start);
  return src.slice(start, end);
}

describe('变体规则文案与单源一致', () => {
  it('单挑：variant.json 与 elo.ts 的描述均为翻后 BB 先行动', () => {
    const zh = obj(obj(readJson('i18n/locales/zh/variant.json')).description);
    const en = obj(obj(readJson('i18n/locales/en/variant.json')).description);
    assertHuCopy('zh variant.description.heads-up', str(zh['heads-up']));
    assertHuCopy('en variant.description.heads-up', str(en['heads-up']));
    assertHuCopy('shared/types/elo.ts heads-up', eloHeadsUpBlock());
  });

  it('短牌：variant.json / rangeTrainer 文案为三条 > 顺子，且与 variantRules 单源一致', () => {
    const rules = read('features/theory-academy/data/levels/variants/variantRules.ts');
    expect(rules).toMatch(/tripsBeatsStraight:\s*true/);

    const zh = obj(readJson('i18n/locales/zh/variant.json'));
    const en = obj(readJson('i18n/locales/en/variant.json'));
    const zhRules = obj(zh['shortDeckRules']);
    const enRules = obj(en['shortDeckRules']);
    expect(str(zhRules['tripsBeatsStraight'])).toBe('三条 > 顺子');
    expect(str(enRules['tripsBeatsStraight'])).toBe('Trips > Straight');
    expect(zhRules).not.toHaveProperty('straightBeatsTrips');
    expect(enRules).not.toHaveProperty('straightBeatsTrips');
    expect(str(zh['descShortDeck'])).toContain('三条>顺子');
    expect(str(en['descShortDeck'])).toMatch(/trips\s*>\s*straight/i);
    expect(str(obj(zh['description'])['short-deck'])).not.toContain('顺子>三条');
    expect(str(obj(en['description'])['short-deck'])).not.toMatch(/straight\s*>\s*trips/i);

    const zhHint = str(obj(obj(readJson('i18n/locales/zh/rangeTrainer.json')).variant)['shortDeckHint']);
    const enHint = str(obj(obj(readJson('i18n/locales/en/rangeTrainer.json')).variant)['shortDeckHint']);
    expect(zhHint).toContain('三条 > 顺子');
    expect(zhHint).not.toContain('顺子 > 三条');
    expect(enHint).toContain('Three of a Kind > Straight');
    expect(enHint).not.toContain('Straight > Three of a Kind');
  });
});
