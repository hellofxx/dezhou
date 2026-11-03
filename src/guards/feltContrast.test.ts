import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 暗底房间 / 发牌员纸条文本对比度守卫（WCAG 2.1 AA §1.4.3）
 *
 * jsdom 里 axe 的 color-contrast 因无布局计算恒为 inapplicable，文本对比度只能在源头
 * （globals.css 的 token 字面量）上算，否则一次「顺手取亮阶」的调色会让语义文本跌破
 * AA 而测试全绿。所有颜色都从 globals.css 解析，守卫里不登记任何色值。
 *
 * 断言口径：
 * - 暗色房间：--ivory-muted / --clay-text / --danger-text / --sage-text / --brass-text
 *   在 --felt 与 --felt-raised 上 ≥ 4.5:1
 * - 语义色铺底：--clay-text 落在「--clay 15% 铺底」（--felt / --walnut-raised 两种底）、
 *   --danger-text 落在 --danger-bg（自带透明度）铺底，均 ≥ 4.5:1
 * - 纸条：--paper-danger / --paper-success / --paper-brass / --paper-ink-muted 于 --paper
 *   ≥ 4.5:1，且 .dealer-slip 必须把四个文本语义 token 重锚到对应 paper 深阶
 * - light 主题：四个文本 token 于 light --paper / --paper-raised ≥ 4.5:1
 */

const MIN_CONTRAST = 4.5;

const CSS_PATH = fileURLToPath(new URL('../styles/globals.css', import.meta.url));

/** 去注释后再解析：注释里的 token 名与色值不参与断言 */
const CSS = readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

interface CssBlock {
  selector: string;
  body: string;
}

/** 只取顶层块：@media 内的 :root（prefers-contrast: high）不参与默认主题断言 */
function topLevelBlocks(css: string): CssBlock[] {
  const blocks: CssBlock[] = [];
  let depth = 0;
  let selectorFrom = 0;
  let bodyFrom = -1;
  let selector = '';

  for (let i = 0; i < css.length; i += 1) {
    const char = css[i];
    if (char === '{') {
      if (depth === 0) {
        selector = css.slice(selectorFrom, i).trim();
        bodyFrom = i + 1;
      }
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0 && bodyFrom >= 0) {
        blocks.push({ selector, body: css.slice(bodyFrom, i) });
        bodyFrom = -1;
        selectorFrom = i + 1;
      }
    } else if (char === ';' && depth === 0) {
      // 顶层语句（@import / @charset）不含声明块
      selectorFrom = i + 1;
    }
  }

  return blocks;
}

function declarations(body: string): Map<string, string> {
  const map = new Map<string, string>();
  const pattern = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match = pattern.exec(body);
  while (match !== null) {
    const [, name, value] = match;
    if (name && value) map.set(name, value.trim().replace(/\s+/g, ' '));
    match = pattern.exec(body);
  }
  return map;
}

const BLOCKS = topLevelBlocks(CSS);

/** 合并同名顶层块；块缺失时直接报错（禁止静默空解析） */
function blockDeclarations(selector: string): Map<string, string> {
  const matched = BLOCKS.filter((block) => block.selector === selector);
  if (matched.length === 0) throw new Error(`globals.css 顶层块「${selector}」未找到，解析失败`);
  const merged = new Map<string, string>();
  for (const block of matched) {
    for (const [name, value] of declarations(block.body)) merged.set(name, value);
  }
  return merged;
}

/** 默认（暗色）房间色板 = :root */
const DARK_TOKENS = blockDeclarations(':root');
/** light 主题只覆盖部分令牌，其余继承 :root */
const LIGHT_TOKENS = new Map([...DARK_TOKENS, ...blockDeclarations('html[data-theme="light"]')]);
/** 纸条作用域的 token 重锚 */
const SLIP_TOKENS = blockDeclarations('.dealer-slip');

interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX_PATTERN = /^#([0-9a-f]{6})$/i;
const RGB_PATTERN =
  /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

/** 只解析 6 位 hex 与 rgb()/rgba()；color-mix() 等表达式必须显式失败，禁止猜测 */
function parseColor(raw: string, context: string): Rgba {
  const value = raw.trim();
  const hex = HEX_PATTERN.exec(value);
  if (hex?.[1]) {
    const digits = hex[1];
    return {
      r: parseInt(digits.slice(0, 2), 16),
      g: parseInt(digits.slice(2, 4), 16),
      b: parseInt(digits.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgb = RGB_PATTERN.exec(value);
  if (rgb?.[1] !== undefined && rgb[2] !== undefined && rgb[3] !== undefined) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] === undefined ? 1 : Number(rgb[4]),
    };
  }
  throw new Error(
    `${context} 的颜色值「${value}」无法解析：只支持 6 位 hex 与 rgb()/rgba()，新增 color-mix() 需先换成字面量`,
  );
}

/** 沿 var(--x) 链解析到字面色；缺 token 或链断裂时抛出带链路的错误 */
function resolveToken(tokens: Map<string, string>, name: string, chain: string[] = []): Rgba {
  const path = [...chain, name].join(' → ');
  const raw = tokens.get(name);
  if (raw === undefined) {
    throw new Error(`缺少 token ${name}（解析链：${path}）—— globals.css 改名/删除时须同步守卫`);
  }
  const reference = /^var\(\s*(--[\w-]+)\s*\)$/.exec(raw);
  if (reference?.[1]) return resolveToken(tokens, reference[1], [...chain, name]);
  return parseColor(raw, `token ${name}（解析链：${path}）`);
}

/** source-over 复合：半透明前景叠到不透明底上 */
function blend(top: Rgba, bottom: Rgba): Rgba {
  const alpha = top.a + bottom.a * (1 - top.a);
  const channel = (upper: number, lower: number) =>
    (upper * top.a + lower * bottom.a * (1 - top.a)) / alpha;
  return { r: channel(top.r, bottom.r), g: channel(top.g, bottom.g), b: channel(top.b, bottom.b), a: alpha };
}

/** 前景若带透明度，须先复合到背景上再算对比度（WCAG 实际呈现口径） */
function flatten(foreground: Rgba, background: Rgba): Rgba {
  return foreground.a >= 1 ? foreground : blend(foreground, background);
}

/** WCAG 2.x 相对亮度（sRGB 线性化） */
function relativeLuminance(color: Rgba): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function hexOf(color: Rgba): string {
  const part = (value: number) => Math.round(value).toString(16).padStart(2, '0');
  return `#${part(color.r)}${part(color.g)}${part(color.b)}`;
}

function contrastRatio(foreground: Rgba, background: Rgba): number {
  const surface = flatten(background, background);
  const text = flatten(foreground, surface);
  const a = relativeLuminance(text);
  const b = relativeLuminance(surface);
  const [lighter, darker] = a >= b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

function expectContrast(foreground: Rgba, background: Rgba, label: string): void {
  const ratio = contrastRatio(foreground, background);
  const detail = `${label}：${hexOf(foreground)} on ${hexOf(background)} = ${ratio.toFixed(2)}:1（要求 ≥ ${MIN_CONTRAST}:1）`;
  expect(ratio, detail).toBeGreaterThanOrEqual(MIN_CONTRAST);
}

/** 暗底房间：文本专用阶 + 说明级 ink 必须在两级 felt 面上保持 AA */
const DARK_TEXT_TOKENS = ['--ivory-muted', '--clay-text', '--danger-text', '--sage-text', '--brass-text'];
const DARK_SURFACES = ['--felt', '--felt-raised'];

interface TintedSurface {
  label: string;
  text: string;
  /** 语义色铺底层；alpha 缺省时取该 token 自带的透明度 */
  tint: string;
  base: string;
  alpha?: number;
}

/** 语义色低透明度铺底：文字落在「错误 / 危险提示」底色上的最坏情形 */
const TINTED_SURFACES: TintedSurface[] = [
  {
    label: '--clay 15% over --felt',
    text: '--clay-text',
    tint: '--clay',
    base: '--felt',
    alpha: 0.15,
  },
  {
    label: '--clay 15% over --walnut-raised（.action-tile-aggressive 渐变面）',
    text: '--clay-text',
    tint: '--clay',
    base: '--walnut-raised',
    alpha: 0.15,
  },
  { label: '--danger-bg（自带透明度）over --felt', text: '--danger-text', tint: '--danger-bg', base: '--felt' },
];

/** 纸条色板：语义色与说明级 ink 在纸底上必须 AA */
const PAPER_TEXT_TOKENS = ['--paper-danger', '--paper-success', '--paper-brass', '--paper-ink-muted'];

/** .dealer-slip 必须把文本语义 token 重锚到 paper 深阶（值即 canonical 引用） */
const SLIP_REANCHOR: Record<string, string> = {
  '--clay-text': 'var(--paper-danger)',
  '--danger-text': 'var(--paper-danger)',
  '--sage-text': 'var(--paper-success)',
  '--brass-text': 'var(--paper-brass)',
};

/** light 主题：暗底房间的亮阶文本 token 翻成羊皮底深阶，需在 light 纸面 ≥ 4.5:1 */
const LIGHT_TEXT_TOKENS = ['--clay-text', '--danger-text', '--sage-text', '--brass-text'];
const LIGHT_PAPER_SURFACES = ['--paper', '--paper-raised'];

describe('felt 对比度：暗底房间色板（:root）', () => {
  it('解析自检：顶层块与 token 数量达到下限', () => {
    expect(BLOCKS.length, 'globals.css 顶层块数量偏低，解析器可能失效').toBeGreaterThanOrEqual(200);
    expect(DARK_TOKENS.size, ':root token 数量偏低').toBeGreaterThanOrEqual(120);
    expect(LIGHT_TOKENS.size).toBeGreaterThanOrEqual(DARK_TOKENS.size);
    expect(SLIP_TOKENS.size, '.dealer-slip token 数量偏低').toBeGreaterThanOrEqual(40);
  });

  for (const surface of DARK_SURFACES) {
    for (const text of DARK_TEXT_TOKENS) {
      it(`${text} 于 ${surface} ≥ ${MIN_CONTRAST}:1`, () => {
        const label = `${text} 于 ${surface}`;
        expectContrast(resolveToken(DARK_TOKENS, text), resolveToken(DARK_TOKENS, surface), label);
      });
    }
  }

  for (const spec of TINTED_SURFACES) {
    it(`${spec.text} 于 ${spec.label} ≥ ${MIN_CONTRAST}:1`, () => {
      const base = resolveToken(DARK_TOKENS, spec.base);
      const tint = resolveToken(DARK_TOKENS, spec.tint);
      const surface = blend({ ...tint, a: spec.alpha ?? tint.a }, base);
      expectContrast(resolveToken(DARK_TOKENS, spec.text), surface, `${spec.text} 于 ${spec.label}`);
    });
  }
});

describe('felt 对比度：发牌员纸条（paper 色板）', () => {
  const paper = resolveToken(DARK_TOKENS, '--paper');

  for (const text of PAPER_TEXT_TOKENS) {
    it(`${text} 于 --paper ≥ ${MIN_CONTRAST}:1`, () => {
      expectContrast(resolveToken(DARK_TOKENS, text), paper, `${text} 于 --paper`);
    });
  }

  it('.dealer-slip 把文本语义 token 重锚到 paper 深阶', () => {
    for (const [name, expected] of Object.entries(SLIP_REANCHOR)) {
      expect(SLIP_TOKENS.get(name), `.dealer-slip 应声明 ${name}: ${expected}`).toBe(expected);
    }
  });

  it('.dealer-slip 重锚后的取值即 paper 值，且于 --paper ≥ 4.5:1', () => {
    for (const name of Object.keys(SLIP_REANCHOR)) {
      const declared = SLIP_TOKENS.get(name) ?? '';
      const target = /^var\(\s*(--[\w-]+)\s*\)$/.exec(declared)?.[1];
      expect(target, `.dealer-slip ${name} 必须写成 var(--paper-*) 引用，实际：${declared}`).toBeDefined();
      const color = resolveToken(DARK_TOKENS, target as string);
      expectContrast(color, paper, `纸条 ${name}（→ ${target}）于 --paper`);
    }
  });
});

describe('felt 对比度：light 主题（html[data-theme="light"]）', () => {
  for (const surface of LIGHT_PAPER_SURFACES) {
    const background = resolveToken(LIGHT_TOKENS, surface);
    for (const text of LIGHT_TEXT_TOKENS) {
      it(`${text} 于 light ${surface} ≥ ${MIN_CONTRAST}:1`, () => {
        const label = `${text} 于 light ${surface}`;
        expectContrast(resolveToken(LIGHT_TOKENS, text), background, label);
      });
    }
  }
});