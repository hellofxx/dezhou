import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 变体规则 UI 文案守卫。
 *
 * 防的缺陷：变体描述与理论数据分属两处事实源，规则文案曾出现方向倒置——
 * 单挑「翻后 SB 先行动」（应为 BB）、短牌「顺子 > 三条」（本模块 house rule 为三条 > 顺子）。
 * 这里把 UI 文案锁回单源：单挑规则卡读 shared `headsUpRules.ts`（两院共用单源），
 * 短牌读 theory 侧 `variantRules.ts` 的 shortDeckRules（仅理论使用，未提升到 shared）。
 *
 * 单挑规则卡的方向值（翻前先行动 / 翻后先行动）必须与 positionDynamics 布尔同向，
 * 且 shared 纯函数产出的 `variant.headsUpRules.*` key 必须在 zh / en 双词典可解析——
 * 否则包装层静默渲染裸 key（staticKeyGuard 扫不到变量 key）。
 */

const read = (rel: string) => readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');
const readJson = (rel: string) => JSON.parse(read(rel)) as Record<string, unknown>;

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' ? (v as Json) : {});
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** 单挑规则卡必须具备的文案 key（包装层用显式字面量 key，缺一即渲染裸 key） */
const HEADS_UP_RULE_KEYS = [
  'title',
  'subtitle',
  'playersLabel',
  'deckSizeLabel',
  'preflopFirstLabel',
  'preflopFirstValue',
  'postflopFirstLabel',
  'postflopFirstValue',
  'blindsLabel',
  'anteLabel',
  'anteYes',
  'anteNo',
  'contextTitle',
  'contextStackLabel',
  'contextAnteLabel',
  'contextButtonLabel',
] as const;

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

/** 取文案里第一个盲注记号（SB / BB）；无则 null */
function blindToken(text: string): string | null {
  const token = text.split(/[^A-Za-z]+/).find((part) => part === 'SB' || part === 'BB');
  return token ?? null;
}

/**
 * 规则卡方向值一致性：翻前先行动必须是 SB、翻后先行动必须是 BB，
 * 且同一行不得顺带写上另一个盲注——混写（如「SB / BB」）会让方向倒置失去落点。
 */
function assertBlindValue(label: string, text: string, expected: 'SB' | 'BB'): void {
  expect(text, `${label} 不得为空`).not.toBe('');
  expect(blindToken(text), `${label} 应声明 ${expected}（实际：${text}）`).toBe(expected);
  const other = expected === 'SB' ? 'BB' : 'SB';
  expect(
    text.split(/[^A-Za-z]+/).includes(other),
    `${label} 不得同时出现 ${other}（方向值必须唯一指向 ${expected}）：${text}`,
  ).toBe(false);
}

/** shared 纯函数源码里出现的 `variant.headsUpRules.*` key（去重排序） */
function headsUpRuleKeysInUtil(): string[] {
  const src = read('shared/utils/academyVariantRules.ts');
  const matches = src.match(/variant\.headsUpRules\.[A-Za-z]+/g) ?? [];
  return [...new Set(matches)].sort();
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

  it('单挑规则卡：翻前先行动 = SB、翻后先行动 = BB，与 positionDynamics 布尔同向', () => {
    const rules = read('shared/constants/headsUpRules.ts');
    expect(rules).toMatch(/sbFirstActionPreflop:\s*true/);
    expect(rules).toMatch(/bbFirstActionPostflop:\s*true/);

    for (const lng of ['zh', 'en'] as const) {
      const info = obj(obj(readJson(`i18n/locales/${lng}/variant.json`))['headsUpRules']);
      assertBlindValue(
        `${lng} variant.headsUpRules.preflopFirstValue`,
        str(info['preflopFirstValue']),
        'SB',
      );
      assertBlindValue(
        `${lng} variant.headsUpRules.postflopFirstValue`,
        str(info['postflopFirstValue']),
        'BB',
      );
    }
  });

  it('单挑规则卡：文案 key 齐备，且 shared 纯函数产出的 key 在双词典可解析', () => {
    const utilKeys = headsUpRuleKeysInUtil();
    // 扫描面自检：纯函数 key 提取失效时不得空洞通过
    expect(utilKeys.length, 'shared 规则卡 key 提取数异常偏低').toBeGreaterThanOrEqual(13);

    for (const lng of ['zh', 'en'] as const) {
      const info = obj(obj(readJson(`i18n/locales/${lng}/variant.json`))['headsUpRules']);
      const missing = HEADS_UP_RULE_KEYS.filter((key) => str(info[key]).trim() === '');
      expect(missing, `${lng}/variant.json headsUpRules 缺失文案`).toEqual([]);

      const unresolved = utilKeys
        .map((key) => key.replace('variant.headsUpRules.', ''))
        .filter((leaf) => str(info[leaf]).trim() === '');
      expect(unresolved, `${lng}/variant.json 未覆盖 shared 规则卡 key`).toEqual([]);
    }
  });

  it('方向值判定器自检：倒置 / 双盲混写 / 空值必判红，正确值判绿', () => {
    expect(() => assertBlindValue('自检', 'BB', 'SB')).toThrow();
    expect(() => assertBlindValue('自检', 'SB', 'BB')).toThrow();
    expect(() => assertBlindValue('自检', 'SB / BB', 'SB')).toThrow();
    expect(() => assertBlindValue('自检', '', 'SB')).toThrow();
    expect(() => assertBlindValue('自检', 'SB（按钮位）', 'SB')).not.toThrow();
    expect(() => assertBlindValue('自检', 'BB', 'BB')).not.toThrow();
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
