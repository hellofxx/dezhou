/**
 * Chip 守卫：金额筹码必须提供本地化可访问名称；sm 尺寸无可见金额时退回通用名称。
 * 另守 token 集中化：红色筹码底色引用 --clay，而不是已废弃的 --poker-clay 别名。
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, type ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import i18n from '@/i18n/config';
import { Chip } from './Chip';

// jsdom 项目里 import.meta.url 是 http:// 形式，fileURLToPath 会抛错，
// 故按 vitest 工作目录（仓库根）定位源文件。
const CHIP_SOURCE = readFileSync(path.join(process.cwd(), 'src/shared/components/poker/Chip.tsx'), 'utf8');

describe('Chip', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(async () => {
    await i18n.changeLanguage('zh');
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderSvg = (node: ReactElement) => {
    act(() => {
      root.render(node);
    });
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    return svg as SVGSVGElement;
  };

  it('localizes the amount into the accessible name', () => {
    expect(renderSvg(<Chip amount={250} />).getAttribute('aria-label')).toBe('筹码 250');
  });

  it('abbreviates thousands in the accessible name', () => {
    expect(renderSvg(<Chip amount={1500} />).getAttribute('aria-label')).toBe('筹码 1.5k');
  });

  it('falls back to the generic chip label for the sm size (no visible amount)', () => {
    expect(renderSvg(<Chip amount={250} size="sm" />).getAttribute('aria-label')).toBe('筹码');
  });

  it('renders the red base token as --clay (not the retired --poker-clay alias)', () => {
    renderSvg(<Chip amount={25} color="red" />);

    const stopColors = Array.from(container.querySelectorAll('stop')).map((stop) =>
      stop.getAttribute('stop-color'),
    );
    expect(stopColors).toContain('var(--clay)');
    expect(CHIP_SOURCE).toMatch(/red:\s*\{\s*base:\s*'var\(--clay\)'/);
    expect(CHIP_SOURCE).not.toContain('--poker-clay');
  });
});
