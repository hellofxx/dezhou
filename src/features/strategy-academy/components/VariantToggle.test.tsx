/**
 * VariantToggle 契约（游戏变体分段控件）：
 * - role=group + 本地化可访问名；每项 aria-pressed 只对当前变体为 true
 * - 点击回传变体 id；省略 onSelect 时点击不抛错
 * - variants 可裁剪为子集
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { VariantToggle } from './VariantToggle';

describe('VariantToggle', () => {
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

  const render = (node: React.ReactNode) => {
    act(() => {
      root.render(node);
    });
  };

  const group = () => container.firstElementChild as HTMLElement;
  const buttons = () => Array.from(group().querySelectorAll<HTMLButtonElement>('button'));

  it('role=group + 本地化可访问名，默认渲染三种变体', () => {
    render(<VariantToggle />);

    expect(group().getAttribute('role')).toBe('group');
    expect(group().getAttribute('aria-label')).toBe(i18n.t('variant.selectVariant'));

    const items = buttons();
    expect(items).toHaveLength(3);
    expect(items.map((btn) => btn.textContent)).toEqual([
      i18n.t('variant.name.standard'),
      i18n.t('variant.name.short-deck'),
      i18n.t('variant.name.heads-up'),
    ]);
  });

  it('aria-pressed 只对当前变体为 true', () => {
    render(<VariantToggle active="short-deck" />);
    expect(buttons().map((btn) => btn.getAttribute('aria-pressed'))).toEqual([
      'false',
      'true',
      'false',
    ]);
  });

  it('点击回传变体 id；省略 onSelect 点击不抛错', () => {
    const onSelect = vi.fn();
    render(<VariantToggle onSelect={onSelect} />);
    act(() => {
      buttons()[1]!.click();
    });
    expect(onSelect).toHaveBeenCalledWith('short-deck');

    render(<VariantToggle />);
    expect(() => {
      act(() => {
        buttons()[2]!.click();
      });
    }).not.toThrow();
  });

  it('variants 子集只渲染对应项', () => {
    render(<VariantToggle variants={['heads-up']} active="heads-up" />);
    const items = buttons();
    expect(items).toHaveLength(1);
    expect(items[0]!.textContent).toBe(i18n.t('variant.name.heads-up'));
    expect(items[0]!.getAttribute('aria-pressed')).toBe('true');
  });
});