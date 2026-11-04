import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * 浅色主题组件补丁守卫（DESIGN.md §2.8 白天牌室）。
 *
 * 目标：light 主题只改 token 与「物理物件」白名单，不再逐个组件写 surface 补丁。
 * 现状保留 16 个 light 选择器（说明文字、FAQ/概念卡、模块卡、推荐项、streak rail、
 * 环境光与纸张边界），全部登记在 ALLOWED_LIGHT_SELECTORS；新增补丁必须先删一个或
 * 在设计文档登记理由。黄铜字面 rgba 已清零，黑色字面 rgba 按 41 条棘轮锁定。
 *
 * 扫描面：src/styles/globals.css。
 */

const CSS_PATH = fileURLToPath(new URL('../styles/globals.css', import.meta.url));
const CSS = fs.readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** 允许保留的 light 组件级选择器（不含裸 token 块 html[data-theme="light"] {） */
const ALLOWED_LIGHT_SELECTORS = [
  '.concept-card',
  '.concept-card-body',
  '.faq-item',
  '.faq-item.open',
  '.faq-item:hover',
  '.faq-item-panel',
  '.felt-ambient',
  '.first-visit-banner',
  '.module-card',
  '.puzzle-card',
  '.quick-path-node-num',
  '.rec-item',
  '.rp-metric',
  '.streak-rail',
  'body::after',
  'body::before',
].sort();

/** 黄铜字面 rgba 已全部改为 color-mix(var(--brass))；只减不增 */
const MAX_BRASS_RGBA = 0;
/** 黑色字面 rgba 保留为阴影/压暗层；当前 41 条，只减不增 */
const MAX_BLACK_RGBA = 41;

function normalizedLightSelectors(): string[] {
  const matches = [...CSS.matchAll(/html\[data-theme="light"\]\s+([^{]+)\{/g)];
  return Array.from(
    new Set(
      matches
        .map((match) => (match[1] ?? '').trim().replace(/\s+/g, ' '))
        .filter((selector) => selector.length > 0),
    ),
  ).sort();
}

function countMatches(pattern: RegExp): number {
  return [...CSS.matchAll(pattern)].length;
}

describe('light 主题组件补丁守卫（白天牌室）', () => {
  it('扫描自检：CSS 与 light 选择器数量有效', () => {
    expect(CSS.length).toBeGreaterThan(5000);
    const selectors = normalizedLightSelectors();
    expect(selectors.length, 'light 选择器解析失效').toBeGreaterThanOrEqual(15);
  });

  it('light 组件级选择器与白名单完全一致（新增补丁必须先登记）', () => {
    expect(normalizedLightSelectors()).toEqual(ALLOWED_LIGHT_SELECTORS);
  });

  it('黄铜字面 rgba 已清零（统一走 color-mix / var(--brass)）', () => {
    const brassRgba = countMatches(
      /rgba\(\s*(?:201\s*,\s*162\s*,\s*94|232\s*,\s*201\s*,\s*126|161\s*,\s*121\s*,\s*45)\s*,/g,
    );
    expect(brassRgba, `黄铜字面 rgba 计数 ${brassRgba} > ${MAX_BRASS_RGBA}`).toBeLessThanOrEqual(
      MAX_BRASS_RGBA,
    );
  });

  it('黑色字面 rgba 不超过棘轮上限（阴影/压暗层）', () => {
    const blackRgba = countMatches(/rgba\(\s*0\s*,\s*0\s*,\s*0\s*,/g);
    expect(blackRgba, `黑色字面 rgba 计数 ${blackRgba} > ${MAX_BLACK_RGBA}`).toBeLessThanOrEqual(
      MAX_BLACK_RGBA,
    );
  });

  it('semantic room token 与 hero 渐变在 :root / light 两侧均有定义', () => {
    for (const token of [
      '--room-page',
      '--room-surface',
      '--room-surface-raised',
      '--room-line',
      '--room-ink',
      '--room-ink-dim',
      '--room-ink-muted',
      '--room-accent-text',
      '--room-hairline',
    ]) {
      expect(CSS, `:root 缺少 ${token}`).toContain(`${token}:`);
    }
    const gradientDefinitions = CSS.match(/--hero-surface-gradient:/g) ?? [];
    const questionDefinitions = CSS.match(/--question-card-gradient:/g) ?? [];
    expect(gradientDefinitions.length, 'hero 渐变需要 :root 与 light 两侧定义').toBeGreaterThanOrEqual(2);
    expect(questionDefinitions.length, 'question card 渐变需要 :root 与 light 两侧定义').toBeGreaterThanOrEqual(2);
  });
});
