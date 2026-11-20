/**
 * OpponentGlyph 契约：对手画像 iconId → Lucide 图标一一映射，图标退出可访问性树。
 *
 * 注：HelpCircle 在 lucide-react v1 是 circle-question-mark 的别名，
 * 实际渲染类名为 lucide-circle-question-mark；本测试同时充当 lucide 升级金丝雀。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { OpponentGlyph } from './OpponentGlyph';
import type { OpponentIconId } from '@/shared/types/opponent';

const CASES: Array<{ iconId: OpponentIconId; lucideClass: string }> = [
  { iconId: 'target', lucideClass: 'lucide-tag' },
  { iconId: 'flame', lucideClass: 'lucide-flame' },
  { iconId: 'snowflake', lucideClass: 'lucide-snowflake' },
  { iconId: 'zap', lucideClass: 'lucide-zap' },
  { iconId: 'phone', lucideClass: 'lucide-phone' },
  { iconId: 'help', lucideClass: 'lucide-circle-question-mark' },
];

describe('OpponentGlyph', () => {
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

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const svg = () => container.querySelector('svg')!;

  it('六种画像图标映射正确且退出可访问性树', () => {
    for (const { iconId, lucideClass } of CASES) {
      render(<OpponentGlyph iconId={iconId} />);
      expect(svg().getAttribute('class')).toContain(lucideClass);
      expect(svg().getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('默认 16px，可覆盖尺寸', () => {
    render(<OpponentGlyph iconId="target" />);
    expect(svg().getAttribute('width')).toBe('16');

    render(<OpponentGlyph iconId="target" size={20} />);
    expect(svg().getAttribute('width')).toBe('20');
  });
});