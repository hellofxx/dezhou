/**
 * 主题图标映射测试（S2 视觉一致性：emoji → Lucide）。
 *
 * 契约：
 *  - PUZZLE_THEMES 的每个主题都能取到 Lucide 图标组件（无 emoji 回落）；
 *  - 10 个主题图标互不重复，且均为纯装饰（渲染处 aria-hidden、无文本替代）；
 *  - 图标为标准 Lucide 24 基座 svg，可由 Tailwind 尺寸类缩放（与卡片/标题视觉相当）。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { getThemeIcon } from './themeIcons';
import { PUZZLE_THEMES } from '../data/puzzleBank';

describe('主题图标映射', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it('全部主题都有图标，且图标互不重复（语义可区分）', () => {
    const names = PUZZLE_THEMES.map((meta) => getThemeIcon(meta.id).displayName);

    expect(names).toHaveLength(PUZZLE_THEMES.length);
    for (const name of names) {
      expect(typeof name).toBe('string');
      expect(name).not.toBe('');
    }
    expect(new Set(names).size).toBe(names.length);
  });

  it('图标渲染为 24 基座 svg，可被尺寸类缩放且 aria-hidden（纯装饰）', () => {
    const Icon = getThemeIcon('bluff');
    act(() => {
      root.render(<Icon className="w-4 h-4" aria-hidden />);
    });

    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('class')).toContain('w-4');
    expect(svg?.getAttribute('class')).toContain('lucide-drama');
    // 图标不带文本内容，语义由相邻主题名承载
    expect(svg?.textContent).toBe('');
  });
});
