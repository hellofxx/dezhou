import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { HELP_ARTICLES, QUICK_START_STEPS, CONCEPT_CARDS, FAQ_ITEMS } from './helpContent';
import type { HelpAccent } from '../types';
import helpZh from '@/i18n/locales/zh/help.json';
import helpEn from '@/i18n/locales/en/help.json';

const VALID_ICONS = new Set([
  'target', 'calculator', 'gamepad2', 'graduation-cap', 'library',
  'puzzle', 'clipboard-list', 'bar-chart3', 'book-open',
]);

const VALID_ACCENTS = new Set<HelpAccent>(['brass', 'info', 'success', 'frost', 'leather']);

describe('helpContent integrity', () => {
  it('HELP_ARTICLES id 唯一', () => {
    const ids = HELP_ARTICLES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('HELP_ARTICLES icon 在允许集合内', () => {
    for (const article of HELP_ARTICLES) {
      expect(VALID_ICONS.has(article.icon)).toBe(true);
    }
  });

  it('HELP_ARTICLES accent 在允许集合内', () => {
    for (const article of HELP_ARTICLES) {
      expect(VALID_ACCENTS.has(article.accent)).toBe(true);
    }
  });

  it('HELP_ARTICLES modulePath 以 / 开头', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.modulePath.startsWith('/')).toBe(true);
    }
  });

  it('HELP_ARTICLES sections 非空且 key 非空', () => {
    for (const article of HELP_ARTICLES) {
      expect(article.sections.length).toBeGreaterThan(0);
      for (const section of article.sections) {
        expect(section.key.length).toBeGreaterThan(0);
      }
    }
  });

  it('HELP_ARTICLES 共 9 篇', () => {
    expect(HELP_ARTICLES.length).toBe(9);
  });

  it('QUICK_START_STEPS 长度 = 5', () => {
    expect(QUICK_START_STEPS.length).toBe(5);
  });

  it('QUICK_START_STEPS to 以 / 开头', () => {
    for (const step of QUICK_START_STEPS) {
      expect(step.to.startsWith('/')).toBe(true);
    }
  });

  it('CONCEPT_CARDS 长度 = 6', () => {
    expect(CONCEPT_CARDS.length).toBe(6);
  });

  it('CONCEPT_CARDS iconKey 非空且在已知映射内', () => {
    const KNOWN_ICONS = new Set([
      'gauge', 'flame', 'repeat', 'award', 'clock', 'database',
    ]);
    for (const card of CONCEPT_CARDS) {
      expect(card.iconKey.length).toBeGreaterThan(0);
      expect(KNOWN_ICONS.has(card.iconKey)).toBe(true);
    }
  });

  it('FAQ_ITEMS >= 8', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(8);
  });

  it('FAQ_ITEMS key 非空', () => {
    for (const item of FAQ_ITEMS) {
      expect(item.questionKey.length).toBeGreaterThan(0);
      expect(item.answerKey.length).toBeGreaterThan(0);
    }
  });
});

// ===== i18n key 存在性守卫 =====
// helpContent 的 key 均经 t(`help.${key}`) 动态拼接待 i18next 解析，
// staticKeyGuard 无法静态捕获悬空引用（缺 key 时运行时回显原文 key）。
// 此处以 zh/en help.json 直接解析补齐该盲区。

/** 按 'a.b.c' 路径下钻 locale JSON；不存在或非字符串时返回 undefined */
function resolveKey(dict: unknown, key: string): string | undefined {
  let node: unknown = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' && node.length > 0 ? node : undefined;
}

/** 收集 helpContent 全部待解析 key（不含 help. 前缀） */
function collectDataKeys(): string[] {
  const keys: string[] = [];
  for (const article of HELP_ARTICLES) {
    keys.push(article.titleKey, article.introKey);
    for (const section of article.sections) {
      keys.push(section.key);
      for (const stepKey of section.stepKeys ?? []) keys.push(stepKey);
    }
  }
  for (const step of QUICK_START_STEPS) keys.push(step.key);
  for (const card of CONCEPT_CARDS) {
    keys.push(`${card.key}.title`, `${card.key}.body`);
  }
  for (const item of FAQ_ITEMS) keys.push(item.questionKey, item.answerKey);
  return keys;
}

describe('helpContent i18n key 存在性', () => {
  const dataKeys = collectDataKeys();

  it('数据层引用的 key 在 zh help.json 中均可解析为非空字符串', () => {
    const missing = dataKeys.filter((key) => resolveKey(helpZh, key) === undefined);
    expect(missing, `zh 缺失 key: ${missing.join(', ')}`).toEqual([]);
  });

  it('数据层引用的 key 在 en help.json 中均可解析为非空字符串', () => {
    const missing = dataKeys.filter((key) => resolveKey(helpEn, key) === undefined);
    expect(missing, `en 缺失 key: ${missing.join(', ')}`).toEqual([]);
  });
});

// ===== 文案数量与数据源绑定 =====
// hero.meta 以「9 篇模块教程 · 6 项系统规则 · 8 条常见问答」向用户承诺内容规模。
// 数组长度有上述断言把守，文案数字却无任何绑定：加一篇教程而忘了改 meta，
// 用户看到的仍是旧数字（AGENTS.md「单点事实源」禁止数值副本漂移）。
// 断言提取数字而非硬编码期望，措辞调整不会脆断。

describe('hero.meta 数量与数据源一致', () => {
  const expected = [HELP_ARTICLES.length, CONCEPT_CARDS.length, FAQ_ITEMS.length];

  it('zh 侧数字与数组长度一致', () => {
    const nums = (helpZh.hero.meta.match(/\d+/g) ?? []).map(Number);
    expect(nums, `hero.meta=${helpZh.hero.meta} 期望含 ${expected.join('/')}`).toEqual(expected);
  });

  it('en 侧数字与数组长度一致', () => {
    const nums = (helpEn.hero.meta.match(/\d+/g) ?? []).map(Number);
    expect(nums, `hero.meta=${helpEn.hero.meta} 期望含 ${expected.join('/')}`).toEqual(expected);
  });
});

// ===== 渲染层动效契约（源码级） =====
// DESIGN_LANGUAGE §8.2 要求 framer-motion 组件引用 motion.ts 预置 variants，
// 禁止内联 initial/animate 字面量。jsdom 断言不到 variants 取值，故扫描源文件。

describe('HelpHero 动效走共享 preset', () => {
  const source = readFileSync(
    fileURLToPath(new URL('../components/HelpHero.tsx', import.meta.url)),
    'utf8',
  );

  it('引用 motion.ts 的 SLIDE_DOWN 预设', () => {
    expect(source).toMatch(/import\s*\{[^}]*\bSLIDE_DOWN\b[^}]*\}\s*from\s*'@\/shared\/utils\/motion'/);
    expect(source).toMatch(/variants=\{SLIDE_DOWN\}/);
  });

  it('不得残留内联 initial/animate 字面量', () => {
    expect(source).not.toMatch(/initial=\{\{/);
    expect(source).not.toMatch(/animate=\{\{/);
  });
});
