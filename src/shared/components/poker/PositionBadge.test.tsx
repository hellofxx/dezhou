/**
 * PositionBadge 契约：
 * - 颜色不是唯一语义通道：title 与 aria-label 同时提供「位置 · 分组」文本
 * - active 追加「激活」并切换到实底档
 * - 可见文本仅位置缩写
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import i18n from '@/i18n/config';
import { Position } from '@/shared/types/position';
import { PositionBadge } from './PositionBadge';

const CASES = [
  { position: Position.UTG, groupKey: 'common.positionGroup.early' },
  { position: Position.HJ, groupKey: 'common.positionGroup.middle' },
  { position: Position.BTN, groupKey: 'common.positionGroup.late' },
  { position: Position.BB, groupKey: 'common.positionGroup.blinds' },
];

describe('PositionBadge', () => {
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

  const badge = () => container.firstElementChild as HTMLElement;

  it('title 与 aria-label 提供「位置 · 分组」文本，可见文本仅位置缩写', () => {
    for (const { position, groupKey } of CASES) {
      render(<PositionBadge position={position} />);
      const expected = `${position} · ${i18n.t(groupKey)}`;
      expect(badge().getAttribute('title')).toBe(expected);
      expect(badge().getAttribute('aria-label')).toBe(expected);
      expect(badge().textContent).toBe(position);
    }
  });

  it('active 追加「激活」并切换到实底档', () => {
    render(<PositionBadge position={Position.BTN} active />);
    expect(badge().getAttribute('aria-label')).toBe(
      `${Position.BTN} · ${i18n.t('common.positionGroup.late')} · ${i18n.t('common.ui.active')}`,
    );
    expect(badge().className).toContain('bg-[var(--sage-fill)]');
  });

  it('分组配色映射：early=clay / middle=brass / late=sage', () => {
    render(<PositionBadge position={Position.UTG} />);
    expect(badge().className).toContain('bg-[var(--clay)]/15');
    expect(badge().className).toContain('text-[var(--clay-text)]');

    render(<PositionBadge position={Position.HJ} />);
    expect(badge().className).toContain('bg-[var(--brass)]/15');
    expect(badge().className).toContain('text-[var(--brass-bright)]');

    render(<PositionBadge position={Position.BTN} />);
    expect(badge().className).toContain('bg-[var(--sage)]/15');
    expect(badge().className).toContain('text-[var(--sage-text)]');
  });

  it('className 透传', () => {
    render(<PositionBadge position={Position.CO} className="probe-class" />);
    expect(badge().className).toContain('probe-class');
  });
});