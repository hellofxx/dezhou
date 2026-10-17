import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 发牌员纸条（.dealer-slip）对比度守卫（WCAG 2.1 §1.4.6 / §1.4.3）
 *
 * 纸条是独立于暗色房间色板的 paper 材质：Dialog / 移动端反馈 Sheet / ResultSummary /
 * 快捷键浮层都把文字与语义色重锚到 --paper-* 深阶。任何一次调色若把 ink 提亮或把
 * 黄铜/语义色取亮阶，都会让纸面文字跌破 AA，而 jsdom 里 axe 的 color-contrast
 * 因无布局计算恒为 inapplicable，因此必须在源头（globals.css token）上算对比度。
 *
 * 断言口径：
 * - --paper-ink 于 --paper ≥ 7:1（正文/标题）
 * - --paper-ink-dim / -ink-muted / -brass / -success / -danger / -warning / -info ≥ 4.5:1
 * - light theme 覆盖 --paper / --paper-brass 后同样达标（合并 :root + light 令牌）
 * - .dealer-slip 必须把 canonical 与 alias token 一并重锚到 paper 深阶
 */

const CSS_PATH = fileURLToPath(new URL('./styles/globals.css', import.meta.url));
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

function mergeTokens(selector: string): Map<string, string> {
  const merged = new Map<string, string>();
  for (const block of BLOCKS.filter((entry) => entry.selector === selector)) {
    for (const [name, value] of declarations(block.body)) merged.set(name, value);
  }
  return merged;
}

/** 默认主题 = :root */
const DARK_TOKENS = mergeTokens(':root');
/** light 主题：只覆盖纸底/黄铜等少数令牌，其余继承 :root */
const LIGHT_TOKENS = new Map([...DARK_TOKENS, ...mergeTokens('html[data-theme="light"]')]);

const DEALER_SLIP_TOKENS = (() => {
  const block = BLOCKS.find((entry) => entry.selector === '.dealer-slip');
  expect(block?.body, 'globals.css 应存在顶层 .dealer-slip 块').toBeDefined();
  return declarations(block?.body ?? '');
})();

function token(tokens: Map<string, string>, name: string): string {
  const value = tokens.get(name);
  expect(value, `缺少 token ${name}`).toBeDefined();
  return value as string;
}

function parseHex(value: string): { r: number; g: number; b: number } {
  const match = /^#([0-9a-f]{6})$/i.exec(value.trim());
  const hex = match?.[1];
  if (!hex) throw new Error(`期望 6 位 hex 颜色，实际收到：${value}`);
  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
}

/** WCAG 2.x 相对亮度（sRGB 线性化） */
function relativeLuminance(color: { r: number; g: number; b: number }): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(parseHex(foreground));
  const b = relativeLuminance(parseHex(background));
  const [lighter, darker] = a >= b ? [a, b] : [b, a];
  return (lighter + 0.05) / (darker + 0.05);
}

const SECONDARY_TOKENS = [
  '--paper-ink-dim',
  '--paper-ink-muted',
  '--paper-brass',
  '--paper-success',
  '--paper-danger',
  '--paper-warning',
  '--paper-info',
];

const THEMES: { label: string; tokens: Map<string, string> }[] = [
  { label: '默认暗色主题 (:root)', tokens: DARK_TOKENS },
  { label: 'light 主题 (html[data-theme="light"])', tokens: LIGHT_TOKENS },
];

describe('dealer-slip 纸条对比度（WCAG AA）', () => {
  for (const { label, tokens } of THEMES) {
    it(`${label}：--paper-ink 于 --paper ≥ 7:1`, () => {
      const paper = token(tokens, '--paper');
      const ink = token(tokens, '--paper-ink');
      const ratio = contrastRatio(ink, paper);
      expect(ratio, `${ink} on ${paper} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(7);
    });

    for (const name of SECONDARY_TOKENS) {
      it(`${label}：${name} 于 --paper ≥ 4.5:1`, () => {
        const paper = token(tokens, '--paper');
        const color = token(tokens, name);
        const ratio = contrastRatio(color, paper);
        expect(ratio, `${color} on ${paper} = ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }

  it('.dealer-slip 把 canonical 与 alias 令牌重锚到 paper 深阶', () => {
    const expected: Record<string, string> = {
      '--ivory': 'var(--paper-ink)',
      '--brass': 'var(--paper-brass)',
      '--poker-success': 'var(--paper-success)',
      '--success': 'var(--paper-success)',
      '--felt': 'var(--paper)',
      '--surface': 'var(--paper)',
      '--color-background': 'var(--paper)',
    };

    for (const [name, value] of Object.entries(expected)) {
      expect(DEALER_SLIP_TOKENS.get(name), `.dealer-slip ${name} 应为 ${value}`).toBe(value);
    }
  });
});
