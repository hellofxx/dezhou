import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Puzzle ActionBoard 三档配色守卫（DESIGN.md §5.5 / PRD 防答案暗示）。
 *
 * 断言口径：
 * - pre-answer 的 passive / standard / aggressive 三档必须由 --tier-* 单一来源驱动，
 *   边框、背景、标签、gauge、图标不得各自取色；
 * - pre-answer 三档不得引用 success / danger / clay 等反馈色，避免颜色暗示答案；
 * - aggressive 档使用 terra（陶土赭），与答题后的 danger 反馈保持可辨差异；
 * - correct / wrong / correct-reveal 只在答后覆盖 tier，并分别使用 success / danger；
 * - light 主题不得再为 action tile 写组件级补丁。
 *
 * 扫描面：globals.css 的 action-tile 选择器 + ActionBoard.tsx 的 tier 渲染实现。
 */

const CSS_PATH = fileURLToPath(new URL('../styles/globals.css', import.meta.url));
const ACTION_BOARD_PATH = fileURLToPath(
  new URL('../features/puzzle-trainer/components/ActionBoard.tsx', import.meta.url),
);

const CSS = fs.readFileSync(CSS_PATH, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const ACTION_BOARD = fs.readFileSync(ACTION_BOARD_PATH, 'utf8');

const TIERS = ['passive', 'standard', 'aggressive'] as const;

/** 取 `[data-tier="x"] { ... }` 的规则体；hover 变体不会被匹配（] 后必须是 {） */
function tierBody(tier: (typeof TIERS)[number]): string {
  const re = new RegExp(`\\.action-tile\\[data-tier="${tier}"\\]\\s*\\{([^}]*)\\}`, 'g');
  const matches = [...CSS.matchAll(re)];
  expect(matches.length, `缺少 .action-tile[data-tier="${tier}"] 规则`).toBeGreaterThanOrEqual(1);
  return matches.map((match) => match[1] ?? '').join('\n');
}

/** 取答后反馈态规则体 */
function feedbackBody(className: string): string {
  const re = new RegExp(`\\.action-tile\\.${className}\\s*\\{([^}]*)\\}`, 'g');
  const matches = [...CSS.matchAll(re)];
  expect(matches.length, `缺少 .action-tile.${className} 规则`).toBeGreaterThanOrEqual(1);
  return matches.map((match) => match[1] ?? '').join('\n');
}

describe('Puzzle ActionBoard tier 配色守卫', () => {
  it('扫描自检：CSS 与 ActionBoard 源码均有效', () => {
    expect(CSS.length).toBeGreaterThan(5000);
    expect(ACTION_BOARD).toContain('data-tier={tier}');
    expect(ACTION_BOARD).toContain('action-tile-icon');
  });

  it('三档均定义完整的 --tier-* 变量（边框/背景/标签/gauge 同源）', () => {
    for (const tier of TIERS) {
      const body = tierBody(tier);
      for (const token of [
        '--tier-ink',
        '--tier-border',
        '--tier-fill-1',
        '--tier-fill-2',
        '--tier-glow',
      ]) {
        expect(body, `${tier} 缺少 ${token}`).toContain(token);
      }
    }
  });

  it('pre-answer 三档不得引用 success / danger / clay 反馈色', () => {
    for (const tier of TIERS) {
      const body = tierBody(tier);
      for (const forbidden of [
        '--poker-success',
        '--poker-danger',
        '--success',
        '--danger',
        '--clay',
        '--clay-text',
      ]) {
        expect(body, `${tier} 不应引用 ${forbidden}`).not.toContain(forbidden);
      }
    }
  });

  it('aggressive 使用 terra，与答后 danger 保持区分', () => {
    const body = tierBody('aggressive');
    expect(body).toContain('--poker-terra');
    expect(body).not.toContain('--poker-danger');
  });

  it('答后反馈态才使用 success / danger', () => {
    expect(feedbackBody('action-tile--correct')).toContain('--poker-success');
    expect(feedbackBody('action-tile--wrong')).toContain('--poker-danger');
    expect(feedbackBody('action-tile--wrong')).toContain('--danger-text');
    expect(feedbackBody('action-tile--correct-reveal')).toContain('--poker-success');
  });

  it('light 主题不再为 action tile 写组件级补丁', () => {
    const lightActionOverrides = [
      ...CSS.matchAll(/html\[data-theme="light"\]\s+\.action-tile[^{]*\{/g),
    ];
    expect(lightActionOverrides).toHaveLength(0);
  });

  it('ActionBoard 不再维护重复色映射，颜色只经 CSS 变量', () => {
    expect(ACTION_BOARD).not.toContain('TIER_DOT');
    expect(ACTION_BOARD).not.toContain('TIER_ICON_COLOR');
    expect(ACTION_BOARD).not.toContain('dot--frost');
    expect(ACTION_BOARD).not.toContain('dot--clay');
  });
});
