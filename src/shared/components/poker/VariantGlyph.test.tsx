/**
 * VariantGlyph 契约：变体 → Lucide 图标一一映射，图标退出可访问性树。
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VariantGlyph } from './VariantGlyph';
import type { GameVariant } from '@/shared/types/poker';

const CASES: Array<{ variant: GameVariant; lucideClass: string }> = [
  { variant: 'standard', lucideClass: 'lucide-spade' },
  { variant: 'short-deck', lucideClass: 'lucide-zap' },
  { variant: 'heads-up', lucideClass: 'lucide-swords' },
];

describe('VariantGlyph', () => {
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

  it('三种变体映射到对应 Lucide 图标且退出可访问性树', () => {
    for (const { variant, lucideClass } of CASES) {
      render(<VariantGlyph variant={variant} />);
      expect(svg().getAttribute('class')).toContain(lucideClass);
      expect(svg().getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('默认 16px，可覆盖尺寸，className 透传', () => {
    render(<VariantGlyph variant="standard" />);
    expect(svg().getAttribute('width')).toBe('16');
    expect(svg().getAttribute('height')).toBe('16');

    render(<VariantGlyph variant="standard" size={24} className="probe-class" />);
    expect(svg().getAttribute('width')).toBe('24');
    expect(svg().getAttribute('class')).toContain('shrink-0');
    expect(svg().getAttribute('class')).toContain('probe-class');
  });
});